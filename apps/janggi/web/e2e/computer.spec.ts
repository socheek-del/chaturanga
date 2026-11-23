import { expect, test } from '@playwright/test';
import { play } from './helpers';

test('the computer replies as Black after Red moves (jg-005)', async ({ page }) => {
  await page.goto('/play/computer');
  await page.locator('[data-bot-level="1"]').click();
  await page.getByRole('radio', { name: '초 (선수)' }).click();
  await page.getByRole('button', { name: '시작' }).click();
  await play(page, [['a4', 'b4']]);
  await expect(page.getByTestId('turn-banner')).toHaveText('초 차례', { timeout: 30_000 });
  await expect(page.locator('[data-ply]')).toHaveCount(2);
});

test('the computer opens as Red when the player takes Black (jg-005)', async ({ page }) => {
  await page.goto('/play/computer');
  await page.locator('[data-bot-level="2"]').click();
  await page.getByRole('radio', { name: '한 (후수)' }).click();
  await page.getByRole('button', { name: '시작' }).click();
  await expect(page.getByRole('grid')).toHaveAttribute('data-orientation', 'b');
  await expect(page.getByTestId('turn-banner')).toHaveText('한 차례', { timeout: 30_000 });
  await expect(page.locator('[data-ply]')).toHaveCount(1);
});

test('a hint highlights a legal move for the player (jg-005)', async ({ page }) => {
  await page.goto('/play/computer');
  await page.locator('[data-bot-level="1"]').click();
  await page.getByRole('radio', { name: '초 (선수)' }).click();
  await page.getByRole('button', { name: '시작' }).click();
  await page.getByTestId('hint').click();
  await expect(page.locator('[data-square][data-hint]')).toHaveCount(2, { timeout: 30_000 });
});
