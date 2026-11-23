/**
 * Renders the PWA icons (PNG) from the favicon's octagonal-piece logo using Playwright's Chromium.
 * Run after changing the logo: npm run icons -w apps/janggi/web
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'public');
// The glyphs live in a TypeScript module; read the Cho general's outline straight from it.
const glyphs = await readFile(join(root, 'src/features/board/glyphs.ts'), 'utf8');
const general = glyphs.match(/"char": "楚",\s*"d": "([^"]+)"/)[1];

function logo(size, { maskable }) {
  const scale = maskable ? 0.66 : 0.84;
  const offset = (1 - scale) * 50;
  const octagon = (r, y) =>
    Array.from({ length: 8 }, (_, i) => {
      const a = Math.PI / 8 + (i * Math.PI) / 4;
      return `${(50 + r * Math.cos(a)).toFixed(1)},${(y + r * Math.sin(a)).toFixed(1)}`;
    }).join(' ');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">
  <rect width="100" height="100" rx="${maskable ? 0 : 22}" fill="#1f4e8c"/>
  <g transform="translate(${offset} ${offset}) scale(${scale})">
    <polygon points="${octagon(49, 52)}" fill="#8f6a3c"/>
    <polygon points="${octagon(49, 48)}" fill="#f6e7c6"/>
    <polygon points="${octagon(41, 48)}" fill="none" stroke="#0f6b4f" stroke-width="2.5"/>
    <path d="${general}" fill="#0f6b4f" transform="translate(0 -2)"/>
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
await writeFile(join(out, 'favicon.svg'), logo(100, { maskable: false }));
const browser = await chromium.launch();
const page = await browser.newPage();
for (const icon of ICONS) {
  await page.setViewportSize({ width: icon.size, height: icon.size });
  await page.setContent(`<html><body style="margin:0;background:transparent">${logo(icon.size, icon)}</body></html>`);
  await page.screenshot({ path: join(out, icon.file), omitBackground: !icon.maskable, clip: { x: 0, y: 0, width: icon.size, height: icon.size } });
  console.log(`wrote public/${icon.file}`);
}
await browser.close();
