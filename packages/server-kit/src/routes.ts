import {
  CreateGameRequest,
  type CreateGameResponse,
  type GuestResponse,
  type HealthResponse,
  type PublicUser,
  RoomCode,
  type RoomSummary,
} from '@chaturanga/protocol';
import type { Context, Hono } from 'hono';
import { newGuest, signToken, verifyToken } from './auth';
import { type InitOptions, USER_HEADER } from './GameRoomBase';
import { generateRoomCode } from './roomCode';

interface Namespace<Stub> {
  idFromName(name: string): DurableObjectId;
  get(id: DurableObjectId): Stub;
}

/** The bindings the play routes need. A product's Env adds its own (D1, assets, vars). */
export interface PlayEnv {
  /** HMAC secret for seat tokens (wrangler secret in production, .dev.vars locally). */
  AUTH_SECRET: string;
  GAME_ROOM: Namespace<{
    init(options: InitOptions): Promise<boolean>;
    summary(): Promise<RoomSummary | null>;
    fetch(request: Request): Promise<Response>;
  }>;
  MATCHMAKER: Namespace<{ fetch(request: Request): Promise<Response> }>;
}

/** The user a request's seat token names: `Authorization: Bearer …`, or `?token=` for WebSockets. */
export async function currentUser<E extends PlayEnv>(c: Context<{ Bindings: E }>): Promise<PublicUser | null> {
  const header = c.req.header('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : c.req.query('token');
  return token ? verifyToken(token, c.env.AUTH_SECRET) : null;
}

/**
 * Registers online play on a product's Worker: health, anonymous seat tokens (acct-001), private rooms
 * by code (online-002), quick match (online-005) and the room WebSocket. The product adds its own routes
 * afterwards, then its `/api/*` not-found handler.
 */
export function registerPlayRoutes<E extends PlayEnv>(app: Hono<{ Bindings: E }>, options: { service: string }): void {
  const room = (c: Context<{ Bindings: E }>, code: string) => c.env.GAME_ROOM.get(c.env.GAME_ROOM.idFromName(code));

  app.get('/api/health', (c) => c.json({ ok: true, service: options.service, time: new Date().toISOString() } satisfies HealthResponse));

  app.post('/api/guest', async (c) => {
    const user = newGuest();
    return c.json({ token: await signToken(user, c.env.AUTH_SECRET), user } satisfies GuestResponse);
  });

  app.get('/api/me', async (c) => {
    const user = await currentUser(c);
    return user ? c.json(user) : c.json({ error: 'unauthorized' }, 401);
  });

  app.post('/api/games', async (c) => {
    const user = await currentUser(c);
    if (!user) return c.json({ error: 'unauthorized' }, 401);
    const body = CreateGameRequest.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json({ error: 'bad_request' }, 400);
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateRoomCode();
      const created = await room(c, code).init({
        code,
        creator: user,
        color: body.data.color,
        timeControl: body.data.timeControl,
        rated: body.data.rated,
        startFen: body.data.startFen,
      });
      if (created) return c.json({ code } satisfies CreateGameResponse, 201);
    }
    return c.json({ error: 'try_again' }, 503);
  });

  app.get('/api/games/:code', async (c) => {
    const code = c.req.param('code').toUpperCase();
    if (!RoomCode.safeParse(code).success) return c.json({ error: 'not_found' }, 404);
    const summary = await room(c, code).summary();
    return summary ? c.json(summary) : c.json({ error: 'not_found' }, 404);
  });

  app.get('/ws/match/:pool', async (c) => {
    if (c.req.header('upgrade')?.toLowerCase() !== 'websocket') return c.text('Expected WebSocket', 426);
    const user = await currentUser(c);
    if (!user) return c.text('Unauthorized', 401);
    const url = new URL(c.req.url);
    url.searchParams.set('pool', decodeURIComponent(c.req.param('pool')));
    const forwarded = new Request(url, c.req.raw);
    forwarded.headers.set(USER_HEADER, JSON.stringify(user));
    return c.env.MATCHMAKER.get(c.env.MATCHMAKER.idFromName('global')).fetch(forwarded);
  });

  // Browsers cannot set headers on WebSockets, so the token is a query parameter.
  app.get('/ws/game/:code', async (c) => {
    if (c.req.header('upgrade')?.toLowerCase() !== 'websocket') return c.text('Expected WebSocket', 426);
    const user = await currentUser(c);
    if (!user) return c.text('Unauthorized', 401);
    const code = c.req.param('code').toUpperCase();
    if (!RoomCode.safeParse(code).success) return c.text('Not found', 404);
    const forwarded = new Request(c.req.raw);
    forwarded.headers.set(USER_HEADER, JSON.stringify(user));
    return room(c, code).fetch(forwarded);
  });
}
