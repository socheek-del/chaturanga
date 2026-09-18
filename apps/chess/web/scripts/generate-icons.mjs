/**
 * Renders the PWA icons (PNG) from the site's king mark using Playwright's Chromium.
 * Run after changing the logo: npm run icons -w apps/chess/web
 */
import { mkdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'public');
// The mark lives in a TypeScript module so the app and these scripts draw the same king.
const source = await readFile(join(root, 'src/features/board/logo.ts'), 'utf8');
const paths = [...source.matchAll(/^\s*'(M[^']+)',$/gm)].map((m) => m[1]);
const colors = Object.fromEntries([...source.matchAll(/(\w+): '(#[0-9a-f]{6})'/g)].map((m) => [m[1], m[2]]));

function logo(size, { maskable }) {
  const scale = maskable ? 0.6 : 0.78;
  const offset = (1 - scale) * 50;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">
  <rect width="100" height="100" rx="${maskable ? 0 : 22}" fill="${colors.background}"/>
  <rect x="0" y="50" width="50" height="50" fill="${colors.accent}" opacity="0.18"/>
  <rect x="50" y="0" width="50" height="50" fill="${colors.accent}" opacity="0.18"/>
  <g transform="translate(${offset} ${offset}) scale(${scale})" fill="${colors.piece}" stroke="${colors.edge}" stroke-width="4" stroke-linejoin="round">
    ${paths.map((d) => `<path d="${d}"/>`).join('\n    ')}
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
await page.setContent('');
await browser.close();
