import { GuestResponse, MatchServerMessage, ServerMessage } from '@chaturanga/protocol';
import { arimaa } from '@chaturanga/arimaa';
import { exports as providedExports } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';

const worker = providedExports as unknown as {
  default: { fetch: (input: string, init?: RequestInit) => Promise<Response> };
};
const BASE = 'https://arimaa.test';
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function guest() {
  const response = await worker.default.fetch(`${BASE}/api/guest`, { method: 'POST' });
  expect(response.status).toBe(200);
  return GuestResponse.parse(await response.json());
}

async function socket<T>(path: string, token: string, parse: (data: unknown) => T) {
  const response = await worker.default.fetch(`${BASE}${path}?token=${encodeURIComponent(token)}`, {
    headers: { Upgrade: 'websocket' },
  });
  expect(response.status).toBe(101);
  const ws = response.webSocket!;
  const inbox: T[] = [];
  ws.accept();
  ws.addEventListener('message', (event: MessageEvent) => inbox.push(parse(JSON.parse(event.data as string))));
  const find = async (predicate: (message: T) => boolean) => {
    const deadline = Date.now() + 3_000;
    for (;;) {
      const found = inbox.find(predicate);
      if (found) return found;
      if (Date.now() > deadline) throw new Error(`message not received: ${JSON.stringify(inbox)}`);
      await sleep(10);
    }
  };
  return { find };
}

describe('Arimaa quick match', () => {
  it('pairs two guests into a timed Arimaa room', async () => {
    const alice = await guest();
    const bob = await guest();
    const first = await socket('/ws/match/5%2B0', alice.token, (data) => MatchServerMessage.parse(data));
    expect(await first.find((message) => message.type === 'queued')).toMatchObject({ type: 'queued', pool: '5+0' });
    const second = await socket('/ws/match/5%2B0', bob.token, (data) => MatchServerMessage.parse(data));
    const matched = await first.find((message) => message.type === 'matched');
    expect(await second.find((message) => message.type === 'matched')).toEqual(matched);

    if (matched.type !== 'matched') throw new Error('expected a paired room code');
    const room = await socket(`/ws/game/${matched.code}`, alice.token, (data) => ServerMessage.parse(data));
    const state = await room.find((message) => message.type === 'state');
    if (state.type !== 'state') throw new Error('expected game state');
    expect(state.game.variant).toBe('arimaa');
    expect(state.game.status).toBe('playing');
    expect(state.game.startFen).toBe(arimaa.startFen);
    expect(state.game.timeControl).toEqual({ initialMs: 300_000, incrementMs: 0 });
  });
});
