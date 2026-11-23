import { applyD1Migrations } from 'cloudflare:test';
import { env } from 'cloudflare:workers';

const testEnv = env as unknown as { DB: D1Database; TEST_MIGRATIONS: Parameters<typeof applyD1Migrations>[1] };

// Each test file gets isolated storage; bring its D1 database up to the current schema.
await applyD1Migrations(testEnv.DB, testEnv.TEST_MIGRATIONS);
