import { expect, test } from '@playwright/test';
import { point, startLocalGame } from './helpers';

test('plat-015: the attack map covers every piece, the cannon past its screen included', async ({ page }) => {
  await startLocalGame(page);
  await page.getByRole('switch', { name: '攻击范围' }).click();
  // The cannon on b3 jumps its screen to the Horse on b10, which Black's Chariot defends.
  await expect(point(page, 'b10')).toHaveAttribute('data-attack', 'both');
  await expect(point(page, 'e2')).toHaveAttribute('data-attack', 'own');
  await expect(point(page, 'a6')).toHaveAttribute('data-attack', 'enemy');
  await expect(page.getByText('对方攻击的位置')).toBeVisible();
});
