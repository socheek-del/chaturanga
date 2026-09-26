import { expect, test } from '@playwright/test';
import { play, square, startLocalGame } from './helpers';

test('plat-015: the attack map tints both sides, follows moves and survives a reload', async ({ page }) => {
  await startLocalGame(page);
  const toggle = page.getByRole('switch', { name: 'แผนที่การโจมตี' });
  await expect(page.locator('[data-attack]')).toHaveCount(0);

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  // White's Bia on rank 3 take on rank 4; Black's on rank 6 take on rank 5.
  await expect(square(page, 'a4')).toHaveAttribute('data-attack', 'own');
  await expect(square(page, 'e5')).toHaveAttribute('data-attack', 'enemy');
  await expect(page.getByText('ช่องที่ฝ่ายตรงข้ามโจมตี')).toBeVisible();

  // After e3-e4 d6-d5 the two Bia attack each other, and each is defended: both squares are both colours.
  await play(page, [
    ['e3', 'e4'],
    ['d6', 'd5'],
  ]);
  await expect(square(page, 'd5')).toHaveAttribute('data-attack', 'both');
  await expect(square(page, 'e4')).toHaveAttribute('data-attack', 'both');
  await expect(square(page, 'a5')).toHaveAttribute('data-attack', 'enemy');

  await page.reload();
  await expect(page.getByRole('switch', { name: 'แผนที่การโจมตี' })).toHaveAttribute('aria-checked', 'true');
  await expect(square(page, 'd5')).toHaveAttribute('data-attack', 'both');

  await page.getByRole('switch', { name: 'แผนที่การโจมตี' }).click();
  await expect(page.locator('[data-attack]')).toHaveCount(0);
});
