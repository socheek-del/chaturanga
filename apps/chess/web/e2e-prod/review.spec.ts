import { expect, test } from '@playwright/test';

/** ch-016: after a deploy, the engine is served and a finished game is reviewed on the live site. */
test('a finished game is analysed and reviewed in production (ch-015, ch-016)', async ({ page, request }) => {
  const wasm = await request.get('/engine/stockfish.wasm');
  expect(wasm.status()).toBe(200);
  expect(wasm.headers()['content-type']).toContain('wasm');

  await page.goto('/play/local');
  await page.getByRole('button', { name: 'Start' }).click();
  for (const [from, to] of [
    ['f2', 'f3'],
    ['e7', 'e5'],
    ['g2', 'g4'],
    ['d8', 'h4'],
  ]) {
    await page.locator(`[data-square="${from}"]`).click();
    await page.locator(`[data-square="${to}"]`).click();
  }
  await page.getByTestId('game-review').click();
  await expect(page.getByTestId('review-summary')).toBeVisible({ timeout: 60_000 });
  await page.getByTestId('start-review').click();
  await page.getByTestId('review-move-list').locator('[data-ply="3"]').click();
  await expect(page.getByTestId('coach-verdict')).toHaveAttribute('data-label', 'blunder');
});
