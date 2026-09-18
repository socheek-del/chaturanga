// Downloads the traditional Makruk piece art used by the "Traditional wood" piece set.
//
// Source: Wikimedia Commons, Category:Makruk pieces, by Yevrowl, CC BY-SA 4.0.
// The files are stored verbatim in src/features/board/pieces/traditional/ — do not edit them by hand;
// re-run `node scripts/import-traditional-pieces.mjs` instead. See that folder's CREDITS.md.
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'features', 'board', 'pieces', 'traditional');

// Wikimedia asks for a descriptive User-Agent and a slow, serial crawl.
const UA = 'chaturanga-makruk/1.0 (https://github.com/socheek-del/chaturanga; piece art import)';
const FILES = {
  'bia-black.svg': '1/16/Bia_black.svg',
  'bia-white.svg': '6/64/Bia_white.svg',
  'biangai-black.svg': '3/35/Biangai_black.svg',
  'biangai-white.svg': '4/44/Biangai_white.svg',
  'khon-black.svg': '0/00/Khon_black.svg',
  'khon-white.svg': '2/26/Khon_white.svg',
  'khun-black.svg': '2/27/Khun_black.svg',
  'khun-white.svg': '1/1a/Khun_white.svg',
  'ma-black.svg': 'a/a6/Ma_black.svg',
  'ma-white.svg': '5/56/Ma_white.svg',
  'met-black.svg': '7/77/Met_black.svg',
  'met-white.svg': 'd/d3/Met_white.svg',
  'ruea-black.svg': '3/35/Ruea_black.svg',
  'ruea-white.svg': '0/08/Ruea_white.svg',
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

await mkdir(OUT, { recursive: true });
for (const [name, path] of Object.entries(FILES)) {
  let body = '';
  for (let attempt = 1; attempt <= 5; attempt++) {
    const res = await fetch(`https://upload.wikimedia.org/wikipedia/commons/${path}`, { headers: { 'User-Agent': UA } });
    if (res.ok) {
      body = await res.text();
      break;
    }
    if (attempt === 5) throw new Error(`${name}: HTTP ${res.status}`);
    await sleep(attempt * 3000);
  }
  await writeFile(join(OUT, name), body);
  console.log(`${name}: ${body.length} bytes`);
  await sleep(1500);
}
