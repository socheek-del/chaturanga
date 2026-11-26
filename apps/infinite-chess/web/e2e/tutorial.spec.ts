import { expect, test } from '@playwright/test';

test('tutorial practices long coordinates and pawn promotion on the board', async ({ page }) => {
  await page.goto('/learn');
  await page.getByRole('link', { name: /Coordinates and distance/ }).click();
  await page.getByTestId('infinite-board').locator('[data-square="2,2"]').click();
  await page.getByLabel('Target x coordinate').fill('2');
  await page.getByLabel('Target y coordinate').fill('14');
  await page.getByRole('button', { name: 'Move to target coordinate' }).click();
  await expect(page.getByRole('status')).toContainText('Well played');

  await page.getByRole('button', { name: 'Next practice' }).click();
  await page.getByTestId('infinite-board').locator('[data-square="3,7"]').click();
  await page.getByTestId('infinite-board').locator('[data-square="3,8"]').click();
  await page.getByRole('button', { name: 'Promote to queen' }).click();
  await expect(page.getByRole('status')).toContainText('Well played');
});

test('tutorial practices castling, en passant, check evasions, and draw rules', async ({ page }) => {
  const move = async (from: string, to: string) => {
    const board = page.getByTestId('infinite-board');
    await board.locator(`[data-square="${from}"]`).click();
    await board.locator(`[data-square="${to}"]`).click();
  };
  const expectComplete = () => expect(page.getByRole('status')).toContainText('Well played');

  await page.goto('/learn/castling');
  await move('5,1', '7,1');
  await expectComplete();

  await page.goto('/learn/en-passant');
  await move('1,5', '2,6');
  await expectComplete();

  await page.goto('/learn/check');
  await move('2,2', '0,3');
  await expectComplete();

  await page.goto('/learn/fifty-move');
  await move('1,0', '2,0');
  await expectComplete();

  await page.goto('/learn/insufficient-material');
  await move('1,1', '2,2');
  await expectComplete();

  await page.goto('/learn/repetition');
  for (const [from, to] of [
    ['0,0', '0,1'], ['3,0', '3,1'], ['0,1', '0,0'], ['3,1', '3,0'],
    ['0,0', '0,1'], ['3,0', '3,1'], ['0,1', '0,0'], ['3,1', '3,0'],
  ]) await move(from, to);
  await expectComplete();
});
