import { expect, test } from '@playwright/test';
// Relative paths on purpose: Playwright transforms files in the repository, not workspace packages.
import { type FamilyLink, familyLinks } from '../../../../packages/family/src/sites';
import { PRODUCT } from '../product.config';

const SITE = 'shogi';
const siblings = familyLinks(SITE);
const [HOME, OTHER] = [PRODUCT.defaultLocale, PRODUCT.locales.find((locale) => locale !== PRODUCT.defaultLocale)!];

/** A sibling's address in the visitor's language when that site speaks it, else at its plain address. */
const href = (site: FamilyLink, locale: string) =>
  `${site.url}/${locale !== site.defaultLocale && site.locales.includes(locale) ? `?lang=${locale}` : ''}`;

// plat-010: loops over the family instead of naming siblings, so a game joining never edits this file.
test('Shogi links to every sibling game at its configured address, in the site language (plat-006, plat-010)', async ({ page }) => {
  expect(siblings.length).toBeGreaterThan(0);
  expect(siblings.map((site) => site.id)).not.toContain(SITE);

  await page.goto('/');
  const section = page.getByTestId('more-games');
  await expect(section.getByRole('heading')).toHaveText('ほかのゲーム');
  for (const site of siblings) {
    const name = site.names[HOME]!;
    await expect(section.getByRole('link', { name })).toHaveAttribute('href', href(site, HOME));
    await expect(page.getByTestId('family-footer').getByRole('link', { name })).toHaveAttribute('href', href(site, HOME));
  }

  // The footer is on every page, not only the home page.
  await page.goto(`/learn?lang=${OTHER}`);
  const footer = page.getByTestId('family-footer');
  await expect(footer).toContainText('More games');
  for (const site of siblings) {
    await expect(footer.getByRole('link', { name: site.names[OTHER]! })).toHaveAttribute('href', href(site, OTHER));
  }

  // Only the siblings' names cross over: one link each, none back to this site, and no name in a language
  // this site does not speak.
  await page.goto(`/?lang=${HOME}`);
  await expect(page.getByTestId('more-games').getByRole('link')).toHaveCount(siblings.length);
  await expect(page.getByTestId('family-footer').getByRole('link')).toHaveCount(siblings.length);
  const body = (await page.locator('body').textContent()) ?? '';
  for (const site of siblings) {
    const shown = PRODUCT.locales.map((locale) => site.names[locale]).filter(Boolean) as string[];
    for (const [language, name] of Object.entries(site.names)) {
      if ((PRODUCT.locales as readonly string[]).includes(language)) continue;
      // Some names contain another: Shogi is 将棋 in Japanese and 日本将棋 in Chinese. Only a name that is
      // not part of one this site does show counts as a leak.
      if (shown.some((visible) => visible.includes(name) || name.includes(visible))) continue;
      expect(body, `${site.id} in ${language}`).not.toContain(name);
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'e2e-evidence/more-games-390.png', fullPage: true });
});
