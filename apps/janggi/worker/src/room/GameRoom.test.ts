import { type GameSnapshot, GuestResponse, ServerMessage, type TimeControl } from '@chaturanga/protocol';
import { janggi, setupFen } from '@chaturanga/janggi';
import { evictDurableObject } from 'cloudflare:test';
import { env as providedEnv, exports as providedExports } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import type { Env } from '../env';

// The test runtime's env/exports are untyped without `wrangler types`; narrow them to our Worker.
const env = providedEnv as unknown as Env;
const exports = providedExports as unknown as { default: { fetch: (input: string, init?: RequestInit) => Promise<Response> } };

const BASE = 'https://janggi.test';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function guest() {
  const res = await exports.default.fetch(`${BASE}/api/guest`, { method: 'POST' });
  expect(res.status).toBe(200);
  return GuestResponse.parse(await res.json());
}

async function createGame(token: string, timeControl: TimeControl | null = { initialMs: 300_000, incrementMs: 0 }, startFen?: string) {
  const res = await exports.default.fetch(`${BASE}/api/games`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ color: 'w', timeControl, startFen }),
  });
  expect(res.status).toBe(201);
  return ((await res.json()) as { code: string }).code;
}

type StateMessage = Extract<ServerMessage, { type: 'state' }>;

interface Client {
  send: (message: unknown) => void;
  next: (predicate: (m: ServerMessage) => boolean) => Promise<ServerMessage>;
  state: (predicate: (game: GameSnapshot, you: StateMessage['you']) => boolean) => Promise<StateMessage>;
}

async function connect(code: string, token: string): Promise<Client> {
  const res = await exports.default.fetch(`${BASE}/ws/game/${code}?token=${encodeURIComponent(token)}`, {
    headers: { Upgrade: 'websocket' },
  });
  expect(res.status).toBe(101);
  const ws = res.webSocket!;
  const inbox: ServerMessage[] = [];
  let cursor = 0;
  ws.accept();
  ws.addEventListener('message', (event: MessageEvent) => inbox.push(ServerMessage.parse(JSON.parse(event.data as string))));

  const next: Client['next'] = async (predicate) => {
    const deadline = Date.now() + 3_000;
    for (;;) {
      for (let i = cursor; i < inbox.length; i++) {
        if (predicate(inbox[i]!)) {
          cursor = i + 1;
          return inbox[i]!;
        }
      }
      if (Date.now() > deadline) throw new Error(`timed out waiting; unread: ${JSON.stringify(inbox.slice(cursor))}`);
      await sleep(10);
    }
  };

  return {
    send: (message) => ws.send(JSON.stringify(message)),
    next,
    state: (predicate) => next((m) => m.type === 'state' && predicate(m.game, m.you)) as Promise<StateMessage>,
  };
}

async function startedGame(timeControl?: TimeControl | null, startFen?: string) {
  const alice = await guest();
  const bob = await guest();
  const code = await createGame(alice.token, timeControl, startFen);
  const white = await connect(code, alice.token);
  await white.state((g, you) => g.status === 'waiting' && you === 'w');
  const black = await connect(code, bob.token);
  await black.state((g, you) => g.status === 'playing' && you === 'b');
  const opening = await white.state((g) => g.status === 'playing');
  return { code, white, black, opening };
}

/** Plays `moves` alternately from both sockets and waits until both have seen the last one. */
async function playMoves(white: Client, black: Client, moves: string[]): Promise<StateMessage> {
  let last: StateMessage | null = null;
  for (const [ply, uci] of moves.entries()) {
    (ply % 2 === 0 ? white : black).send({ type: 'move', uci, ply });
    last = await white.state((g) => g.moves.length === ply + 1);
    await black.state((g) => g.moves.length === ply + 1);
  }
  return last!;
}

async function storedGame(code: string): Promise<Record<string, unknown> | null> {
  let row: Record<string, unknown> | null = null;
  for (let i = 0; i < 50 && !row; i++) {
    row = await env.DB.prepare('SELECT variant, moves, winner, reason FROM games WHERE code = ?').bind(code).first();
    if (!row) await sleep(20);
  }
  return row;
}

