import { GuestResponse, MatchServerMessage, ServerMessage } from '@chaturanga/protocol';
import { exports as providedExports } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';

const exports = providedExports as unknown as { default: { fetch: (input: string, init?: RequestInit) => Promise<Response> } };
const BASE = 'https://xiangqi.test';
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function guest() {
  const res = await exports.default.fetch(`${BASE}/api/guest`, { method: 'POST' });
  return GuestResponse.parse(await res.json());
}

async function socket<T>(path: string, token: string, parse: (data: unknown) => T) {
  const res = await exports.default.fetch(`${BASE}${path}?token=${encodeURIComponent(token)}`, { headers: { Upgrade: 'websocket' } });
  expect(res.status).toBe(101);
  const ws = res.webSocket!;
  const inbox: T[] = [];
  ws.accept();
  ws.addEventListener('message', (event: MessageEvent) => inbox.push(parse(JSON.parse(event.data as string))));
  const find = async (predicate: (m: T) => boolean) => {
    const deadline = Date.now() + 2_000;
    for (;;) {
      const found = inbox.find(predicate);
      if (found) return found;
      if (Date.now() > deadline) throw new Error(`not received; got ${JSON.stringify(inbox)}`);
      await sleep(10);
    }
  };
  return { ws, find };
}

describe('Xiangqi quick match (xq-007)', () => {
  it('pairs two players into a Xiangqi room', async () => {
    const a = await guest();
    const b = await guest();
    const first = await socket('/ws/match/5%2B0', a.token, (d) => MatchServerMessage.parse(d));
    await first.find((m) => m.type === 'queued');
    const second = await socket('/ws/match/5%2B0', b.token, (d) => MatchServerMessage.parse(d));
    const matched = await first.find((m) => m.type === 'matched');
    expect(await second.find((m) => m.type === 'matched')).toEqual(matched);

    const code = (matched as { code: string }).code;
    const room = await socket(`/ws/game/${code}`, a.token, (d) => ServerMessage.parse(d));
    const state = await room.find((m) => m.type === 'state');
    if (state.type !== 'state') throw new Error('expected a state message');
    expect(state.game.variant).toBe('xiangqi');
    expect(state.game.status).toBe('playing');
    expect(state.game.timeControl).toEqual({ initialMs: 300_000, incrementMs: 0 });
  });
});
