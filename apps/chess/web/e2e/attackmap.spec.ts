import { expect, test } from '@playwright/test';
import { square, startLocalGame } from './helpers';

test('plat-015: the attack map tints both sides and remembers the switch', async ({ page }) => {
  await startLocalGame(page);
  await page.getByRole('switch', { name: 'Attack map' }).click();
  await expect(square(page, 'e3')).toHaveAttribute('data-attack', 'own');
  await expect(square(page, 'e6')).toHaveAttribute('data-attack', 'enemy');
  await expect(square(page, 'e4')).not.toHaveAttribute('data-attack');
  await page.reload();
  await expect(page.getByRole('switch', { name: 'Attack map' })).toHaveAttribute('aria-checked', 'true');
});
