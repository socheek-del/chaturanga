import { HealthResponse } from '@chaturanga/protocol';
import { describe, expect, it } from 'vitest';
import { app } from './app';

describe('worker API', () => {
  it('GET /api/health names this product', async () => {
    const res = await app.request('/api/health');
    expect(res.status).toBe(200);
    const body = HealthResponse.parse(await res.json());
    expect(body.service).toBe('shogi');
  });

  it('unknown API routes return 404 JSON', async () => {
    const res = await app.request('/api/nope');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'not_found' });
  });
});
