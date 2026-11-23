import { expect, test } from '@playwright/test';
import { point, startLocalGame } from './helpers';

test('plat-015: the attack map covers every piece', async ({ page }) => {
  await startLocalGame(page);
  await page.getByRole('switch', { name: '공격 범위' }).click();
  // Soldiers attack forward and sideways from the start; the General covers its whole palace.
  await expect(point(page, 'a5')).toHaveAttribute('data-attack', 'own');
  await expect(point(page, 'e1')).toHaveAttribute('data-attack', 'own');
  await expect(point(page, 'a6')).toHaveAttribute('data-attack', 'enemy');
});
