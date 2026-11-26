import { GuestResponse, ServerMessage, type GameSnapshot } from '@chaturanga/protocol';
import { Game, senterej } from '@chaturanga/senterej';
import { evictDurableObject } from 'cloudflare:test';
import { env as providedEnv, exports as providedExports } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import type { Env } from '../env';

const env = providedEnv as unknown as Env;
const worker = providedExports as unknown as { default: { fetch: (input: string, init?: RequestInit) => Promise<Response> } };
const BASE = 'https://senterej.test';
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function guest() {
  const response = await worker.default.fetch(`${BASE}/api/guest`, { method: 'POST' });
  expect(response.status).toBe(200);
  return GuestResponse.parse(await response.json());
}

async function createRoom(token: string) {
  const response = await worker.default.fetch(`${BASE}/api/games`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ color: 'w', timeControl: null, rated: false }),
  });
  expect(response.status).toBe(201);
  return (await response.json() as { code: string }).code;
}

type StateMessage = Extract<ServerMessage, { type: 'state' }>;
interface Client {
  send(message: unknown): void;
  close(): void;
  next(predicate: (message: ServerMessage) => boolean): Promise<ServerMessage>;
  state(predicate: (game: GameSnapshot, you: StateMessage['you']) => boolean): Promise<StateMessage>;
}

async function connect(code: string, token: string): Promise<Client> {
  const response = await worker.default.fetch(`${BASE}/ws/game/${code}?token=${encodeURIComponent(token)}`, {
    headers: { Upgrade: 'websocket' },
  });
  expect(response.status).toBe(101);
  const socket = response.webSocket!;
  const inbox: ServerMessage[] = [];
  let cursor = 0;
  socket.accept();
  socket.addEventListener('message', (event: MessageEvent) => {
    inbox.push(ServerMessage.parse(JSON.parse(event.data as string)));
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
      if (Date.now() > deadline) throw new Error(`timed out waiting; unread: ${JSON.stringify(inbox.slice(cursor))}`);
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

async function startedRoom() {
  const alice = await guest();
  const bob = await guest();
  const code = await createRoom(alice.token);
  const white = await connect(code, alice.token);
  await white.state((game, you) => game.status === 'waiting' && you === 'w');
  const black = await connect(code, bob.token);
  await black.state((game, you) => game.status === 'playing' && you === 'b');
  const opening = await white.state((game) => game.status === 'playing');
  return { code, white, black, alice, bob, opening };
}

describe('Senterej GameRoom', () => {
  it('accepts repeated actions from either seat until a capture starts ordinary turns', async () => {
    const { white, black, opening } = await startedRoom();
    expect(opening.game.variant).toBe('senterej');
    expect(opening.game.startFen).toBe(senterej.startFen);

    const game = new Game();
    let finalState: StateMessage | null = null;
    const actions = [
      ['w', 'e2e3'], ['b', 'd7d6'], ['b', 'd6d5'], ['w', 'e3e4'], ['w', 'e4d5'],
    ] as const;
    for (const [index, [color, uci]] of actions.entries()) {
      (color === 'w' ? white : black).send({ type: 'move', uci, ply: index });
      game.moveFor(color, uci);
      const observed = await (color === 'w' ? black : white).state((snapshot) => snapshot.moves.length === index + 1);
      finalState = observed;
      expect(observed.game.moves).toEqual(game.moves().map((move) => move.uci));
      expect(observed.game.moveActors).toEqual(game.moves().map((move) => move.color));
      expect(game.phase).toBe(index < 4 ? 'werera' : 'turn');
    }

    expect(finalState?.game.moveActors).toEqual(actions.map(([color]) => color));
    expect(game.phase).toBe('turn');
    expect(game.turn).toBe('b');
  }, 30_000);

  it('retracts only the caller’s own Werera action and restores actor history after eviction', async () => {
    const { code, white, black, bob } = await startedRoom();
    const game = new Game();
    const actions = [['w', 'e2e3'], ['b', 'd7d6'], ['b', 'e7e6']] as const;
    for (const [index, [color, uci]] of actions.entries()) {
      (color === 'w' ? white : black).send({ type: 'move', uci, ply: index });
      game.moveFor(color, uci);
      await (color === 'w' ? black : white).state((snapshot) => snapshot.moves.length === index + 1);
    }

    white.send({ type: 'retract', index: 2, ply: 3 });
    expect(await white.next((message) => message.type === 'error')).toEqual({ type: 'error', code: 'illegal_move' });
    black.send({ type: 'retract', index: 2, ply: 3 });
    const retracted = await white.state((snapshot) => snapshot.moves.length === 2);
    expect(retracted.game.moves).toEqual(['e2e3', 'd7d6']);
    expect(retracted.game.moveActors).toEqual(['w', 'b']);
    const remainder = new Game();
    remainder.moveFor('w', 'e2e3');
    remainder.moveFor('b', 'd7d6');
    expect(remainder.phase).toBe('werera');

    black.close();
    await white.state((snapshot) => snapshot.disconnect?.color === 'b');
    const returned = await connect(code, bob.token);
    const restored = await returned.state((snapshot, you) => snapshot.status === 'playing' && you === 'b' && snapshot.moves.length === 2);
    expect(restored.game.moveActors).toEqual(['w', 'b']);
    await evictDurableObject(env.GAME_ROOM.get(env.GAME_ROOM.idFromName(code)), { webSockets: 'hibernate' });
    returned.send({ type: 'move', uci: 'e7e6', ply: 2 });
    const afterEviction = await white.state((snapshot) => snapshot.moves.length === 3);
    expect(afterEviction.game.moves).toEqual(['e2e3', 'd7d6', 'e7e6']);
    expect(afterEviction.game.moveActors).toEqual(['w', 'b', 'b']);
  });

  it('rejects chat and archives finished games with actor history in Senterej storage', async () => {
    const { code, white } = await startedRoom();
    white.send({ type: 'chat', text: 'hello' });
    expect(await white.next((message) => message.type === 'error')).toEqual({ type: 'error', code: 'bad_message' });
    white.send({ type: 'resign' });
    await white.state((snapshot) => snapshot.result?.reason === 'resign');
    const saved = await env.DB.prepare('SELECT variant, moves, move_actors, winner, reason FROM games WHERE code = ?').bind(code).first();
    expect(saved).toEqual({ variant: 'senterej', moves: '', move_actors: '', winner: 'b', reason: 'resign' });
  });
});
