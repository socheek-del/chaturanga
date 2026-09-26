import { expect, test } from '@playwright/test';
import { square, startLocalGame } from './helpers';

test('plat-015: the attack map shows each side’s kiki', async ({ page }) => {
  await startLocalGame(page);
  await page.getByRole('switch', { name: '利きを表示' }).click();
  await expect(square(page, 'e4')).toHaveAttribute('data-attack', 'own');
  await expect(square(page, 'e6')).toHaveAttribute('data-attack', 'enemy');
  await expect(square(page, 'e5')).not.toHaveAttribute('data-attack');
});
