import { GuestResponse, MatchServerMessage, ServerMessage } from '@chaturanga/protocol';
import { jesonMor } from '@chaturanga/jesonmor';
import { exports as providedExports } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';

const exports = providedExports as unknown as {
  default: { fetch: (input: string, init?: RequestInit) => Promise<Response> };
};
const BASE = 'https://jesonmor.test';
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function guest() {
  const response = await exports.default.fetch(`${BASE}/api/guest`, { method: 'POST' });
  return GuestResponse.parse(await response.json());
}

async function socket<T>(path: string, token: string, parse: (data: unknown) => T) {
  const response = await exports.default.fetch(`${BASE}${path}?token=${encodeURIComponent(token)}`, {
    headers: { Upgrade: 'websocket' },
  });
  expect(response.status).toBe(101);
  const ws = response.webSocket!;
  const inbox: T[] = [];
  ws.accept();
  ws.addEventListener('message', (event: MessageEvent) => {
    inbox.push(parse(JSON.parse(event.data as string)));
  });
  const find = async (predicate: (message: T) => boolean) => {
    const deadline = Date.now() + 2_000;
    for (;;) {
      const found = inbox.find(predicate);
      if (found) return found;
      if (Date.now() > deadline) throw new Error(`message not received: ${JSON.stringify(inbox)}`);
      await sleep(10);
    }
  };
  return { find };
}

describe('Jeson Mor quick match', () => {
  it('pairs two players into a Jeson Mor room', async () => {
    const alice = await guest();
    const bob = await guest();
    const first = await socket('/ws/match/5%2B0', alice.token, (data) => MatchServerMessage.parse(data));
    await first.find((message) => message.type === 'queued');
    const second = await socket('/ws/match/5%2B0', bob.token, (data) => MatchServerMessage.parse(data));
    const matched = await first.find((message) => message.type === 'matched');
    expect(await second.find((message) => message.type === 'matched')).toEqual(matched);

    const code = (matched as { code: string }).code;
    const room = await socket(`/ws/game/${code}`, alice.token, (data) => ServerMessage.parse(data));
    const state = await room.find((message) => message.type === 'state');
    if (state.type !== 'state') throw new Error('expected game state');
    expect(state.game.variant).toBe('jesonmor');
    expect(state.game.status).toBe('playing');
    expect(state.game.startFen).toBe(jesonMor.startFen);
  });
});
