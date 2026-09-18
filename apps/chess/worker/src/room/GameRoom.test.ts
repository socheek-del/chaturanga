import { type GameSnapshot, GuestResponse, ServerMessage, type TimeControl } from '@chaturanga/protocol';
import { chess } from '@chaturanga/chess';
import { evictDurableObject } from 'cloudflare:test';
import { env as providedEnv, exports as providedExports } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import type { Env } from '../env';

// The test runtime's env/exports are untyped without `wrangler types`; narrow them to our Worker.
const env = providedEnv as unknown as Env;
const exports = providedExports as unknown as { default: { fetch: (input: string, init?: RequestInit) => Promise<Response> } };

const BASE = 'https://chess.test';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function guest() {
  const res = await exports.default.fetch(`${BASE}/api/guest`, { method: 'POST' });
  expect(res.status).toBe(200);
  return GuestResponse.parse(await res.json());
}

async function createGame(token: string, timeControl: TimeControl | null = { initialMs: 300_000, incrementMs: 0 }) {
  const res = await exports.default.fetch(`${BASE}/api/games`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ color: 'w', timeControl }),
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

async function startedGame(timeControl?: TimeControl | null) {
  const alice = await guest();
  const bob = await guest();
  const code = await createGame(alice.token, timeControl);
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

/**
 * From the start: both knights step out and back until the opening position has come up three times, which
 * is a draw by repetition (packages/chess/RULES.md, ch-002).
 */
const REPETITION = ['g1f3', 'g8f6', 'f3g1', 'f6g8', 'g1f3', 'g8f6', 'f3g1', 'f6g8'];

describe('chess GameRoom (ch-007)', () => {
  it('starts rooms from the chess start position', async () => {
    const { game } = (await startedGame()).opening;
    expect(game.variant).toBe('chess');
    expect(game.startFen).toBe(chess.startFen);
  });

  it('rejects an illegal move and a move out of turn, and broadcasts a legal one', async () => {
    const { white, black } = await startedGame();

    // A rook blocked by its own pawn, a king stepping two squares without the right, and a bishop moving
    // straight are all illegal.
    for (const uci of ['a1a3', 'e1e3', 'c1c3']) {
      white.send({ type: 'move', uci, ply: 0 });
      expect(await white.next((m) => m.type === 'error')).toEqual({ type: 'error', code: 'illegal_move' });
    }

    black.send({ type: 'move', uci: 'e7e5', ply: 0 });
    expect(await black.next((m) => m.type === 'error')).toEqual({ type: 'error', code: 'not_your_turn' });

    white.send({ type: 'move', uci: 'e2e4', ply: 0 });
    await white.state((g) => g.moves.join() === 'e2e4');
    const seen = await black.state((g) => g.moves.length === 1);
    expect(seen.game.moves).toEqual(['e2e4']);
  });

  it('runs the clock from the first move: there is no setup phase', async () => {
    const { white, black, opening } = await startedGame({ initialMs: 300_000, incrementMs: 0 });
    expect(opening.game.clock).toMatchObject({ w: 300_000, b: 300_000 });
    const after = await playMoves(white, black, ['e2e4']);
    expect(after.game.clock?.running).toBe('b');
    black.send({ type: 'move', uci: 'e7e5', ply: 1 });
    const second = await white.state((g) => g.moves.length === 2);
    expect(second.game.clock?.running).toBe('w');
  });

  it('decides a repetition draw on the server and stores the drawn game', async () => {
    const { code, white, black } = await startedGame();
    const last = await playMoves(white, black, REPETITION);
    expect(last.game.result).toMatchObject({ winner: null, reason: 'repetition' });
    expect(await storedGame(code)).toEqual({
      variant: 'chess',
      moves: REPETITION.join(' '),
      winner: null,
      reason: 'repetition',
    });
  });

  it('keeps the game when the Durable Object hibernates', async () => {
    const { code, white, black } = await startedGame();
    await playMoves(white, black, ['e2e4']);
    await evictDurableObject(env.GAME_ROOM.get(env.GAME_ROOM.idFromName(code)), { webSockets: 'hibernate' });
    black.send({ type: 'move', uci: 'e7e5', ply: 1 });
    const after = await white.state((g) => g.moves.length === 2);
    expect(after.game.moves).toEqual(['e2e4', 'e7e5']);
  });

  it('has no chat: unknown message types are rejected', async () => {
    const { white } = await startedGame();
    white.send({ type: 'chat', text: 'hello' });
    expect(await white.next((m) => m.type === 'error')).toEqual({ type: 'error', code: 'bad_message' });
  });

  it('stores a resigned game with variant chess', async () => {
    const { code, white, black } = await startedGame();
    await playMoves(white, black, ['e2e4']);
    black.send({ type: 'resign' });
    await white.state((g) => g.result?.reason === 'resign');
    expect(await storedGame(code)).toEqual({ variant: 'chess', moves: 'e2e4', winner: 'w', reason: 'resign' });
  });
});
