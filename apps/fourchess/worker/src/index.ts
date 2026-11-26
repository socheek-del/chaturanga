import { RoomCode } from '@chaturanga/protocol';
import { generateRoomCode, newGuest, signToken, verifyToken, USER_HEADER } from '@chaturanga/server-kit';
import { Game, type Player } from '@chaturanga/fourchess';
import { DurableObject } from 'cloudflare:workers';
import { Hono } from 'hono';
import { MoveIntent, seats, type RoomMessage, type RoomView } from '../../online';
import { applyIntent, createRoom, joinRoom, seatFor, type RoomState } from './roomState';

interface Env {
  ASSETS: Fetcher;
  ROOMS: DurableObjectNamespace<FourChessRoom>;
  AUTH_SECRET: string;
  DB: D1Database;
}

const roomKey = 'room';
const occupied = (room: RoomState): number => seats.filter((seat) => room.players[seat]).length;

export class FourChessRoom extends DurableObject<Env> {
  async init(code: string, host: string): Promise<boolean> {
    return this.ctx.storage.transaction(async (storage) => {
      if (await storage.get(roomKey)) return false;
      await storage.put(roomKey, createRoom(code, host, Date.now()));
      return true;
    });
  }

  async summary(user: string): Promise<{ occupied: number; canJoin: boolean } | null> {
    const room = await this.ctx.storage.get<RoomState>(roomKey);
    return room ? { occupied: occupied(room), canJoin: !!seatFor(room, user) || occupied(room) < seats.length } : null;
  }

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get('upgrade')?.toLowerCase() !== 'websocket') return new Response(null, { status: 426 });
    const user = request.headers.get(USER_HEADER);
    if (!user) return new Response(null, { status: 401 });
    const joined = await this.ctx.storage.transaction(async (storage) => {
      const room = await storage.get<RoomState>(roomKey);
      if (!room) return { status: 404 } as const;
      const result = joinRoom(room, user);
      if (!result) return { status: 409 } as const;
      if (result.room !== room) await storage.put(roomKey, result.room);
      return result;
    });
    if ('status' in joined) return new Response(null, { status: joined.status });
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair) as [WebSocket, WebSocket];
    this.ctx.acceptWebSocket(server, [joined.seat]);
    server.serializeAttachment(user);
    this.broadcast((await this.ctx.storage.get<RoomState>(roomKey)) ?? joined.room);
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(socket: WebSocket, raw: string | ArrayBuffer): Promise<void> {
    const user = socket.deserializeAttachment() as string | null;
    const intent = typeof raw === 'string' && raw.length <= 512 ? parseIntent(raw) : null;
    if (!intent || !user) {
      this.send(socket, { type: 'error', error: 'bad-message' });
      return;
    }
    const result = await this.ctx.storage.transaction(async (storage) => {
      const room = await storage.get<RoomState>(roomKey);
      const seat = room && seatFor(room, user);
      if (!room || !seat) return { error: 'room-full' } as const;
      const applied = applyIntent(room, seat, intent);
      if ('room' in applied) await storage.put(roomKey, applied.room);
      return applied;
    });
    if ('error' in result) {
      this.send(socket, { type: 'error', error: result.error });
      return;
    }
    this.broadcast((await this.ctx.storage.get<RoomState>(roomKey)) ?? result.room);
    if (result.finished) await this.archive(result.room);
  }

  async webSocketClose(socket: WebSocket): Promise<void> {
    const room = await this.ctx.storage.get<RoomState>(roomKey);
    if (room) this.broadcast(room, socket);
  }

  async webSocketError(socket: WebSocket): Promise<void> {
    await this.webSocketClose(socket);
  }

  private async archive(room: RoomState): Promise<void> {
    const status = new Game(room.fen).status();
    try {
      await this.env.DB.prepare('INSERT OR IGNORE INTO games (id, moves, result_json) VALUES (?, ?, ?)')
        .bind(`${room.code}-${room.createdAt}`, room.moves.join(' '), JSON.stringify(status)).run();
    } catch (error) {
      console.error('Could not archive completed room', error);
    }
  }

  private broadcast(room: RoomState, closed?: WebSocket): void {
    const sockets = this.ctx.getWebSockets().filter((socket) => socket !== closed && socket.readyState === WebSocket.OPEN);
    const active = new Set(sockets.map((socket) => socket.deserializeAttachment()));
    const presence = {} as RoomView['presence'];
    for (const seat of seats) {
      const user = room.players[seat];
      presence[seat] = user === null ? 'empty' : active.has(user) ? 'online' : 'offline';
    }
    for (const socket of sockets) {
      const user = socket.deserializeAttachment() as string | null;
      const you: Player | undefined = user ? seatFor(room, user) : undefined;
      if (you) this.send(socket, { type: 'state', code: room.code, fen: room.fen, moves: room.moves, you, presence });
    }
  }

  private send(socket: WebSocket, message: RoomMessage): void {
    try {
      socket.send(JSON.stringify(message));
    } catch {
      // A peer can disconnect after the ready-state check.
    }
  }
}

function parseIntent(raw: string): MoveIntent | null {
  try {
    const parsed = MoveIntent.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

const app = new Hono<{ Bindings: Env }>();
const room = (env: Env, code: string) => env.ROOMS.get(env.ROOMS.idFromName(code));
const fromBearer = (header: string | undefined, secret: string) => {
  const token = header?.match(/^Bearer (.+)$/i)?.[1];
  return token ? verifyToken(token, secret) : Promise.resolve(null);
};

app.get('/api/health', (context) => context.json({ ok: true, game: 'fourchess' }));
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
    if (await room(context.env, code).init(code, user.id)) return context.json({ code }, 201);
  }
  return context.json({ error: 'unavailable' }, 503);
});
app.get('/api/games/:code', async (context) => {
  const code = context.req.param('code').toUpperCase();
  if (!RoomCode.safeParse(code).success) return context.json({ error: 'not-found' }, 404);
  const user = await fromBearer(context.req.header('authorization'), context.env.AUTH_SECRET);
  if (!user) return context.json({ error: 'unauthorized' }, 401);
  const summary = await room(context.env, code).summary(user.id);
  if (!summary) return context.json({ error: 'not-found' }, 404);
  return summary.canJoin ? context.json({ occupied: summary.occupied }) : context.json({ error: 'room-full' }, 409);
});
app.get('/ws/game/:code', async (context) => {
  const code = context.req.param('code').toUpperCase();
  if (!RoomCode.safeParse(code).success) return context.text('Not found', 404);
  const token = context.req.query('token');
  const user = token && await verifyToken(token, context.env.AUTH_SECRET);
  if (!user) return context.text('Unauthorized', 401);
  const request = new Request(context.req.raw);
  request.headers.set(USER_HEADER, user.id);
  return room(context.env, code).fetch(request);
});
app.all('/api/*', (context) => context.json({ error: 'not-found' }, 404));

export default { fetch: app.fetch } satisfies ExportedHandler<Env>;
