import { expect, test } from '@playwright/test';
import { play, startLocalGame } from './helpers';

// White mates in one: the rook reaches the back rank while the king guards the escape squares.
const MATE_IN_ONE = 'k7/8/1K6/8/8/8/8/7R w - - 0 1';
// The black rook on d2 stands next to the white king: Kxd2 wins it, Kf1 lets it go.
const HANGING_ROOK = '4k3/8/8/8/8/8/3r4/R3K3 w - - 0 1';

test('the site is cross-origin isolated, which the review engine needs (review-002)', async ({ page }) => {
  await page.goto('/');
  expect(await page.evaluate(() => crossOriginIsolated)).toBe(true);
});

test('a finished game is saved, listed under Games, and exported as Makruk PGN (review-001)', async ({ page }) => {
  await startLocalGame(page, { fen: MATE_IN_ONE });
  await play(page, [['h1', 'h8']]);
  await expect(page.getByTestId('turn-banner')).toContainText('ขาว');
  await page.reload();
  await page.goto('/games');
  const row = page.getByTestId('game-row');
  await expect(row).toHaveCount(1);
  await expect(row.getByTestId('game-outcome')).toHaveText('ขาวชนะ');
  await expect(row).toContainText('สองคนเครื่องเดียว');

  await row.getByTestId('export-pgn').click();
  const pgn = page.getByTestId('pgn-output');
  await expect(pgn).toHaveValue(/\[Variant "makruk"\]/);
  await expect(pgn).toHaveValue(/\[FEN "k7\/8\/1K6\/8\/8\/8\/8\/7R w - - 0 1"\]/);
  await expect(pgn).toHaveValue(/1\. Rh8# 1-0/);
  await expect(pgn).not.toHaveValue(/127\.0\.0\.1|localhost|https?:/);
  const text = await pgn.inputValue();
  await page.keyboard.press('Escape');

  await page.getByTestId('import-pgn').click();
  await page.getByTestId('pgn-input').fill('1. e4 e5 2. e6');
  await page.getByTestId('pgn-submit').click();
  await expect(page.getByTestId('pgn-error')).toHaveText('ตาที่ 2 (e6) เดินไม่ได้ในเกมนี้');
  await page.getByTestId('pgn-input').fill(text.replace('[White "ขาว"]', '[White "Nai Khanom Tom"]'));
  await page.getByTestId('pgn-submit').click();
  await expect(page).toHaveURL(/\/games\/imported-/);
  await page.goto('/games');
  await expect(page.getByTestId('game-row')).toHaveCount(2);
  await expect(page.getByTestId('game-row').first()).toContainText('Nai Khanom Tom');
});

test('a game against the computer is saved as it is played (review-001)', async ({ page }) => {
  await page.goto('/play/computer');
  await page.locator('[data-bot-level="1"]').click();
  await page.getByRole('radio', { name: 'ขาว' }).click();
  await page.getByRole('button', { name: 'เริ่มเกม' }).click();
  await play(page, [['c3', 'c4']]);
  await expect(page.locator('[data-ply]')).toHaveCount(2, { timeout: 30_000 });
  await play(page, [['d3', 'd4']]);
  await expect(page.locator('[data-ply]')).toHaveCount(4, { timeout: 30_000 });
  await page.goto('/games');
  await expect(page.getByTestId('game-row')).toHaveCount(1);
  await expect(page.getByTestId('game-row')).toContainText('คุณ พบ น้องเบี้ย');
});

test('the result dialog opens the review, and Fairy-Stockfish analyses the game (review-002)', async ({ page }) => {
  await startLocalGame(page, { fen: MATE_IN_ONE });
  await play(page, [['h1', 'h8']]);
  await page.getByTestId('game-review').click();
  await expect(page).toHaveURL(/\/games\/local-/);
  await expect(page.getByTestId('review-summary')).toBeVisible({ timeout: 60_000 });
  await page.getByTestId('start-review').click();
  await expect(page.getByTestId('coach-verdict')).toHaveAttribute('data-label', /best|great|brilliant/);
  await expect(page.getByTestId('coach-verdict')).toContainText('Rh8#');
});

test('a move that lets a rook go is flagged, with the capture drawn as the best move (review-002)', async ({ page }) => {
  await startLocalGame(page, { fen: HANGING_ROOK });
  await play(page, [
    ['e1', 'f1'],
    ['d2', 'd8'],
  ]);
  await page.goto('/games');
  await page.getByTestId('open-review').click();
  await expect(page.getByTestId('review-summary')).toBeVisible({ timeout: 60_000 });
  await page.getByTestId('review-move-list').locator('[data-ply="1"]').click();
  await expect(page.getByTestId('coach-verdict')).toHaveAttribute('data-label', /mistake|blunder/);
  await expect(page.getByTestId('coach-best')).toContainText('Kxd2');
  await expect(page.getByTestId('best-arrow')).toHaveCount(1);
  await page.screenshot({ path: 'e2e-evidence/review-makruk.png' });

  // A second visit is labelled from storage, without starting the engine.
  await page.reload();
  await expect(page.getByTestId('review-summary')).toBeVisible({ timeout: 5_000 });
  const engineLoads = await page.evaluate(() => performance.getEntriesByType('resource').filter((e) => e.name.includes('/engine/')).length);
  expect(engineLoads).toBe(0);
});
