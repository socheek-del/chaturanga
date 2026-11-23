/**
 * jg-010: renders public/og-image.png (1200x630), the picture shown when the site is shared.
 *
 * Usage: npm run og -w apps/janggi/web   (needs network; the output is committed)
 *
 * The board comes from the app itself — a real position drawn by the real components — so the picture can
 * never drift from what the site looks like. It is then composed onto a card with the name and the tagline.
 * Nothing in it shows the site address.
 *
 * The Korean text is drawn as outlines, the same way the board draws its pieces (scripts/generate-glyphs.mjs
 * and src/features/board/glyphs.ts): the product downloads no Korean font, and the card must
 * not depend on whichever Korean fonts happen to be installed on the machine that renders it.
 */
import { readFileSync } from 'node:fs';
import { createServer } from 'vite';
import { chromium } from '@playwright/test';
import opentype from 'opentype.js';

// A quiet opening, played on the real board by the real components.
const OPENING = [
  ['a4', 'b4'],
  ['i7', 'h7'],
  ['h1', 'g3'],
  ['b10', 'c8'],
  ['e2', 'e1'],
  ['e9', 'e10'],
];

const WORDMARK = '장기';
const TAGLINE = '무료로 장기를 두세요. 가입은 필요 없습니다.';
const BULLETS = ['여섯 단계 컴퓨터', '방 코드로 친구와 대국', '강의 열네 개'];

/**
 * Fetches a font subset holding exactly `text` from Google Fonts. An old user agent makes it serve TrueType,
 * which opentype.js reads (it does not read WOFF2).
 */
async function subset(family, text) {
  const css = await (
    await fetch(`https://fonts.googleapis.com/css2?family=${family}&text=${encodeURIComponent(text)}`, {
      headers: { 'User-Agent': 'Mozilla/4.0' },
    })
  ).text();
  const url = css.match(/url\((https:[^)]+)\)/)?.[1];
  if (!url) throw new Error(`No font URL in:\n${css}`);
  return opentype.parse(await (await fetch(url)).arrayBuffer());
}

/** `text` as an inline SVG of outlines, laid out like text at `size` pixels. */
function outlined(font, text, size, fill, opacity = 1) {
  const em = 1000;
  const scale = size / em;
  const top = (-font.ascender / font.unitsPerEm) * em;
  const height = ((font.ascender - font.descender) / font.unitsPerEm) * em;
  const width = font.getAdvanceWidth(text, em);
  const d = font.getPath(text, 0, 0, em).toPathData(1);
  return `<svg width="${(width * scale).toFixed(1)}" height="${(height * scale).toFixed(1)}" viewBox="0 ${top.toFixed(1)} ${width.toFixed(1)} ${height.toFixed(1)}" xmlns="http://www.w3.org/2000/svg" style="display:block;opacity:${opacity}"><path d="${d}" fill="${fill}" /></svg>`;
}

// Noto Serif for the name (the same family the pieces are carved from) and Noto Sans for the sentences.
const [serif, sans] = await Promise.all([
  subset('Noto+Serif+KR:wght@900', WORDMARK),
  subset('Noto+Sans+KR:wght@500', TAGLINE + BULLETS.join('')),
]);

const server = await createServer({ server: { port: 4322, strictPort: true, host: '127.0.0.1' } });
await server.listen();
const browser = await chromium.launch();

const app = await browser.newPage({ viewport: { width: 1000, height: 1200 }, deviceScaleFactor: 2 });
await app.goto('http://127.0.0.1:4322/play/local');
await app.getByRole('button', { name: '시작' }).click();
for (const [from, to] of OPENING) {
  await app.locator(`[data-square="${from}"]`).click();
  await app.locator(`[data-square="${to}"]`).click();
}
await app.waitForTimeout(400);
const board = (await app.getByRole('grid').screenshot()).toString('base64');
await app.close();

const paper = '#f6f3ea';
const card = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await card.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
  * { margin: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px; display: flex; align-items: center; gap: 56px; padding: 48px 64px;
    background: linear-gradient(135deg, #1f4e8c 0%, #0c2340 100%);
    color: ${paper}; font-family: 'Noto Sans', system-ui, sans-serif;
  }
  img { height: 534px; border-radius: 12px; box-shadow: 0 24px 60px rgb(0 0 0 / .45); }
  .latin { font-size: 40px; opacity: .78; letter-spacing: 10px; margin-top: 16px; }
  .tagline { margin-top: 34px; }
  .tagline p { font-size: 32px; line-height: 1.5; margin-top: 12px; opacity: .88; }
  ul { margin-top: 30px; list-style: none; display: flex; flex-direction: column; gap: 14px; }
  li { display: flex; align-items: center; gap: 14px; }
  li::before { content: ''; width: 10px; height: 10px; background: #d9a021; flex: none; }
</style></head><body>
  <img src="data:image/png;base64,${board}" alt="" />
  <div>
    ${outlined(serif, WORDMARK, 104, paper)}
    <div class="latin">JANGGI</div>
    <div class="tagline">
      ${outlined(sans, TAGLINE, 25, paper, 0.88)}
      <p>Play Korean chess free.</p>
    </div>
    <ul>${BULLETS.map((line) => `<li>${outlined(sans, line, 27, paper, 0.9)}</li>`).join('')}</ul>
  </div>
</body></html>`);
await card.evaluate('document.fonts.ready');
await card.screenshot({ path: 'public/og-image.png' });
console.log('wrote public/og-image.png', readFileSync('public/og-image.png').length, 'bytes');
await browser.close();
await server.close();
