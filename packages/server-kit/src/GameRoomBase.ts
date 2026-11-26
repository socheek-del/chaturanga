import { ClientMessage, type Color, type PublicUser, type RoomSummary, type ServerMessage, type TimeControl } from '@chaturanga/protocol';
import type { Variant } from '@chaturanga/rules-core';
import { DurableObject } from 'cloudflare:workers';
import { generateRoomCode } from './roomCode';
import { applyMessage, createRoom, join, leave, nextAlarm, type RoomState, roomStatus, settle, snapshot } from './roomLogic';

/** Header the Worker uses to hand the authenticated user to a Durable Object. */
export const USER_HEADER = 'x-chaturanga-user';

export interface InitOptions {
  code: string;
  creator: PublicUser;
  color: Color | 'random';
  timeControl: TimeControl | null;
  opponent?: PublicUser;
  rated?: boolean;
  startFen?: string;
}

/** The part of a room stub this class calls; a product's own GameRoom satisfies it. */
export interface RoomStub {
  init(options: InitOptions): Promise<boolean>;
}

export interface RoomEnv {
  GAME_ROOM: {
    idFromName(name: string): DurableObjectId;
    get(id: DurableObjectId): RoomStub;
  };
  /** How long a disconnected player has to come back before losing by abandonment. */
  RECONNECT_GRACE_MS?: string;
}

interface Attachment {
  user: PublicUser;
  color: Color | null;
}

const DEFAULT_GRACE_MS = 60_000;

/**
 * One Durable Object per game room, addressed by its 6-character code. Uses the WebSocket
 * Hibernation API: all state lives in storage and socket attachments, so the object can be
 * evicted between moves without dropping players.
 *
 * A product subclasses this, names its `variant`, and may override `onFinished` to store the game.
 */
export abstract class GameRoomBase<E extends RoomEnv> extends DurableObject<E> {
  /** The rules this room plays. Every move is replayed through it before it is accepted. */
  protected abstract readonly variant: Variant;

  /** Called once, when a game reaches a result. Failures here must never break the game. */
  protected async onFinished(_room: RoomState): Promise<void> {}

  /** In-memory cache; undefined after construction (including wake-up from hibernation). */
  private cached: RoomState | null | undefined;

  private async load(): Promise<RoomState | null> {
    if (this.cached === undefined) this.cached = (await this.ctx.storage.get<RoomState>('room')) ?? null;
    return this.cached;
  }

  private async save(room: RoomState): Promise<void> {
    const justFinished = !this.cached?.result && !!room.result;
    this.cached = room;
    await this.ctx.storage.put('room', room);
    const at = nextAlarm(room);
    if (at === null) await this.ctx.storage.deleteAlarm();
    else await this.ctx.storage.setAlarm(at);
    if (justFinished) {
      try {
        await this.onFinished(room);
      } catch (err) {
        console.error('recording finished game failed', err);
      }
    }
  }

  /** RPC: create the room. Returns false if this code is already taken. */
  async init(options: InitOptions): Promise<boolean> {
    if (await this.load()) return false;
    const color: Color = options.color === 'random' ? (Math.random() < 0.5 ? 'w' : 'b') : options.color;
    await this.save(createRoom(this.variant, { ...options, color, now: Date.now() }));
    return true;
  }

