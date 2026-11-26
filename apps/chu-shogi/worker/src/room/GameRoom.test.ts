import { type GameSnapshot, GuestResponse, ServerMessage } from '@chaturanga/protocol';
import { Game, START_FEN, chuShogiVariant } from '@chaturanga/chu-shogi';
import { evictDurableObject } from 'cloudflare:test';
import { env as providedEnv, exports as providedExports } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import type { Env } from '../env';

const env = providedEnv as unknown as Env;
const worker = providedExports as unknown as {
  default: { fetch: (input: string, init?: RequestInit) => Promise<Response> };
};
const BASE = 'https://chu-shogi.test';
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function guest() {
  const response = await worker.default.fetch(BASE + '/api/guest', { method: 'POST' });
  expect(response.status).toBe(200);
  return GuestResponse.parse(await response.json());
}

async function createRoom(token: string) {
  const response = await worker.default.fetch(BASE + '/api/games', {
    method: 'POST',
    headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
    body: JSON.stringify({ color: 'w', timeControl: null, rated: false }),
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
  const response = await worker.default.fetch(
    BASE + '/ws/game/' + code + '?token=' + encodeURIComponent(token),
    {
      headers: { Upgrade: 'websocket' },
    },
  );
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
      if (Date.now() > deadline)
        throw new Error('timed out waiting; unread: ' + JSON.stringify(inbox.slice(cursor)));
      await sleep(10);
    }
  };
  return {
    send: (message) => socket.send(JSON.stringify(message)),
    close: () => socket.close(),
    next,
    state: (predicate) =>
      next(
        (message) => message.type === 'state' && predicate(message.game, message.you),
      ) as Promise<StateMessage>,
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

describe('Chu Shogi GameRoom', () => {
  it('starts White from the product rules package position', async () => {
    const { opening } = await startedRoom();
    expect(opening.game.variant).toBe('chu-shogi');
    expect(new Game(opening.game.startFen).turn).toBe('w');
    expect(opening.game.startFen).toBe(chuShogiVariant.startFen);
    expect(opening.game.startFen).toBe(START_FEN);
  });

  it('rejects illegal moves and wrong turns, then validates legal moves', async () => {
    const { white, black } = await startedRoom();
    const legal = new Game(START_FEN).legalUci();
    expect(legal.length).toBeGreaterThan(0);

    white.send({ type: 'move', uci: 'a1a1', ply: 0 });
    expect(await white.next((message) => message.type === 'error')).toEqual({ type: 'error', code: 'illegal_move' });
    black.send({ type: 'move', uci: legal[0], ply: 0 });
    expect(await black.next((message) => message.type === 'error')).toEqual({ type: 'error', code: 'not_your_turn' });

    white.send({ type: 'move', uci: legal[0]!, ply: 0 });
    const accepted = await black.state((game) => game.moves.length === 1);
    expect(accepted.game.moves).toEqual([legal[0]]);
  });

  it('replays and broadcasts a complete Lion route as one authoritative move', async () => {
    const { white, black } = await startedRoom();
    const game = new Game(START_FEN);
    const sequence = [
      { client: white, uci: 'f4f5' },
      { client: black, uci: 'g9g8' },
      { client: white, uci: 'f5f6' },
      { client: black, uci: 'g8g7' },
    ];
    for (const [ply, { client, uci }] of sequence.entries()) {
      expect(game.legalUci()).toContain(uci);
      client.send({ type: 'move', uci, ply });
      game.move(uci);
      await (client === white ? black : white).state((snapshot) => snapshot.moves.length === ply + 1);
    }
    const lionRoute = 'f3f4f5';
    expect(game.legalUci()).toContain(lionRoute);
    white.send({ type: 'move', uci: lionRoute, ply: sequence.length });
    const received = await black.state((snapshot) => snapshot.moves.length === sequence.length + 1);
    expect(received.game.moves.at(-1)).toBe(lionRoute);
    expect(new Game(received.game.startFen).moves().length).toBe(0);
    const replay = new Game(received.game.startFen);
    for (const uci of received.game.moves) replay.move(uci);
    expect(replay.moves().at(-1)?.uci).toBe(lionRoute);
  });

  it('keeps room state after Durable Object eviction and reconnect', async () => {
    const { code, white, black } = await startedRoom();
    const move = new Game(START_FEN).legalUci()[0]!;
    white.send({ type: 'move', uci: move, ply: 0 });
    await black.state((game) => game.moves.length === 1);
    await evictDurableObject(env.GAME_ROOM.get(env.GAME_ROOM.idFromName(code)), { webSockets: 'hibernate' });
    black.send({ type: 'offerDraw' });
    const restored = await white.state((game) => game.moves.length === 1 && game.drawOfferBy === 'b');
    expect(restored.game.moves).toEqual([move]);
  });

  it('restores the same player seat when they reconnect within the grace period', async () => {
    const { code, white, black, bob } = await startedRoom();
    black.close();
    await white.state((game) => game.disconnect?.color === 'b');
    const returned = await connect(code, bob.token);
    const restored = await returned.state((game, you) => game.status === 'playing' && you === 'b' && game.disconnect === null);
    expect(restored.game.players.b?.connected).toBe(true);
  });

  it('accepts agreed draws and archives the finished game in Chu Shogi storage', async () => {
    const { code, white, black } = await startedRoom();
    const move = new Game(START_FEN).legalUci()[0]!;
    white.send({ type: 'move', uci: move, ply: 0 });
    await black.state((game) => game.moves.length === 1);
    black.send({ type: 'offerDraw' });
    await white.state((game) => game.drawOfferBy === 'b');
    white.send({ type: 'acceptDraw' });
    const finished = await white.state((game) => game.result?.reason === 'agreement');
    expect(finished.game.result).toEqual({ winner: null, reason: 'agreement' });
    const saved = await env.DB.prepare('SELECT variant, moves, winner, reason FROM games WHERE code = ?')
      .bind(code)
      .first();
    expect(saved).toEqual({ variant: 'chu-shogi', moves: move, winner: null, reason: 'agreement' });
  });

  it('rejects chat messages', async () => {
    const { white } = await startedRoom();
    white.send({ type: 'chat', text: 'hello' });
    expect(await white.next((message) => message.type === 'error')).toEqual({
      type: 'error',
      code: 'bad_message',
    });
  });
});
