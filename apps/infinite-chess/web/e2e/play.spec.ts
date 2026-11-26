import { expect, test } from '@playwright/test';

test('player makes a move and receives a legal bot reply', async ({ page }) => {
  await page.goto('/play?mode=bot');
  await page.getByRole('button', { name: 'Begin game' }).click();
  const board = page.getByTestId('infinite-board');
  await board.locator('[data-square="5,2"]').click();
  await board.locator('[data-square="5,4"]').click();
  await expect(page.locator('.move-record')).toHaveCount(2, { timeout: 30_000 });
  await expect(page.locator('.turn-banner b')).toContainText('You');
});

test('home, play setup, and the board fit a narrow phone viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const hasHorizontalOverflow = () => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);

  await page.goto('/');
  expect(await hasHorizontalOverflow()).toBe(false);
  await page.getByRole('link', { name: 'Play against a bot' }).click();
  expect(await hasHorizontalOverflow()).toBe(false);
  await page.getByRole('button', { name: 'Begin game' }).click();
  await expect(page.getByTestId('infinite-board')).toBeVisible();
  expect(await hasHorizontalOverflow()).toBe(false);
});

test('private invite room syncs a server-validated move between two players', async ({ page, browser }) => {
  await page.goto('/online');
  await page.getByRole('button', { name: 'Create room' }).click();
  await expect(page.getByTestId('room-code')).toBeVisible();
  const code = (await page.getByTestId('room-code').textContent())!.trim();

  const secondContext = await browser.newContext();
  const secondPage = await secondContext.newPage();
  await secondPage.goto('/online');
  await secondPage.getByLabel('Room code').fill(code);
  await secondPage.getByRole('button', { name: 'Join room' }).click();
  await expect(page.locator('.game-columns')).toBeVisible();
  await expect(secondPage.locator('.game-columns')).toBeVisible();

  const whitePage = await page.locator('.turn-banner b').textContent() === 'You' ? page : secondPage;
  const board = whitePage.getByTestId('infinite-board');
  await board.locator('[data-square="5,2"]').click();
  await board.locator('[data-square="5,4"]').click();
  await expect(page.locator('.move-record')).toHaveCount(1);
  await expect(secondPage.locator('.move-record')).toHaveCount(1);
  await secondContext.close();
});
