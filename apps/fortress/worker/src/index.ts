import { RoomCode } from '@chaturanga/protocol';
import { generateRoomCode, newGuest, signToken, verifyToken, USER_HEADER } from '@chaturanga/server-kit';
import { Game } from '@chaturanga/fortress';
import { DurableObject } from 'cloudflare:workers';
import { Hono } from 'hono';
import { MoveIntent, RoomView, seats, type RoomMessage } from '../../online';
import { applyMove, createRoom, joinRoom, seatFor, type RoomState } from './roomState';

interface Env {
  ASSETS: Fetcher;
  ROOMS: DurableObjectNamespace<FortressRoom>;
  AUTH_SECRET: string;
  DB: D1Database;
}

const ROOM_KEY = 'room';
const occupied = (room: RoomState): number => seats.filter((seat) => room.players[seat] !== null).length;
const roomFor = (env: Env, code: string) => env.ROOMS.get(env.ROOMS.idFromName(code));

export class FortressRoom extends DurableObject<Env> {
  async init(code: string, host: string): Promise<boolean> {
    return this.ctx.storage.transaction(async (storage) => {
      if (await storage.get(ROOM_KEY)) return false;
      await storage.put(ROOM_KEY, createRoom(code, host, Date.now()));
      return true;
    });
  }

  async summary(user: string): Promise<{ occupied: number; canJoin: boolean } | null> {
    const room = await this.ctx.storage.get<RoomState>(ROOM_KEY);
    return room
      ? { occupied: occupied(room), canJoin: !!seatFor(room, user) || occupied(room) < seats.length }
      : null;
  }

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get('upgrade')?.toLowerCase() !== 'websocket')
      return new Response(null, { status: 426 });
    const user = request.headers.get(USER_HEADER);
    if (!user) return new Response(null, { status: 401 });
    const joined = await this.ctx.storage.transaction(async (storage) => {
      const room = await storage.get<RoomState>(ROOM_KEY);
      if (!room) return { status: 404 } as const;
      const result = joinRoom(room, user);
      if (!result) return { status: 409 } as const;
      if (result.room !== room) await storage.put(ROOM_KEY, result.room);
      return result;
    });
    if ('status' in joined) return new Response(null, { status: joined.status });
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair) as [WebSocket, WebSocket];
    this.ctx.acceptWebSocket(server, [joined.seat]);
    server.serializeAttachment(user);
    this.broadcast((await this.ctx.storage.get<RoomState>(ROOM_KEY)) ?? joined.room);
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(socket: WebSocket, raw: string | ArrayBuffer): Promise<void> {
    const user = socket.deserializeAttachment() as string | null;
    const move = typeof raw === 'string' && raw.length <= 512 ? parseMove(raw) : null;
    if (!move || !user) {
      this.send(socket, { type: 'error', error: 'bad-message' });
      return;
    }
    const result = await this.ctx.storage.transaction(async (storage) => {
      const room = await storage.get<RoomState>(ROOM_KEY);
      const seat = room && seatFor(room, user);
      if (!room || !seat) return { error: 'room-full' } as const;
      const applied = applyMove(room, seat, move);
      if ('room' in applied) await storage.put(ROOM_KEY, applied.room);
      return applied;
    });
    if ('error' in result) {
      this.send(socket, { type: 'error', error: result.error });
      return;
    }
    this.broadcast((await this.ctx.storage.get<RoomState>(ROOM_KEY)) ?? result.room);
    if (result.finished) await this.archive(result.room);
  }

  async webSocketClose(socket: WebSocket): Promise<void> {
    const room = await this.ctx.storage.get<RoomState>(ROOM_KEY);
    if (room) this.broadcast(room, socket);
  }

  async webSocketError(socket: WebSocket): Promise<void> {
    await this.webSocketClose(socket);
  }

  private async archive(room: RoomState): Promise<void> {
    const status = new Game(room.fen).status();
    try {
      await this.env.DB.prepare(
        'INSERT OR IGNORE INTO games (id, moves, winner, result, ended_at) VALUES (?, ?, ?, ?, ?)',
      )
        .bind(
          `${room.code}-${room.createdAt}`,
          room.moves.join(' '),
          status.kind === 'checkmate' ? status.winner : null,
          status.kind,
          Date.now(),
        )
        .run();
    } catch (error) {
      console.error('Could not archive finished Fortress Chess room', error);
    }
  }

  private broadcast(room: RoomState, closed?: WebSocket): void {
    const sockets = this.ctx
      .getWebSockets()
      .filter((socket) => socket !== closed && socket.readyState === WebSocket.OPEN);
    const active = new Set(sockets.map((socket) => socket.deserializeAttachment()));
    const presence = {} as RoomView['presence'];
    for (const seat of seats) {
      const user = room.players[seat];
      presence[seat] = user === null ? 'empty' : active.has(user) ? 'online' : 'offline';
    }
    for (const socket of sockets) {
      const user = socket.deserializeAttachment() as string | null;
      const you = user ? seatFor(room, user) : undefined;
      if (you)
        this.send(socket, {
          type: 'state',
          code: room.code,
          fen: room.fen,
          moves: room.moves,
          you,
          presence,
        });
    }
  }

  private send(socket: WebSocket, message: RoomMessage): void {
    try {
      socket.send(JSON.stringify(message));
    } catch {
      /* A peer can disconnect after the ready-state check. */
    }
  }
}

