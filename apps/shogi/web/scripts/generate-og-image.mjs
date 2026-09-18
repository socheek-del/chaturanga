/**
 * sg-010: renders public/og-image.png (1200x630), the picture shown when the site is shared.
 *
 * Usage: npm run og -w apps/shogi/web
 *
 * The board comes from the app itself — a real position drawn by the real components — so the picture can
 * never drift from what the site looks like. It is then composed onto a card with the name and the tagline.
 * Nothing in it shows the site address.
 */
import { readFileSync } from 'node:fs';
import { createServer } from 'vite';
import { chromium } from '@playwright/test';

const OPENING = [
  ['g3', 'g4'],
  ['c7', 'c6'],
  ['h2', 'g2'],
  ['b8', 'c8'],
  ['f3', 'f4'],
  ['h9', 'g7'],
];

const server = await createServer({ server: { port: 4321, strictPort: true } });
await server.listen();
const browser = await chromium.launch();

const app = await browser.newPage({ viewport: { width: 1000, height: 1200 }, deviceScaleFactor: 2 });
await app.goto('http://127.0.0.1:4321/play/local');
await app.getByRole('button', { name: '開始' }).click();
for (const [from, to] of OPENING) {
  await app.locator(`[data-square="${from}"]`).click();
  await app.locator(`[data-square="${to}"]`).click();
}
await app.waitForTimeout(400);
const board = (await app.getByRole('grid').screenshot()).toString('base64');
await app.close();

const card = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await card.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
  * { margin: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px; display: flex; align-items: center; gap: 56px; padding: 48px 64px;
    background: linear-gradient(135deg, #1f3d5c 0%, #16293d 100%);
    color: #f6efe1; font-family: 'Hiragino Kaku Gothic ProN', 'Yu Gothic', sans-serif;
  }
  img { height: 534px; width: 534px; border-radius: 12px; box-shadow: 0 24px 60px rgb(0 0 0 / .45); }
  h1 { font-size: 92px; line-height: 1; letter-spacing: 4px; }
  .latin { font-size: 40px; opacity: .78; letter-spacing: 8px; margin-top: 12px; }
  p { font-size: 34px; line-height: 1.5; margin-top: 32px; max-width: 480px; }
  ul { margin-top: 28px; font-size: 27px; line-height: 1.75; list-style: none; opacity: .9; }
</style></head><body>
  <img src="data:image/png;base64,${board}" alt="" />
  <div>
    <h1>将棋</h1>
    <div class="latin">SHOGI</div>
    <p>無料で、登録なしで。<br />Play Japanese chess free.</p>
    <ul><li>コンピュータ六段階</li><li>友達とオンライン</li><li>十五のレッスン</li></ul>
  </div>
</body></html>`);
await card.evaluate('document.fonts.ready');
await card.screenshot({ path: 'public/og-image.png' });
console.log('wrote public/og-image.png', readFileSync('public/og-image.png').length, 'bytes');
await browser.close();
await server.close();
