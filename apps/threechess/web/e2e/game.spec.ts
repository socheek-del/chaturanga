import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('plays White, Black and Red in order on 91 hexagonal cells', async ({ page }) => {
  await page.getByRole('button', { name: 'Set the board' }).click();
  await expect(page.getByRole('gridcell')).toHaveCount(91);

  await page.getByTestId('cell-d10').click();
  await expect(page.getByTestId('cell-d9')).toHaveAttribute('data-legal', 'true');
  await page.getByTestId('cell-d9').click();
  await expect(page.locator('.turn-pill')).toContainText('Black to move');

  await page.getByTestId('cell-j4').click();
  await expect(page.getByTestId('cell-i5')).toHaveAttribute('data-legal', 'true');
  await page.getByTestId('cell-i5').click();
  await expect(page.locator('.turn-pill')).toContainText('Red to move');
});

test('saves a position across reloads and can take back the last move', async ({ page }) => {
  await page.getByRole('button', { name: 'Set the board' }).click();
  await page.getByTestId('cell-d10').click();
  await page.getByTestId('cell-d9').click();
  await page.reload();
  await page.getByRole('button', { name: 'Set the board' }).click();
  await expect(page.locator('.turn-pill')).toContainText('Black to move');

  await page.getByTestId('cell-j4').click();
  await page.getByTestId('cell-i5').click();
  await expect(page.locator('.turn-pill')).toContainText('Red to move');
  await page.getByRole('button', { name: 'Take back' }).click();
  await expect(page.locator('.turn-pill')).toContainText('Black to move');
  await expect(page.locator('.move-list')).toContainText('d10d9');
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

for (const width of [390, 1280]) {
  test(`teaches the complete guided tutorial at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.getByRole('button', { name: 'Start tutorial' }).click();
    const next = () => page.getByRole('button', { name: 'Continue', exact: true }).click();
    await next();
    for (const [from, to] of [['d10', 'd9'], ['j4', 'i5'], ['d4', 'e4']]) {
      await page.getByTestId(`cell-${from}`).click();
      await page.getByTestId(`cell-${to}`).click();
      await expect(page.getByRole('status')).toHaveAttribute('data-result', 'correct');
      await next();
    }
    await next();
    const promotion = async (piece: string) => {
      await page.getByTestId('cell-f2').click();
      await page.getByTestId('cell-f1').click();
      await page.getByRole('button', { name: `Promote to ${piece}` }).click();
    };
    await promotion('queen');
    await expect(page.getByRole('status')).toHaveAttribute('data-result', 'wrong');
    await promotion('knight');
    await expect(page.getByRole('status')).toHaveAttribute('data-result', 'correct');
    await next();
    await page.getByTestId('cell-i1').click();
    await page.getByTestId('cell-g2').click();
    await expect(page.getByRole('status')).toHaveAttribute('data-result', 'correct');
    await next();
    await page.getByRole('button', { name: 'Their turn passes' }).click();
    await page.getByRole('button', { name: 'Check answer' }).click();
    await next();
    await expect(page.getByRole('heading', { name: 'Tutorial complete' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  });
}
