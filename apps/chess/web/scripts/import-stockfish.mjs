// Downloads the Stockfish build that analyses games for review (ch-015).
//
// Source: the `stockfish` npm package (Stockfish.js by Nathan Rugg and Chess.com, built from the official
// Stockfish), "lite single" flavour: a small NNUE net and one thread, so it needs no cross-origin isolation
// headers and stays under 2 MB. It is GPL-3.0, like this repository. The files are stored verbatim in
// public/engine/ — do not edit them; re-run `npm run engine -w apps/chess/web` instead. See
// public/engine/CREDITS.md.
//
// The package is about 160 MB because it also ships the full engines, and CDNs refuse to serve single files
// from it, so the script downloads the tarball once from the npm registry, checks it against the registry's
// integrity hash, and keeps only the files below.
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';

const VERSION = '19.0.0';
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'engine');
/** Path in the tarball → our file name. The two engine files must share a base name: the script loads the wasm next to itself. */
const FILES = {
  'package/bin/stockfish-19-lite-single.js': 'stockfish.js',
  'package/bin/stockfish-19-lite-single.wasm': 'stockfish.wasm',
  'package/Copying.txt': 'Copying.txt',
};

const meta = await (await fetch(`https://registry.npmjs.org/stockfish/${VERSION}`)).json();
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
  const target = FILES[name];
  if (target) {
    await writeFile(join(OUT, target), body);
    found.add(name);
    console.log(`${target}: ${size} bytes, sha256 ${createHash('sha256').update(body).digest('hex')} (${name})`);
  }
  offset += 512 + Math.ceil(size / 512) * 512;
}
for (const name of Object.keys(FILES)) if (!found.has(name)) throw new Error(`${name} is not in the package`);
