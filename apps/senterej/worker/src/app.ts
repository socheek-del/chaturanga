import { registerPlayRoutes } from '@chaturanga/server-kit';
import { Hono } from 'hono';
import type { Env } from './env';

export type { Env } from './env';

export const app = new Hono<{ Bindings: Env }>();

registerPlayRoutes(app, { service: 'senterej' });
app.all('/api/*', (c) => c.json({ error: 'not_found' }, 404));
