import { registerPlayRoutes } from '@chaturanga/server-kit';
import { Hono } from 'hono';
import type { Env } from './env';

export type { Env } from './env';

export const app = new Hono<{ Bindings: Env }>();

/** Health, guest seat tokens, private invite rooms, quick match and WebSocket play. */
registerPlayRoutes(app, { service: 'arimaa' });

app.all('/api/*', (c) => c.json({ error: 'not_found' }, 404));
