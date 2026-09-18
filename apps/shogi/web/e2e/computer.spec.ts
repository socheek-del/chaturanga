import { expect, test } from '@playwright/test';
import { play } from './helpers';

test('the computer replies as Gote after Sente moves (sg-005)', async ({ page }) => {
  await page.goto('/play/computer');
  await page.locator('[data-bot-level="1"]').click();
  await page.getByRole('radio', { name: '先手' }).click();
  await page.getByRole('button', { name: '開始' }).click();
  await play(page, [['g3', 'g4']]);
  await expect(page.getByTestId('turn-banner')).toHaveText('先手の番', { timeout: 30_000 });
  await expect(page.locator('[data-ply]')).toHaveCount(2);
});

test('the computer opens as Sente when the player takes Gote (sg-005)', async ({ page }) => {
  await page.goto('/play/computer');
  await page.locator('[data-bot-level="2"]').click();
  await page.getByRole('radio', { name: '後手' }).click();
  await page.getByRole('button', { name: '開始' }).click();
  await expect(page.getByRole('grid')).toHaveAttribute('data-orientation', 'b');
  await expect(page.getByTestId('turn-banner')).toHaveText('後手の番', { timeout: 30_000 });
  await expect(page.locator('[data-ply]')).toHaveCount(1);
});

test('a hint highlights a legal move for the player (sg-005)', async ({ page }) => {
  await page.goto('/play/computer');
  await page.locator('[data-bot-level="1"]').click();
  await page.getByRole('radio', { name: '先手' }).click();
  await page.getByRole('button', { name: '開始' }).click();
  await page.getByTestId('hint').click();
  await expect(page.locator('[data-square][data-hint]')).toHaveCount(2, { timeout: 30_000 });
});
