// Downloads the traditional Staunton piece art used by the "Traditional" piece set (ch-012).
//
// Source: Wikimedia Commons, Category:SVG chess pieces, by Cburnett — the set Wikipedia's chess articles
// use. It is triple-licensed GPLv2+ / BSD / CC BY-SA 3.0; this project ships it under the GPL, which is why
// the files are stored verbatim in src/features/board/pieces/traditional/. Do not edit them by hand —
// re-run `node scripts/import-traditional-pieces.mjs` instead. See that folder's CREDITS.md.
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'features', 'board', 'pieces', 'traditional');

// Wikimedia asks for a descriptive User-Agent and a slow, serial crawl.
const UA = 'chaturanga-chess/1.0 (https://github.com/socheek-del/chaturanga; piece art import)';
/** Our file name → the Commons file name. `l`/`d` are the light and dark piece, `t45` the 45px set. */
const FILES = {
  'king-white.svg': 'Chess_klt45.svg',
  'queen-white.svg': 'Chess_qlt45.svg',
  'rook-white.svg': 'Chess_rlt45.svg',
  'bishop-white.svg': 'Chess_blt45.svg',
  'knight-white.svg': 'Chess_nlt45.svg',
  'pawn-white.svg': 'Chess_plt45.svg',
  'king-black.svg': 'Chess_kdt45.svg',
  'queen-black.svg': 'Chess_qdt45.svg',
  'rook-black.svg': 'Chess_rdt45.svg',
  'bishop-black.svg': 'Chess_bdt45.svg',
  'knight-black.svg': 'Chess_ndt45.svg',
  'pawn-black.svg': 'Chess_pdt45.svg',
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Asks Commons where the file really lives, instead of guessing its hashed path. */
async function resolveUrl(title) {
  const api = `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url&titles=${encodeURIComponent(`File:${title}`)}`;
  const res = await fetch(api, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${title}: API HTTP ${res.status}`);
  const body = await res.json();
  const page = Object.values(body.query.pages)[0];
  const url = page?.imageinfo?.[0]?.url;
  if (!url) throw new Error(`${title}: not found on Commons`);
  return url;
}

await mkdir(OUT, { recursive: true });
for (const [name, title] of Object.entries(FILES)) {
  const url = await resolveUrl(title);
  let body = '';
  for (let attempt = 1; attempt <= 5; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.ok) {
      body = await res.text();
      break;
    }
    if (attempt === 5) throw new Error(`${name}: HTTP ${res.status}`);
    await sleep(attempt * 3000);
  }
  if (!body.includes('<svg')) throw new Error(`${name}: not an SVG`);
  await writeFile(join(OUT, name), body);
  console.log(`${name}: ${body.length} bytes (${title})`);
  await sleep(1500);
}
