import { expect, test } from '@playwright/test';

test('teaches Werera interactively and saves lesson progress', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /An open field.*A flying start/ })).toBeVisible();
  await page.getByRole('link', { name: 'Learn Senterej' }).first().click();
  await expect(page.getByRole('heading', { name: 'Learn Senterej' })).toBeVisible();
  await page.locator('.lesson-card').first().click();
  await expect(page.getByRole('link', { name: 'Back to lessons' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toHaveCount(0);
  await expect(page.getByTestId('lesson-player')).toHaveAttribute('data-step', '0');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('radio', { name: 'Either side may act during Werera' }).click();
  await page.getByRole('button', { name: 'Check answer' }).click();
  await expect(page.getByRole('status')).toContainText('That is right');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByTestId('lesson-complete')).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.locator('.lesson-card').first()).toContainText('✓');
});

test('plays a saved game against a seeded bot through the first capture', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Play a bot' }).click();
  await page.getByRole('button', { name: 'Begin game' }).click();
  await expect(page.getByRole('link', { name: 'Back to game choices' })).toBeVisible();
  await expect(page.getByRole('grid', { name: 'Senterej board' })).toBeVisible();
  await page.locator('[data-square="e2"]').click();
  await page.locator('[data-square="e3"]').click();
  await expect(page.locator('[data-testid="move-list"] [data-ply]')).toHaveCount(1);
  await expect.poll(() => page.locator('[data-testid="move-list"] [data-ply]').count(), { timeout: 20_000 }).toBe(2);
  await expect(page.getByText('Saved on this device')).toBeVisible();
  await page.reload();
  await expect(page.locator('[data-testid="move-list"] [data-ply]')).toHaveCount(2);
});

test('plays concurrent Werera actions in a private online room until capture switches to turns', async ({ browser, page: ivory }) => {
  await ivory.goto('/online');
  await ivory.getByRole('radio', { name: 'Ivory' }).click();
  await ivory.getByRole('button', { name: 'Create invite' }).click();
  await expect(ivory.getByTestId('room-code')).toBeVisible();
  const invite = await ivory.getByTestId('room-link').innerText();
  const gold = await browser.newPage();
  await gold.goto(invite);
  await expect(ivory.getByTestId('player-w')).toContainText('You');
  await expect(gold.getByTestId('player-b')).toContainText('You');
  await expect(ivory.getByTestId('connection-status')).toHaveCount(0);
  await expect(gold.getByTestId('connection-status')).toHaveCount(0);
  await expect(ivory.getByTestId('turn-banner')).toContainText('both sides may act');

  const move = async (page: typeof gold, observer: typeof ivory, from: string, to: string, ply: number) => {
    await page.locator(`[data-square="${from}"]`).click();
    await page.locator(`[data-square="${to}"]`).click();
    await expect.poll(() => observer.locator('[data-testid="move-list"] [data-ply]').count(), { timeout: 20_000 }).toBe(ply);
  };
  await move(gold, ivory, 'd7', 'd6', 1);
  await move(gold, ivory, 'd6', 'd5', 2);
  await move(ivory, gold, 'e2', 'e3', 3);
  await move(ivory, gold, 'e3', 'e4', 4);
  await move(ivory, gold, 'e4', 'd5', 5);
  await expect(gold.locator('[data-testid="move-list"] [data-ply]')).toHaveCount(5);
  await expect(gold.getByTestId('turn-banner')).toContainText('Gold to move');
  await expect(gold.locator('[data-testid="player-w"]')).not.toHaveAttribute('data-active', 'true');
  await expect(gold.locator('[data-testid="player-b"]')).toHaveAttribute('data-active', 'true');
  await gold.context().close();
});

test('keeps the PWA layout inside a phone screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('html')).toHaveJSProperty('scrollWidth', await page.evaluate(() => document.documentElement.clientWidth));
});
