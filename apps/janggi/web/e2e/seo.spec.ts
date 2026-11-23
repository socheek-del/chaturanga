import { expect, test } from '@playwright/test';
import { SITE_URL as SITE } from '../site.config';

test('pages set search titles, descriptions, canonical and language alternates; ?lang=en opens English (jg-010)', async ({ page }) => {
  const canonical = page.locator('link[rel="canonical"]');
  const description = page.locator('meta[name="description"]');

  await page.goto('/learn');
  await expect(page).toHaveTitle('장기 배우기 — 무료 강의 14개');
  await expect(description).toHaveAttribute('content', /짧은 강의 열네 개/);
  await expect(canonical).toHaveAttribute('href', `${SITE}/learn`);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow');
  await expect(description).toHaveCount(1);

  await page.goto('/play/computer?lang=en');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page).toHaveTitle('Play Janggi vs Computer — 6 Levels | Korean Chess');
  await expect(canonical).toHaveAttribute('href', `${SITE}/play/computer?lang=en`);
  await expect(page.locator('link[rel="alternate"][hreflang="ko"]')).toHaveAttribute('href', `${SITE}/play/computer`);
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', `${SITE}/play/computer?lang=en`);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', 'Play Janggi vs Computer — 6 Levels | Korean Chess');
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'en_US');

  // The language chosen by the link is remembered; room links are not indexed.
  await page.goto('/about');
  await expect(page).toHaveTitle('About This Free Janggi Site | Korean Chess');
  await page.goto('/play/online/ABC234');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');

  const graph = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!)['@graph'];
  expect(graph.map((node: { '@id': string }) => node['@id'])).toEqual([`${SITE}/#website`, `${SITE}/#game`]);
  expect(graph[1].alternateName).toEqual(expect.arrayContaining(['Korean Chess', '장기']));

  expect(await (await page.request.get('/robots.txt')).text()).toContain(`Sitemap: ${SITE}/sitemap.xml`);
  const sitemap = await (await page.request.get('/sitemap.xml')).text();
  for (const path of ['/', '/play/computer', '/play/online', '/learn', '/about']) expect(sitemap).toContain(`<loc>${SITE}${path}</loc>`);
  expect(sitemap).toContain(`<loc>${SITE}/learn?lang=en</loc>`);
  const og = await page.request.get('/og-image.png');
  expect(og.headers()['content-type']).toBe('image/png');
});
