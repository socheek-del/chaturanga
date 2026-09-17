/**
 * xq-004 evidence: screenshots of the design showcase at the two review widths, light and dark.
 *
 * Usage: node scripts/capture-design.mjs [url]   (defaults to the preview server)
 * Serve a build first: npm run build -w apps/xiangqi/web && npm run preview -w apps/xiangqi/web
 */
import { mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';

const url = process.argv[2] ?? 'http://127.0.0.1:4176/';
const out = new URL('../../docs/evidence/', import.meta.url).pathname;
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
for (const lang of ['zh-Hans', 'en']) {
  for (const width of [390, 1280]) {
    for (const scheme of ['light', 'dark']) {
      // English only at desktop width: the Chinese screenshots are the review set, English checks the Latin font.
      if (lang === 'en' && width === 390) continue;
      const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme: scheme });
      await page.goto(lang === 'en' ? `${url}?lang=en` : url);
      await page.waitForSelector(`[data-testid="showcase-${scheme}"]`);
      // Passed as a string: the body runs in the browser, where this file's Node lint rules do not apply.
      await page.evaluate('document.fonts.ready');
      const name = `design-${scheme}-${width}${lang === 'en' ? '-en' : ''}.png`;
      await page.getByTestId(`showcase-${scheme}`).screenshot({ path: `${out}${name}` });
      await page.close();
      console.log(name);
    }
  }
}
await browser.close();