describe('Janggi GameRoom (jg-007)', () => {
  it('starts rooms from the Janggi start position', async () => {
    const { game } = (await startedGame()).opening;
    expect(game.variant).toBe('janggi');
    expect(game.startFen).toBe(janggi.startFen);
  });

  it('rejects an illegal move and a move out of turn, and broadcasts a legal one', async () => {
    const { white, black } = await startedGame();

    // A hobbled horse leap (b1d2 needs c1 empty), a chariot jumping its own soldier, and a cannon taking a
    // cannon are all illegal.
    for (const uci of ['b1d2', 'a1a5', 'b3b8']) {
      white.send({ type: 'move', uci, ply: 0 });
      expect(await white.next((m) => m.type === 'error')).toEqual({ type: 'error', code: 'illegal_move' });
    }

    black.send({ type: 'move', uci: 'i7h7', ply: 0 });
    expect(await black.next((m) => m.type === 'error')).toEqual({ type: 'error', code: 'not_your_turn' });

    white.send({ type: 'move', uci: 'a4b4', ply: 0 });
    await white.state((g) => g.moves.join() === 'a4b4');
    const seen = await black.state((g) => g.moves.length === 1);
    expect(seen.game.moves).toEqual(['a4b4']);
  });

  it('runs the clock from the first move: there is no setup phase', async () => {
    const { white, black, opening } = await startedGame({ initialMs: 300_000, incrementMs: 0 });
    expect(opening.game.clock).toMatchObject({ w: 300_000, b: 300_000 });
    const after = await playMoves(white, black, ['a4b4']);
    expect(after.game.clock?.running).toBe('b');
    black.send({ type: 'move', uci: 'i7h7', ply: 1 });
    const second = await white.state((g) => g.moves.length === 2);
    expect(second.game.clock?.running).toBe('w');
  });

  it('settles a double pass on points and stores the winner and reason', async () => {
    const { code, white, black } = await startedGame();
    const last = await playMoves(white, black, ['e2e2', 'e9e9']);
    expect(last.game.result).toEqual({ winner: 'b', reason: 'double-pass' });
    expect(await storedGame(code)).toEqual({ variant: 'janggi', moves: 'e2e2 e9e9', winner: 'b', reason: 'double-pass' });
  });

  it('opens a room on the chosen arrangements, keeps them for a rematch, and ignores any other position', async () => {
    const chosen = setupFen('left', 'outer');
    const { white, black, opening } = await startedGame(null, chosen);
    expect(opening.game.startFen).toBe(chosen);
    white.send({ type: 'resign' });
    await black.state((g) => g.status === 'finished');
    white.send({ type: 'rematch' });
    await black.state((g) => g.rematchOfferBy === 'w');
    black.send({ type: 'rematch' });
    const { game } = await white.state((g) => g.nextCode !== null);
    const next = await connect(game.nextCode!, (await guest()).token);
    expect((await next.state(() => true)).game.startFen).toBe(chosen);

    const cheat = await startedGame(null, '4k4/9/9/9/9/9/9/9/3K5/R8 w - - 0 1');
    expect(cheat.opening.game.startFen).toBe(janggi.startFen);
  });

  it('keeps the game when the Durable Object hibernates', async () => {
    const { code, white, black } = await startedGame();
    await playMoves(white, black, ['a4b4']);
    await evictDurableObject(env.GAME_ROOM.get(env.GAME_ROOM.idFromName(code)), { webSockets: 'hibernate' });
    black.send({ type: 'move', uci: 'i7h7', ply: 1 });
    const after = await white.state((g) => g.moves.length === 2);
    expect(after.game.moves).toEqual(['a4b4', 'i7h7']);
  });

  it('has no chat: unknown message types are rejected', async () => {
    const { white } = await startedGame();
    white.send({ type: 'chat', text: 'hello' });
    expect(await white.next((m) => m.type === 'error')).toEqual({ type: 'error', code: 'bad_message' });
  });

  it('stores a resigned game with variant janggi', async () => {
    const { code, white, black } = await startedGame();
    await playMoves(white, black, ['a4b4']);
    black.send({ type: 'resign' });
    await white.state((g) => g.result?.reason === 'resign');
    expect(await storedGame(code)).toEqual({ variant: 'janggi', moves: 'a4b4', winner: 'w', reason: 'resign' });
  });
});
