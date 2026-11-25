import { expect, test } from '@playwright/test';

const square = (page: import('@playwright/test').Page, name: string) =>
  page.getByRole('gridcell', { name: new RegExp('^' + name + ',') });

test('learns the objective, starts a local game, saves it and takes back a move', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'The river sets the board.' })).toBeVisible();

  await page.getByRole('button', { name: 'Learn the rules' }).click();
  await expect(page.getByRole('heading', { name: 'Learn Congo' })).toBeVisible();
  await page.getByRole('button', { name: /A game of territory/ }).click();
  await expect(page.getByTestId('lesson-player')).toBeVisible();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('radio', { name: 'Capture the opposing Lion.' }).click();
  await page.getByRole('button', { name: 'Check answer' }).click();
  await expect(page.getByText('That’s right')).toBeVisible();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByTestId('lesson-complete')).toBeVisible();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();

  await expect(page.getByText('1 of 8 lessons completed')).toBeVisible();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.getByRole('button', { name: 'Play together' }).click();
  await page.getByRole('button', { name: 'Start game' }).click();

  await square(page, 'a2').click();
  await square(page, 'a3').click();
  await expect(page.getByTestId('move-list').locator('[data-ply]')).toHaveCount(1);
  await page.reload();
  await page.getByRole('button', { name: 'Play together' }).click();
  await expect(page.getByTestId('move-list').locator('[data-ply]')).toHaveCount(1);
  await page.getByRole('button', { name: 'Take back' }).click();
  await expect(page.getByTestId('move-list').locator('[data-ply]')).toHaveCount(0);
});

test('plays as Black against the bot and receives a legal opening move', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Choose a rival' }).click();
  await page.getByRole('radio', { name: 'Black', exact: true }).click();
  await page.getByRole('button', { name: 'Start game' }).click();
  await expect(page.getByTestId('turn-banner')).toContainText('Black to move', { timeout: 10_000 });
  await expect(page.getByTestId('move-list').locator('[data-ply]')).toHaveCount(1, { timeout: 10_000 });
  await expect(page.getByTestId('player-b')).toContainText('You');
});

test('shows every Congo lesson on a narrow screen without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Learn the rules' }).click();
  await expect(page.getByRole('heading', { name: 'Learn Congo' })).toBeVisible();
  await expect(page.getByRole('button', { name: /The Lion leaves its castle/ })).toBeVisible();
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth', 390);
});
