// Downloads the Fairy-Stockfish build that analyses Makruk games for review (review-002).
//
// Source: the `fairy-stockfish-nnue.wasm` npm package by Fabian Fichter (https://github.com/fairy-stockfish/fairy-stockfish.wasm),
// the WebAssembly port of Fairy-Stockfish, the engine our Makruk rules are verified against. It is GPL-3.0,
// like this repository. The build runs its search in threads, so the site is served cross-origin isolated
// (public/_headers, vite.config). The files are stored verbatim in public/engine/ — do not edit them;
// re-run `npm run engine -w apps/makruk/web` instead. See public/engine/CREDITS.md.
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';

const VERSION = '1.1.12';
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'engine');
/** The module script loads stockfish.wasm and stockfish.worker.js from its own folder, so the names stay. */
const FILES = ['stockfish.js', 'stockfish.wasm', 'stockfish.worker.js', 'Copying.txt', 'AUTHORS'];

const meta = await (await fetch(`https://registry.npmjs.org/fairy-stockfish-nnue.wasm/${VERSION}`)).json();
const { tarball, integrity } = meta.dist;
console.log(`downloading ${tarball}`);
const tgz = Buffer.from(await (await fetch(tarball)).arrayBuffer());
const [algorithm, digest] = integrity.split('-');
if (createHash(algorithm).update(tgz).digest('base64') !== digest) throw new Error('tarball does not match the registry integrity hash');

const tar = gunzipSync(tgz);
await mkdir(OUT, { recursive: true });
const found = new Set();
for (let offset = 0; offset + 512 <= tar.length; ) {
  const header = tar.subarray(offset, offset + 512);
  if (header.every((b) => b === 0)) break;
  const field = (start, length) => header.subarray(start, start + length).toString('utf8').replace(/\0.*$/s, '');
  const prefix = field(345, 155);
  const name = prefix ? `${prefix}/${field(0, 100)}` : field(0, 100);
  const size = parseInt(field(124, 12).trim() || '0', 8);
  const body = tar.subarray(offset + 512, offset + 512 + size);
  const file = name.replace(/^package\//, '');
  if (FILES.includes(file)) {
    await writeFile(join(OUT, file), body);
    found.add(file);
    console.log(`${file}: ${size} bytes, sha256 ${createHash('sha256').update(body).digest('hex')}`);
  }
  offset += 512 + Math.ceil(size / 512) * 512;
}
for (const file of FILES) if (!found.has(file)) throw new Error(`${file} is not in the package`);