  /** RPC: public room info for the join screen. */
  async summary(): Promise<RoomSummary | null> {
    const room = await this.load();
    if (!room) return null;
    const status = roomStatus(room);
    return {
      code: room.code,
      status,
      timeControl: room.timeControl,
      openColor: status === 'waiting' ? (room.players.w ? 'b' : 'w') : null,
    };
  }

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get('Upgrade') !== 'websocket') return new Response('Expected WebSocket', { status: 426 });
    const header = request.headers.get(USER_HEADER);
    if (!header) return new Response('Unauthorized', { status: 401 });
    const user = JSON.parse(header) as PublicUser;

    const stored = await this.load();
    if (!stored) return new Response('Room not found', { status: 404 });
    const now = Date.now();
    const { room, color } = join(this.variant, settle(stored, now), user, now);

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair) as [WebSocket, WebSocket];
    this.ctx.acceptWebSocket(server, [user.id]);
    server.serializeAttachment({ user, color } satisfies Attachment);

    await this.save(room);
    this.broadcast(room, now);
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer): Promise<void> {
    const attachment = ws.deserializeAttachment() as Attachment;
    const room = await this.load();
    if (!room) return;

    let message: ClientMessage;
    try {
      const parsed = ClientMessage.safeParse(JSON.parse(typeof raw === 'string' ? raw : new TextDecoder().decode(raw)));
      if (!parsed.success) return this.send(ws, { type: 'error', code: 'bad_message' });
      message = parsed.data;
    } catch {
      return this.send(ws, { type: 'error', code: 'bad_message' });
    }

    const now = Date.now();
    if (message.type === 'ping') return this.send(ws, { type: 'pong', t: message.t, serverTime: now });

    const result = applyMessage(this.variant, room, attachment.color, message, now, generateRoomCode);
    let next = result.room;
    if (result.rematch) next = await this.createRematch(next);
    if (result.error) {
      this.send(ws, { type: 'error', code: result.error });
      // Concurrent actions may make an optimistic client stale; immediately replace its local history.
      if (result.error === 'stale_ply') {
        this.send(ws, { type: 'state', you: attachment.color, game: snapshot(next, now, this.connected()) });
      }
    }
    if (next !== room) {
      await this.save(next);
      this.broadcast(next, now);
    }
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    const attachment = ws.deserializeAttachment() as Attachment | null;
    const room = await this.load();
    if (!room || !attachment?.color) return;
    const stillConnected = this.ctx
      .getWebSockets(attachment.user.id)
      .some((other) => other !== ws && other.readyState === WebSocket.OPEN);
    if (stillConnected) return;
    const now = Date.now();
    const next = leave(settle(room, now), attachment.color, now, Number(this.env.RECONNECT_GRACE_MS ?? DEFAULT_GRACE_MS));
    if (next !== room) {
      await this.save(next);
      this.broadcast(next, now, ws);
    }
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    await this.webSocketClose(ws);
  }

  async alarm(): Promise<void> {
    const room = await this.load();
    if (!room) return;
    const now = Date.now();
    const next = settle(room, now);
    await this.save(next);
    if (next !== room) this.broadcast(next, now);
  }

  /** Both players accepted a rematch: open the next room with colours swapped. */
  private async createRematch(room: RoomState): Promise<RoomState> {
    let code = room.nextCode!;
    for (let attempt = 0; attempt < 5; attempt++) {
      const stub = this.env.GAME_ROOM.get(this.env.GAME_ROOM.idFromName(code));
      const created = await stub.init({
        code,
        creator: room.players.b!,
        color: 'w',
        timeControl: room.timeControl,
        opponent: room.players.w!,
        rated: room.rated,
        startFen: room.startFen,
      });
      if (created) return { ...room, nextCode: code };
      code = generateRoomCode();
    }
    return { ...room, nextCode: null };
  }

  private connected(exclude?: WebSocket): Record<Color, boolean> {
    const connected: Record<Color, boolean> = { w: false, b: false };
    for (const ws of this.ctx.getWebSockets()) {
      if (ws === exclude || ws.readyState !== WebSocket.OPEN) continue;
      const attachment = ws.deserializeAttachment() as Attachment | null;
      if (attachment?.color) connected[attachment.color] = true;
    }
    return connected;
  }

  private broadcast(room: RoomState, now: number, exclude?: WebSocket): void {
    const connected = this.connected(exclude);
    const game = snapshot(room, now, connected);
    for (const ws of this.ctx.getWebSockets()) {
      if (ws === exclude) continue;
      const attachment = ws.deserializeAttachment() as Attachment | null;
      this.send(ws, { type: 'state', you: attachment?.color ?? null, game });
    }
  }

  private send(ws: WebSocket, message: ServerMessage): void {
    try {
      ws.send(JSON.stringify(message));
    } catch {
      // Socket already closing; the client will resync on reconnect.
    }
  }
}
