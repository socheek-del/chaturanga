import { expect, test } from '@playwright/test';
import { play } from './helpers';

test('the computer replies as Black after White moves (ch-005)', async ({ page }) => {
  await page.goto('/play/computer');
  await page.locator('[data-bot-level="1"]').click();
  await page.getByRole('radio', { name: 'White' }).click();
  await page.getByRole('button', { name: 'Start' }).click();
  await play(page, [['e2', 'e4']]);
  await expect(page.getByTestId('turn-banner')).toHaveText('White to move', { timeout: 30_000 });
  await expect(page.locator('[data-ply]')).toHaveCount(2);
});

test('the computer opens as White when the player takes Black (ch-005)', async ({ page }) => {
  await page.goto('/play/computer');
  await page.locator('[data-bot-level="2"]').click();
  await page.getByRole('radio', { name: 'Black' }).click();
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page.getByRole('grid')).toHaveAttribute('data-orientation', 'b');
  await expect(page.getByTestId('turn-banner')).toHaveText('Black to move', { timeout: 30_000 });
  await expect(page.locator('[data-ply]')).toHaveCount(1);
});

test('a hint highlights a legal move for the player (ch-005)', async ({ page }) => {
  await page.goto('/play/computer');
  await page.locator('[data-bot-level="1"]').click();
  await page.getByRole('radio', { name: 'White' }).click();
  await page.getByRole('button', { name: 'Start' }).click();
  await page.getByTestId('hint').click();
  await expect(page.locator('[data-square][data-hint]')).toHaveCount(2, { timeout: 30_000 });
});