function parseMove(raw: string): MoveIntent | null {
  try {
    const parsed = MoveIntent.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

const app = new Hono<{ Bindings: Env }>();
const fromBearer = (header: string | undefined, secret: string) => {
  const token = header?.match(/^Bearer (.+)$/i)?.[1];
  return token ? verifyToken(token, secret) : Promise.resolve(null);
};

app.get('/api/health', (context) => context.json({ ok: true, game: 'fortress' }));
app.post('/api/guest', async (context) => {
  const user = newGuest();
  return context.json({ user, token: await signToken(user, context.env.AUTH_SECRET) });
});
app.get('/api/me', async (context) => {
  const user = await fromBearer(context.req.header('authorization'), context.env.AUTH_SECRET);
  return user ? context.json(user) : context.json({ error: 'unauthorized' }, 401);
});
app.post('/api/games', async (context) => {
  const user = await fromBearer(context.req.header('authorization'), context.env.AUTH_SECRET);
  if (!user) return context.json({ error: 'unauthorized' }, 401);
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateRoomCode();
    if (await roomFor(context.env, code).init(code, user.id)) return context.json({ code }, 201);
  }
  return context.json({ error: 'unavailable' }, 503);
});
app.get('/api/games/:code', async (context) => {
  const code = context.req.param('code').toUpperCase();
  if (!RoomCode.safeParse(code).success) return context.json({ error: 'not-found' }, 404);
  const user = await fromBearer(context.req.header('authorization'), context.env.AUTH_SECRET);
  if (!user) return context.json({ error: 'unauthorized' }, 401);
  const summary = await roomFor(context.env, code).summary(user.id);
  if (!summary) return context.json({ error: 'not-found' }, 404);
  return summary.canJoin
    ? context.json({ occupied: summary.occupied })
    : context.json({ error: 'room-full' }, 409);
});
app.get('/ws/game/:code', async (context) => {
  const code = context.req.param('code').toUpperCase();
  if (!RoomCode.safeParse(code).success) return context.text('Not found', 404);
  const token = context.req.query('token');
  const user = token && (await verifyToken(token, context.env.AUTH_SECRET));
  if (!user) return context.text('Unauthorized', 401);
  const request = new Request(context.req.raw);
  request.headers.set(USER_HEADER, user.id);
  return roomFor(context.env, code).fetch(request);
});
app.all('/api/*', (context) => context.json({ error: 'not-found' }, 404));
app.all('*', (context) => context.env.ASSETS.fetch(context.req.raw));

export default { fetch: app.fetch } satisfies ExportedHandler<Env>;
