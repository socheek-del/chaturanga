/**
 * Renders the PWA icons (PNG) from the favicon's carved-disc logo using Playwright's Chromium.
 * Run after changing the logo: npm run icons -w apps/xiangqi/web
 */
import { mkdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'public');
// The glyphs live in a TypeScript module; read the red general's outline straight from it.
const glyphs = await readFile(join(root, 'src/features/board/glyphs.ts'), 'utf8');
const general = glyphs.match(/"char": "帥",\s*"d": "([^"]+)"/)[1];

function logo(size, { maskable }) {
  const scale = maskable ? 0.66 : 0.84;
  const offset = (1 - scale) * 50;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">
  <rect width="100" height="100" rx="${maskable ? 0 : 22}" fill="#2a2622"/>
  <g transform="translate(${offset} ${offset}) scale(${scale})">
    <circle cx="50" cy="52" r="46" fill="#8a5a31"/>
    <circle cx="50" cy="48" r="46" fill="#f3e0b8"/>
    <circle cx="50" cy="48" r="38.5" fill="none" stroke="#b3261e" stroke-width="3"/>
    <path d="${general}" fill="#b3261e" transform="translate(0 -2)"/>
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
