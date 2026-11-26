import { HealthResponse } from '@chaturanga/protocol';
import { describe, expect, it } from 'vitest';
import { app } from './app';

describe('Senterej Worker API', () => {
  it('identifies the isolated service in its health response', async () => {
    const response = await app.request('/api/health');
    expect(response.status).toBe(200);
    expect(HealthResponse.parse(await response.json()).service).toBe('senterej');
  });

  it('returns JSON 404 for unknown API routes', async () => {
    const response = await app.request('/api/nope');
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'not_found' });
  });
});
