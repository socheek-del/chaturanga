// Downloads the opening list used to name openings and to mark Book moves in game review (ch-015), then
// precomputes the book the app ships (book.json).
//
// Source: lichess-org/chess-openings (https://github.com/lichess-org/chess-openings), released to the public
// domain under CC0. The five TSV files (eco, name, pgn) are stored verbatim in
// src/features/review/openings/ — do not edit them; re-run `npm run openings -w apps/chess/web` instead.
// Replaying every line takes seconds, too slow for a phone, so this script does it once: it bundles
// src/features/review/openings.ts with esbuild (as the bot ladders do) and writes book.json beside the TSVs.
import { mkdtempSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'src', 'features', 'review', 'openings');
const BASE = 'https://raw.githubusercontent.com/lichess-org/chess-openings/master';
const NAMES = ['a', 'b', 'c', 'd', 'e'];

await mkdir(OUT, { recursive: true });
if (!process.argv.includes('--offline')) {
  for (const name of NAMES) {
    const res = await fetch(`${BASE}/${name}.tsv`);
    if (!res.ok) throw new Error(`${name}.tsv: HTTP ${res.status}`);
    const body = await res.text();
    if (!body.startsWith('eco\tname\tpgn')) throw new Error(`${name}.tsv: unexpected header`);
    await writeFile(join(OUT, `${name}.tsv`), body);
    console.log(`${name}.tsv: ${body.split('\n').length - 2} openings, ${body.length} bytes`);
  }
}

const outfile = join(mkdtempSync(join(tmpdir(), 'chess-openings-')), 'openings.mjs');
await build({ entryPoints: [join(ROOT, 'src/features/review/openings.ts')], bundle: true, platform: 'node', format: 'esm', outfile, logLevel: 'error', external: ['*.json'] });
const { buildBookData } = await import(pathToFileURL(outfile).href);
const tsvs = await Promise.all(NAMES.map((name) => readFile(join(OUT, `${name}.tsv`), 'utf8')));
const data = buildBookData(tsvs);
const json = JSON.stringify(data);
await writeFile(join(OUT, 'book.json'), json + '\n');
console.log(`book.json: ${Object.keys(data.named).length} named and ${data.passing.length} passing positions, ${json.length} bytes`);
