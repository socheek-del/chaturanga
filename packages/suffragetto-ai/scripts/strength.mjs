import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const root = new URL('../', import.meta.url).pathname;
const outfile = join(mkdtempSync(join(tmpdir(), 'suffragetto-ai-')), 'strength.mjs');
await build({
  entryPoints: [join(root, 'src/strength.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile,
  logLevel: 'error',
});
await import(pathToFileURL(outfile).href);
