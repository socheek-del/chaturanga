import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('plays White, Black and Red in order on 96 squares', async ({ page }) => {
  await page.getByRole('button', { name: 'Set the board' }).click();
  await expect(page.getByRole('gridcell')).toHaveCount(96);

  await page.getByTestId('cell-e2').click();
  await expect(page.getByTestId('cell-e4')).toHaveAttribute('data-legal', 'true');
  await page.getByTestId('cell-e4').click();
  await expect(page.locator('.turn-pill')).toContainText('Black to move');

  await page.getByTestId('cell-e6').click();
  await expect(page.getByTestId('cell-e8')).toHaveAttribute('data-legal', 'true');
  await page.getByTestId('cell-e8').click();
  await expect(page.locator('.turn-pill')).toContainText('Red to move');
});

test('saves a position across reloads and can take back the last move', async ({ page }) => {
  await page.getByRole('button', { name: 'Set the board' }).click();
  await page.getByTestId('cell-e2').click();
  await page.getByTestId('cell-e4').click();
  await page.reload();
  await page.getByRole('button', { name: 'Set the board' }).click();
  await expect(page.locator('.turn-pill')).toContainText('Black to move');

  await page.getByTestId('cell-e6').click();
  await page.getByTestId('cell-e8').click();
  await expect(page.locator('.turn-pill')).toContainText('Red to move');
  await page.getByRole('button', { name: 'Take back' }).click();
  await expect(page.locator('.turn-pill')).toContainText('Black to move');
  await expect(page.locator('.move-list')).toContainText('e2e4');
});

test('keeps the board inside a phone viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Set the board' }).click();
  const board = page.locator('.board-grid');
  await expect(board).toBeVisible();
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    board: document.querySelector('.board-grid')!.getBoundingClientRect().width,
  }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
  expect(dimensions.board).toBeLessThanOrEqual(dimensions.viewport);
});
