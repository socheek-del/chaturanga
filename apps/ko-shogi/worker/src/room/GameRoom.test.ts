import { GuestResponse, ServerMessage } from '@chaturanga/protocol';
import { Game, koShogi } from '@chaturanga/ko-shogi';
import { exports as providedExports } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';

const worker = providedExports as unknown as { default: { fetch: (input: string, init?: RequestInit) => Promise<Response> } };
const base = 'https://ko-shogi.test';
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function guest() {
  const response = await worker.default.fetch(base + '/api/guest', { method: 'POST' });
  expect(response.status).toBe(200);
  return GuestResponse.parse(await response.json());
}

async function createRoom(token: string) {
  const response = await worker.default.fetch(base + '/api/games', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ color: 'w', timeControl: null, rated: false }),
  });
  expect(response.status).toBe(201);
  return (await response.json() as { code: string }).code;
}

async function connect(code: string, token: string) {
  const response = await worker.default.fetch(`${base}/ws/game/${code}?token=${encodeURIComponent(token)}`, { headers: { Upgrade: 'websocket' } });
  expect(response.status).toBe(101);
  const socket = response.webSocket!;
  const inbox: ServerMessage[] = [];
  let cursor = 0;
  socket.accept();
  socket.addEventListener('message', (event: MessageEvent) => {
    inbox.push(ServerMessage.parse(JSON.parse(event.data as string)));
  });
  return {
    socket,
    send: (message: unknown) => socket.send(JSON.stringify(message)),
    next: async (predicate: (message: ServerMessage) => boolean) => {
      const deadline = Date.now() + 3_000;
      for (;;) {
        for (let index = cursor; index < inbox.length; index++) {
          if (predicate(inbox[index]!)) { cursor = index + 1; return inbox[index]!; }
        }
        if (Date.now() > deadline) throw new Error(`timed out waiting for room message; unread=${JSON.stringify(inbox.slice(cursor))}`);
        await sleep(10);
      }
    },
  };
}

describe('Ko Shogi GameRoom', () => {
  it('starts from the product opening and rejects an illegal turn before accepting a legal one', async () => {
    const alice = await guest();
    const bob = await guest();
    const code = await createRoom(alice.token);
    const creator = await connect(code, alice.token);
    const waiting = await creator.next((message) => message.type === 'state' && message.game.status === 'waiting');
    expect(waiting.type).toBe('state');
    const opponent = await connect(code, bob.token);
    const joined = await opponent.next((message) => message.type === 'state' && message.game.status === 'playing');
    expect(joined.type).toBe('state');
    if (joined.type !== 'state') throw new Error('expected playing room snapshot');
    expect(joined.game.variant).toBe('ko-shogi');
    expect(joined.game.startFen).toBe(koShogi.startFen);

    const legal = new Game(koShogi.startFen).legalUci()[0]!;
    expect(joined.you).toBe('b');
    opponent.send({ type: 'move', uci: 'a1-a1', ply: 0 });
    expect(await opponent.next((message) => message.type === 'error')).toEqual({ type: 'error', code: 'illegal_move' });
    opponent.send({ type: 'move', uci: legal, ply: 0 });
    const accepted = await creator.next((message) => message.type === 'state' && message.game.moves.length === 1);
    expect(accepted.type).toBe('state');
    if (accepted.type === 'state') expect(accepted.game.moves).toEqual([legal]);
    creator.socket.close();
    opponent.socket.close();
  });
});
