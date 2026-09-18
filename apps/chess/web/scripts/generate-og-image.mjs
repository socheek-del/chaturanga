/**
 * ch-010: renders public/og-image.png (1200x630), the picture shown when the site is shared.
 *
 * Usage: npm run og -w apps/chess/web
 *
 * The board comes from the app itself — a real position drawn by the real components — so the picture can
 * never drift from what the site looks like. It is then composed onto a card with the name and the tagline.
 * Nothing in it shows the site address.
 */
import { readFileSync } from 'node:fs';
import { createServer } from 'vite';
import { chromium } from '@playwright/test';

// The Italian Game, played on the real board by the real components.
const OPENING = [
  ['e2', 'e4'],
  ['e7', 'e5'],
  ['g1', 'f3'],
  ['b8', 'c6'],
  ['f1', 'c4'],
  ['f8', 'c5'],
];

const server = await createServer({ server: { port: 4321, strictPort: true } });
await server.listen();
const browser = await chromium.launch();

const app = await browser.newPage({ viewport: { width: 1000, height: 1200 }, deviceScaleFactor: 2 });
await app.goto('http://127.0.0.1:4321/play/local');
await app.getByRole('button', { name: 'Start' }).click();
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
    background: linear-gradient(135deg, #33505f 0%, #1c2126 100%);
    color: #f2f0ec; font-family: 'Noto Sans', system-ui, sans-serif;
  }
  img { height: 534px; width: 534px; border-radius: 12px; box-shadow: 0 24px 60px rgb(0 0 0 / .45); }
  h1 { font-size: 96px; line-height: 1; letter-spacing: 2px; }
  .latin { font-size: 40px; opacity: .78; letter-spacing: 8px; margin-top: 12px; }
  p { font-size: 34px; line-height: 1.5; margin-top: 32px; max-width: 480px; }
  ul { margin-top: 28px; font-size: 27px; line-height: 1.75; list-style: none; opacity: .9; }
</style></head><body>
  <img src="data:image/png;base64,${board}" alt="" />
  <div>
    <h1>Chess</h1>
    <div class="latin">FREE · NO ACCOUNT</div>
    <p>Play chess against the computer, a friend, or the person next to you.</p>
    <ul><li>Six computer levels</li><li>Online rooms by code</li><li>Sixteen lessons</li></ul>
  </div>
</body></html>`);
await card.evaluate('document.fonts.ready');
await card.screenshot({ path: 'public/og-image.png' });
console.log('wrote public/og-image.png', readFileSync('public/og-image.png').length, 'bytes');
await browser.close();
await server.close();
