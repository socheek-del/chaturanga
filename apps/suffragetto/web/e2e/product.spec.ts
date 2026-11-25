import { expect, test } from '@playwright/test';

const square = (page: import('@playwright/test').Page, name: string) =>
  page.getByRole('gridcell', { name: new RegExp('^' + name + ',') });

test('completes a tutorial, uses the exchange action, and saves a local game', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /A contest in six places/ })).toBeVisible();
  await page.getByRole('button', { name: 'Learn the rules', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Learn Suffragetto' })).toBeVisible();
  await page.getByRole('button', { name: /Demand an exchange/ }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByTestId('lesson-actions-legal')).toBeVisible();
  await page.getByRole('button', { name: /1 small, 1 large/ }).click();
  await expect(page.getByText('The matched pieces return automatically. The exchange uses one turn.')).toBeVisible();

  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByTestId('lesson-complete')).toBeVisible();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.getByRole('button', { name: 'Two players, one board' }).click();
  await page.getByRole('button', { name: 'Start game' }).click();
  await square(page, 'i6').click();
  await square(page, 'i7').click();
  await expect(page.getByTestId('move-list').locator('[data-ply]')).toHaveCount(1);
  await page.reload();
  await page.getByRole('button', { name: 'Two players, one board' }).click();
  await expect(page.getByTestId('move-list').locator('[data-ply]')).toHaveCount(1);
  await page.getByRole('button', { name: 'Take back' }).click();
  await expect(page.getByTestId('move-list').locator('[data-ply]')).toHaveCount(0);
});

test('lets Police make the first move against the bot', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Play a bot' }).click();
  await page.getByRole('radiogroup', { name: 'First player' }).getByRole('radio', { name: 'Police' }).click();
  await page.getByRole('button', { name: 'Start game' }).click();
  await expect(page.getByTestId('turn-banner')).toContainText('Suffragettes to move', { timeout: 10_000 });
  await expect(page.getByTestId('move-list').locator('[data-ply]')).toHaveCount(1, { timeout: 10_000 });
  await expect(page.getByTestId('player-w')).toContainText('You');
});

test('shows every lesson on a narrow screen without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Learn the rules', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Learn Suffragetto' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Occupy all six cells/ })).toBeVisible();
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth', 390);
});
