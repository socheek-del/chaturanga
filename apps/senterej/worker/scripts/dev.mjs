import { randomBytes } from 'node:crypto';
import { existsSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

if (!existsSync('.dev.vars')) {
  writeFileSync('.dev.vars', `AUTH_SECRET=${randomBytes(32).toString('hex')}\n`, { mode: 0o600 });
}

const run = (args) => {
  const result = spawnSync('npx', ['wrangler', ...args], { stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
};

run(['d1', 'migrations', 'apply', 'senterej', '--local']);
run(['dev', '--port', '8823']);
