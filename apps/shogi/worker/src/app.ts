import { registerPlayRoutes } from '@chaturanga/server-kit';
import { Hono } from 'hono';
import type { Env } from './env';

export type { Env } from './env';

export const app = new Hono<{ Bindings: Env }>();

/** Health, seat tokens, rooms by code, quick match and room sockets — the shared online-play routes. */
registerPlayRoutes(app, { service: 'shogi' });

app.all('/api/*', (c) => c.json({ error: 'not_found' }, 404));
