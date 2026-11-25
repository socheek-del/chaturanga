import { expect, test } from '@playwright/test';

const square = (page: import('@playwright/test').Page, name: string) =>
  page.getByRole('gridcell', { name: new RegExp('^' + name + ',') });

test('completes an interactive rule lesson and plays a local saved game', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /A race to the center/ })).toBeVisible();

  await page.getByRole('button', { name: 'Learn the rules', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Learn Jeson Mor' })).toBeVisible();
  await page.getByRole('button', { name: /A race to the center/ }).click();
  await expect(page.getByTestId('lesson-player')).toBeVisible();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('radio', { name: /Capture every opposing horse/ }).click();
  await page.getByRole('button', { name: 'Check answer' }).click();
  await expect(page.getByText('That’s right')).toBeVisible();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByTestId('lesson-complete')).toBeVisible();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByText('1 of 7 lessons completed')).toBeVisible();

  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.getByRole('button', { name: 'Two players, one board' }).click();
  await page.getByRole('button', { name: 'Start game' }).click();
  await square(page, 'a1').click();
  await square(page, 'b3').click();
  await expect(page.getByTestId('move-list').locator('[data-ply]')).toHaveCount(1);
  await page.reload();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.getByRole('button', { name: /Two players, one board/ }).click();
  await expect(page.getByTestId('move-list').locator('[data-ply]')).toHaveCount(1);
  await page.getByRole('button', { name: 'Take back' }).click();
  await expect(page.getByTestId('move-list').locator('[data-ply]')).toHaveCount(0);
});

test('lets Black make the first move against the bot', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Choose a bot' }).click();
  await page.getByRole('radiogroup', { name: 'First player' }).getByRole('radio', { name: 'Black' }).click();
  await page.getByRole('button', { name: 'Start game' }).click();
  await expect(page.getByTestId('turn-banner')).toContainText('White to move', { timeout: 10_000 });
  await expect(page.getByTestId('move-list').locator('[data-ply]')).toHaveCount(1, { timeout: 10_000 });
  await expect(page.getByTestId('player-w')).toContainText('You');
});

test('shows every Jeson Mor lesson on a narrow screen without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Learn the rules', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Learn Jeson Mor' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Leave e5 to win/ })).toBeVisible();
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth', 390);
});
