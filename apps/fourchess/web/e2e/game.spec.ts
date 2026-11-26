import { expect, test } from '@playwright/test';

test('teaches every rule interactively and lets a player start a bot game', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Four seats/ })).toBeVisible();
  await page.getByRole('button', { name: 'Learn the game' }).click();

  await expect(page.getByText('Lesson 1 of 11')).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Blue', exact: true }).click();
  await page.getByRole('button', { name: 'Check answer' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.locator('[data-square="e1"]').click();
  await page.locator('[data-square="d3"]').click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.locator('[data-square="d2"]').click();
  await page.locator('[data-square="d4"]').click();
  await expect(page.getByRole('status')).toContainText('That’s right');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Left, toward the center' }).click();
  await page.getByRole('button', { name: 'Check answer' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.locator('[data-square="e4"]').click();
  await page.locator('[data-square="e8"]').click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.locator('[data-square="d7"]').click();
  await page.locator('[data-square="d8"]').click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'All active seats receive 10 points' }).click();
  await page.getByRole('button', { name: 'Check answer' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: 'You’re ready for the table.' })).toBeVisible();
  await page.getByRole('button', { name: 'Return to Fourfold' }).click();

  await page.getByRole('button', { name: 'Play the bots' }).click();
  await page.getByRole('button', { name: 'Start with Red' }).click();
  await expect(page.getByRole('grid', { name: 'Fourfold Chess 14 by 14 crossboard' })).toBeVisible();
  await page.locator('[data-square="d2"]').click();
  await page.locator('[data-square="d4"]').click();
  await expect(page.locator('.move-history li')).toHaveCount(2, { timeout: 20_000 });
});

test('supports saved pass-and-play, install metadata, and the mobile board layout', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Pass and play' }).click();
  await page.locator('[data-square="d2"]').click();
  await page.locator('[data-square="d4"]').click();
  await expect(page.locator('.turn-banner')).toContainText('Blue to move');
  await page.reload();
  await page.getByRole('button', { name: 'Pass and play' }).click();
  await expect(page.locator('.move-history li')).toHaveCount(1);
  await expect(page.locator('html')).toHaveJSProperty('scrollWidth', await page.evaluate(() => document.documentElement.clientWidth));
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', /manifest\.webmanifest/);
});
