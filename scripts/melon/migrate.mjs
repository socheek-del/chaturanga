import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { once } from 'node:events';
import { copyFileSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import wrangler from 'wrangler';

const splitSqlQuery = wrangler.unstable_splitSqlQuery ?? wrangler.splitSqlQuery;

const config = JSON.parse(readFileSync('.melon-stage.jsonc', 'utf8'));
const databases = config.d1_databases;
if (!databases?.length) process.exit(0);

const migrations = databases.map((db) => {
  const directory = db.migrations_dir ?? 'migrations';
  const files = readdirSync(directory)
    .filter((file) => file.endsWith('.sql'))
    .sort()
    .map((file) => {
      const sql = readFileSync(join(directory, file), 'utf8');
      return {
        file,
        checksum: createHash('sha256').update(sql).digest('hex'),
        statements: splitSqlQuery(sql),
      };
    });
  return { binding: db.binding, files };
});

const migrationConfig = '.melon-migrate.jsonc';
const migrationWorker = '.melon-migrate.mjs';
copyFileSync(new URL('./migration-worker.mjs', import.meta.url), migrationWorker);
writeFileSync(migrationConfig, JSON.stringify({
  name: config.name,
  main: migrationWorker,
  no_bundle: true,
  compatibility_date: config.compatibility_date,
  d1_databases: databases,
  vars: { MELON_MIGRATIONS: JSON.stringify(migrations) },
}));

const runtime = spawn('/release/.melon-runtime/node_modules/.bin/workerd', [
  'serve', migrationConfig, '--experimental', '--data-dir', '/release/state', '-s', 'http=127.0.0.1:8080',
], { stdio: 'inherit' });
const closed = once(runtime, 'close');
try {
  let response;
  for (let attempt = 0; attempt < 30; attempt++) {
    if (runtime.exitCode !== null) throw new Error('Migration runtime exited before responding');
    response = await fetch('http://127.0.0.1:8080/', {
      method: 'POST',
      signal: AbortSignal.timeout(120_000),
    }).catch((error) => {
      if (error.cause?.code !== 'ECONNREFUSED') throw error;
    });
    if (response) break;
    await delay(200);
  }
  if (!response) throw new Error('Migration runtime did not start');
  if (!response.ok) throw new Error(await response.text());
  console.log(await response.text());
} finally {
  runtime.kill();
  await closed;
  rmSync(migrationConfig);
  rmSync(migrationWorker);
}
