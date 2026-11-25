import { type GameSnapshot, GuestResponse, ServerMessage } from '@chaturanga/protocol';
import { jesonMor } from '@chaturanga/jesonmor';
import { evictDurableObject, runInDurableObject } from 'cloudflare:test';
import { env as providedEnv, exports as providedExports } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import type { RoomState } from '@chaturanga/server-kit';
import type { Env } from '../env';

const env = providedEnv as unknown as Env;
const exports = providedExports as unknown as {
  default: { fetch: (input: string, init?: RequestInit) => Promise<Response> };
};
const BASE = 'https://jesonmor.test';
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function guest() {
  const response = await exports.default.fetch(BASE + '/api/guest', { method: 'POST' });
  expect(response.status).toBe(200);
  return GuestResponse.parse(await response.json());
}

async function createRoom(token: string) {
  const response = await exports.default.fetch(BASE + '/api/games', {
    method: 'POST',
    headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
    body: JSON.stringify({ color: 'w', timeControl: null }),
  });
  expect(response.status).toBe(201);
  return ((await response.json()) as { code: string }).code;
}

type StateMessage = Extract<ServerMessage, { type: 'state' }>;
interface Client {
  send(message: unknown): void;
  next(predicate: (message: ServerMessage) => boolean): Promise<ServerMessage>;
  state(predicate: (game: GameSnapshot, you: StateMessage['you']) => boolean): Promise<StateMessage>;
}

async function connect(code: string, token: string): Promise<Client> {
  const response = await exports.default.fetch(BASE + '/ws/game/' + code + '?token=' + encodeURIComponent(token), {
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
    const deadline = Date.now() + 3_000;
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
    next,
    state: (predicate) =>
      next((message) => message.type === 'state' && predicate(message.game, message.you)) as Promise<StateMessage>,
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
  return { code, white, black, opening, alice, bob };
}

async function play(white: Client, black: Client, moves: string[]) {
  for (const [ply, uci] of moves.entries()) {
    (ply % 2 === 0 ? white : black).send({ type: 'move', uci, ply });
    await white.state((game) => game.moves.length === ply + 1);
    await black.state((game) => game.moves.length === ply + 1);
  }
}

describe('Jeson Mor GameRoom', () => {
  it('starts from the isolated nine-by-nine Jeson Mor position', async () => {
    const { opening } = await startedRoom();
    expect(opening.game.variant).toBe('jesonmor');
    expect(opening.game.startFen).toBe(jesonMor.startFen);
  });

  it('rejects illegal moves and wrong turns, then accepts knight moves through the rules engine', async () => {
    const { white, black } = await startedRoom();
    white.send({ type: 'move', uci: 'a1a7', ply: 0 });
    expect(await white.next((message) => message.type === 'error')).toEqual({ type: 'error', code: 'illegal_move' });
    black.send({ type: 'move', uci: 'a9b7', ply: 0 });
    expect(await black.next((message) => message.type === 'error')).toEqual({ type: 'error', code: 'not_your_turn' });

    await play(white, black, ['a1b3', 'a9b7', 'b1c3', 'b9c7']);
    white.send({ type: 'move', uci: 'b3b5', ply: 4 });
    expect(await white.next((message) => message.type === 'error')).toEqual({ type: 'error', code: 'illegal_move' });
    white.send({ type: 'move', uci: 'b3a5', ply: 4 });
    const whiteState = await white.state((game) => game.moves.length === 5);
    const blackState = await black.state((game) => game.moves.length === 5);
    expect(whiteState.game.moves).toEqual(['a1b3', 'a9b7', 'b1c3', 'b9c7', 'b3a5']);
    expect(blackState.game.moves).toEqual(whiteState.game.moves);
  });

  it('validates a capture of the pending center horse through the server rules engine', async () => {
    const { code, white, black, alice, bob } = await startedRoom();
    const stub = env.GAME_ROOM.get(env.GAME_ROOM.idFromName(code));
    await evictDurableObject(stub, { webSockets: 'hibernate' });
    const room: RoomState = {
      code,
      variant: 'jesonmor',
      createdAt: Date.now(),
      startFen: '8n/9/9/9/4N4/2n6/9/9/N8 b - - 1 1 w',
      moves: [],
      players: { w: alice.user, b: bob.user },
      timeControl: null,
      rated: false,
      clock: null,
      result: null,
      drawOfferBy: null,
      rematchOfferBy: null,
      nextCode: null,
      disconnect: null,
    };
    await runInDurableObject(stub, (_instance, state) => state.storage.put('room', room));

    black.send({ type: 'move', uci: 'c4c5', ply: 0 });
    expect(await black.next((message) => message.type === 'error')).toEqual({ type: 'error', code: 'illegal_move' });
    black.send({ type: 'move', uci: 'c4e5', ply: 0 });
    const accepted = await white.state((game) => game.moves.length === 1);
    expect(accepted.game.moves).toEqual(['c4e5']);
  });

  it('keeps room state after Durable Object eviction', async () => {
    const { code, white, black } = await startedRoom();
    white.send({ type: 'move', uci: 'a1b3', ply: 0 });
    await black.state((game) => game.moves.length === 1);
    await evictDurableObject(env.GAME_ROOM.get(env.GAME_ROOM.idFromName(code)), { webSockets: 'hibernate' });
    black.send({ type: 'move', uci: 'a9b7', ply: 1 });
    const state = await white.state((game) => game.moves.length === 2);
    expect(state.game.moves).toEqual(['a1b3', 'a9b7']);
  });

  it('archives a finished game in Jeson Mor’s private database', async () => {
    const { code, white, black } = await startedRoom();
    white.send({ type: 'move', uci: 'a1b3', ply: 0 });
    await black.state((game) => game.moves.length === 1);
    black.send({ type: 'resign' });
    await white.state((game) => game.result?.reason === 'resign');

    const saved = await env.DB.prepare('SELECT variant, moves, winner, reason FROM games WHERE code = ?').bind(code).first();
    expect(saved).toEqual({ variant: 'jesonmor', moves: 'a1b3', winner: 'w', reason: 'resign' });
  });

  it('rejects chat messages', async () => {
    const { white } = await startedRoom();
    white.send({ type: 'chat', text: 'hello' });
    expect(await white.next((message) => message.type === 'error')).toEqual({ type: 'error', code: 'bad_message' });
  });
});
