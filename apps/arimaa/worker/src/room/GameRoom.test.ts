import type { GameSnapshot, ServerMessage } from '@chaturanga/protocol';
import { Game, arimaa } from '@chaturanga/arimaa';
import { evictDurableObject } from 'cloudflare:test';
import { env as providedEnv, exports as providedExports } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import type { Env } from '../env';

const env = providedEnv as unknown as Env;
const worker = providedExports as unknown as {
  default: { fetch: (input: string, init?: RequestInit) => Promise<Response> };
};
const BASE = 'https://arimaa.test';
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function guest() {
  const response = await worker.default.fetch(BASE + '/api/guest', { method: 'POST' });
  expect(response.status).toBe(200);
  return (await response.json()) as { token: string; user: { id: string } };
}

async function createRoom(token: string, timeControl: { initialMs: number; incrementMs: number } | null = null) {
  const response = await worker.default.fetch(BASE + '/api/games', {
    method: 'POST',
    headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
    body: JSON.stringify({ color: 'w', timeControl, rated: false }),
  });
  expect(response.status).toBe(201);
  return ((await response.json()) as { code: string }).code;
}

type StateMessage = Extract<ServerMessage, { type: 'state' }>;
interface Client {
  send(message: unknown): void;
  close(): void;
  next(predicate: (message: ServerMessage) => boolean): Promise<ServerMessage>;
  state(predicate: (game: GameSnapshot, you: StateMessage['you']) => boolean): Promise<StateMessage>;
}

async function connect(code: string, token: string): Promise<Client> {
  const response = await worker.default.fetch(BASE + '/ws/game/' + code + '?token=' + encodeURIComponent(token), {
    headers: { Upgrade: 'websocket' },
  });
  expect(response.status).toBe(101);
  const socket = response.webSocket!;
  const inbox: ServerMessage[] = [];
  let cursor = 0;
  socket.accept();
  socket.addEventListener('message', (event: MessageEvent) => {
    inbox.push(JSON.parse(event.data as string) as ServerMessage);
  });
  const next: Client['next'] = async (predicate) => {
    const deadline = Date.now() + 5_000;
    for (;;) {
      for (let index = cursor; index < inbox.length; index++) {
        if (predicate(inbox[index]!)) {
          cursor = index + 1;
          return inbox[index]!;
        }
      }
      if (Date.now() > deadline) throw new Error('timed out waiting; unread: ' + JSON.stringify(inbox.slice(cursor)));
      await sleep(10);
    }
  };
  return {
    send: (message) => socket.send(JSON.stringify(message)),
    close: () => socket.close(),
    next,
    state: (predicate) => next((message) => message.type === 'state' && predicate(message.game, message.you)) as Promise<StateMessage>,
  };
}

async function startedRoom(timeControl: { initialMs: number; incrementMs: number } | null = null) {
  const alice = await guest();
  const bob = await guest();
  const code = await createRoom(alice.token, timeControl);
  const white = await connect(code, alice.token);
  await white.state((game, you) => game.status === 'waiting' && you === 'w');
  const black = await connect(code, bob.token);
  await black.state((game, you) => game.status === 'playing' && you === 'b');
  const opening = await white.state((game) => game.status === 'playing');
  return { code, white, black, opening, alice, bob };
}

async function playSetup(room: { white: Client; black: Client }, game: Game, ply: number): Promise<number> {
  while (game.hand('w').length + game.hand('b').length > 0) {
    const uci = game.legalUci()[0];
    if (!uci) throw new Error('setup position has no legal placement');
    const mover = game.turn === 'w' ? room.white : room.black;
    const receiver = game.turn === 'w' ? room.black : room.white;
    mover.send({ type: 'move', uci, ply });
    game.move(uci);
    await receiver.state((snapshot) => snapshot.moves.length === ply + 1);
    ply++;
  }
  return ply;
}

