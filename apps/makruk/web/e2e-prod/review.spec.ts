import { expect, test } from '@playwright/test';

/** review-002: after a deploy, the live site is cross-origin isolated and reviews a game with Fairy-Stockfish. */
test('the live site sends the isolation headers and serves the engine (review-002)', async ({ request }) => {
  const home = await request.get('/');
  expect(home.headers()['cross-origin-opener-policy']).toBe('same-origin');
  expect(home.headers()['cross-origin-embedder-policy']).toBe('require-corp');
  const deep = await request.get('/games');
  expect(deep.headers()['cross-origin-embedder-policy']).toBe('require-corp');
  const wasm = await request.get('/engine/stockfish.wasm');
  expect(wasm.status()).toBe(200);
  expect(wasm.headers()['content-type']).toContain('wasm');
  expect((await request.get('/engine/stockfish.worker.js')).status()).toBe(200);
});

test('a finished game is analysed and reviewed in production (review-001, review-002)', async ({ page }) => {
  await page.goto(`/play/local?fen=${encodeURIComponent('4k3/8/8/8/8/8/3r4/R3K3 w - - 0 1')}`);
  await page.locator('[data-time-control="none"]').click();
  await page.getByRole('button', { name: 'เริ่มเกม' }).click();
  for (const [from, to] of [
    ['e1', 'f1'],
    ['d2', 'd8'],
  ]) {
    await page.locator(`[data-square="${from}"]`).click();
    await page.locator(`[data-square="${to}"]`).click();
  }
  expect(await page.evaluate(() => crossOriginIsolated)).toBe(true);
  await page.goto('/games');
  await page.getByTestId('open-review').click();
  await expect(page.getByTestId('review-summary')).toBeVisible({ timeout: 60_000 });
  await page.getByTestId('review-move-list').locator('[data-ply="1"]').click();
  await expect(page.getByTestId('coach-verdict')).toHaveAttribute('data-label', /mistake|blunder/);
  await expect(page.getByTestId('coach-best')).toContainText('Kxd2');
});
