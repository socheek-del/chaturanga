import { expect, test } from '@playwright/test';
// Relative paths on purpose: Playwright transforms files in the repository, not workspace packages.
import { GAMES } from '../../../../packages/family/src/games';
import { familyLinks, SITES } from '../../../../packages/family/src/sites';

/**
 * sg-009: after a deploy, every live family site links to every sibling at its configured address, in the
 * language the visiting site speaks. It loops over the family, so a new game joining never edits this file.
 */
for (const game of GAMES) {
  const site = SITES[game.id];
  const siblings = familyLinks(game.id);

  test(`${game.id} links to its siblings in production (sg-009)`, async ({ page }) => {
    await page.goto(`${site.url}/`);
    const section = page.getByTestId('more-games');
    await expect(section.getByRole('link')).toHaveCount(siblings.length);
    for (const sibling of siblings) {
      // The sibling is named in the visiting site's language; it is linked in that language only when it
      // speaks it, otherwise at its plain address in its own default language.
      const name = sibling.names[site.defaultLocale]!;
      const speaks = site.defaultLocale !== sibling.defaultLocale && sibling.locales.includes(site.defaultLocale);
      await expect(section.getByRole('link', { name })).toHaveAttribute('href', `${sibling.url}/${speaks ? `?lang=${site.defaultLocale}` : ''}`);
    }
  });
}