describe('Arimaa GameRoom', () => {
  it('validates setup placements and complete turns, and pauses a clock during setup', async () => {
    const room = await startedRoom({ initialMs: 600_000, incrementMs: 0 });
    expect(room.opening.game.variant).toBe('arimaa');
    expect(room.opening.game.startFen).toBe(arimaa.startFen);
    expect(room.opening.game.clock?.running).toBeNull();

    const game = new Game(arimaa.startFen);
    room.white.send({ type: 'move', uci: 'E@h8', ply: 0 });
    expect(await room.white.next((message) => message.type === 'error')).toEqual({ type: 'error', code: 'illegal_move' });
    room.black.send({ type: 'move', uci: 'E@a1', ply: 0 });
    expect(await room.black.next((message) => message.type === 'error')).toEqual({ type: 'error', code: 'not_your_turn' });

    const first = game.legalUci()[0]!;
    room.white.send({ type: 'move', uci: first, ply: 0 });
    game.move(first);
    const afterFirst = await room.black.state((snapshot) => snapshot.moves.length === 1);
    expect(afterFirst.game.moves).toEqual([first]);
    room.white.send({ type: 'move', uci: first, ply: 0 });
    expect(await room.white.next((message) => message.type === 'error')).toEqual({ type: 'error', code: 'stale_ply' });

    const nextPly = await playSetup(room, game, 1);
    expect(nextPly).toBe(32);
    const complete = await room.black.state((snapshot) => snapshot.moves.length === 32);
    expect(game.hand('w')).toHaveLength(0);
    expect(game.hand('b')).toHaveLength(0);
    expect(complete.game.moves).toHaveLength(32);
    expect(game.status()).toMatchObject({ kind: 'ongoing' });
    expect(complete.game.clock?.running).toBe('w');

    const legalTurn = game.sampleLegalUci(() => 0.37);
    expect(legalTurn).not.toBeNull();
    room.white.send({ type: 'move', uci: 'a1a1', ply: 32 });
    expect(await room.white.next((message) => message.type === 'error')).toEqual({ type: 'error', code: 'illegal_move' });
    room.white.send({ type: 'move', uci: legalTurn!, ply: 32 });
    game.move(legalTurn!);
    const received = await room.black.state((snapshot) => snapshot.moves.length === 33);
    expect(received.game.moves.at(-1)).toBe(legalTurn);
  });

  it('reconnects the same seat and restores setup history after Durable Object eviction', async () => {
    const { code, white, black, bob } = await startedRoom();
    const game = new Game(arimaa.startFen);
    const uci = game.legalUci()[0]!;
    white.send({ type: 'move', uci, ply: 0 });
    game.move(uci);
    await black.state((snapshot) => snapshot.moves.length === 1);
    black.close();
    await white.state((snapshot) => snapshot.disconnect?.color === 'b');
    const returned = await connect(code, bob.token);
    const restored = await returned.state((snapshot, you) => snapshot.status === 'playing' && you === 'b' && snapshot.disconnect === null);
    expect(restored.game.players.b?.connected).toBe(true);

    await evictDurableObject(env.GAME_ROOM.get(env.GAME_ROOM.idFromName(code)), { webSockets: 'hibernate' });
    const nextMove = game.legalUci()[0]!;
    white.send({ type: 'move', uci: nextMove, ply: 1 });
    game.move(nextMove);
    const afterEviction = await returned.state((snapshot) => snapshot.moves.length === 2);
    expect(afterEviction.game.moves).toEqual([uci, nextMove]);
  });

  it('rejects chat and archives an agreed finished game once in Arimaa storage', async () => {
    const room = await startedRoom();
    room.white.send({ type: 'chat', text: 'hello' });
    expect(await room.white.next((message) => message.type === 'error')).toEqual({ type: 'error', code: 'bad_message' });

    room.white.send({ type: 'resign' });
    const finished = await room.white.state((snapshot) => snapshot.result?.reason === 'resign');
    expect(finished.game.result).toEqual({ winner: 'b', reason: 'resign' });
    const saved = await env.DB.prepare('SELECT variant, moves, winner, reason FROM games WHERE code = ?').bind(room.code).first();
    expect(saved).toEqual({ variant: 'arimaa', moves: '', winner: 'b', reason: 'resign' });
    expect(await env.DB.prepare('SELECT COUNT(*) AS count FROM games WHERE code = ?').bind(room.code).first()).toEqual({ count: 1 });
  });
});
