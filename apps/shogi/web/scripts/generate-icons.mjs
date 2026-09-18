/**
 * Renders the PWA icons (PNG) from the favicon's wooden-tile logo using Playwright's Chromium.
 * Run after changing the logo: npm run icons -w apps/shogi/web
 */
import { mkdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'public');
// The glyphs live in a TypeScript module; read the king's outline straight from it.
const glyphs = await readFile(join(root, 'src/features/board/glyphs.ts'), 'utf8');
const king = glyphs.match(/"char": "王",\s*"d": "([^"]+)"/)[1];

function logo(size, { maskable }) {
  const scale = maskable ? 0.66 : 0.84;
  const offset = (1 - scale) * 50;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">
  <rect width="100" height="100" rx="${maskable ? 0 : 22}" fill="#1f3d5c"/>
  <g transform="translate(${offset} ${offset}) scale(${scale})">
    <path d="M50 5 L79 19 L88 93 Q88 96 85 96 L15 96 Q12 96 12 93 L21 19 Z" fill="#f6e2b4" stroke="#b98d47" stroke-width="3" stroke-linejoin="round"/>
    <path d="${king}" fill="#241a0e" transform="translate(0 4)"/>
  </g>
</svg>`;
}

const ICONS = [
  { file: 'pwa-192x192.png', size: 192, maskable: false },
  { file: 'pwa-512x512.png', size: 512, maskable: false },
  { file: 'maskable-512x512.png', size: 512, maskable: true },
  { file: 'apple-touch-icon.png', size: 180, maskable: true },
];

await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
for (const icon of ICONS) {
  await page.setViewportSize({ width: icon.size, height: icon.size });
  await page.setContent(`<html><body style="margin:0;background:transparent">${logo(icon.size, icon)}</body></html>`);
  await page.screenshot({ path: join(out, icon.file), omitBackground: !icon.maskable, clip: { x: 0, y: 0, width: icon.size, height: icon.size } });
  console.log(`wrote public/${icon.file}`);
}
await browser.close();
