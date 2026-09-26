import { expect, test } from '@playwright/test';
import { play, startLocalGame } from './helpers';

const FOOLS_MATE = [
  ['f2', 'f3'],
  ['e7', 'e5'],
  ['g2', 'g4'],
  ['d8', 'h4'],
] as const;

test('a finished pass-and-play game is saved and listed under Games after a reload (ch-014)', async ({ page }) => {
  await startLocalGame(page);
  await play(page, FOOLS_MATE);
  await expect(page.getByTestId('turn-banner')).toHaveText('Black wins');
  await page.reload();
  await page.goto('/games');
  const rows = page.getByTestId('game-row');
  await expect(rows).toHaveCount(1);
  await expect(rows.first().getByTestId('game-outcome')).toHaveText('Black won');
  await expect(rows.first()).toContainText('White vs Black');
  await expect(rows.first()).toContainText('Pass and play');
  await expect(rows.first()).toContainText('2 moves');
});

test('a game against the computer is saved as it is played (ch-014)', async ({ page }) => {
  await page.goto('/play/computer');
  await page.locator('[data-bot-level="1"]').click();
  await page.getByRole('radio', { name: 'White' }).click();
  await page.getByRole('button', { name: 'Start' }).click();
  await play(page, [['e2', 'e4']]);
  await expect(page.locator('[data-ply]')).toHaveCount(2, { timeout: 30_000 });
  await play(page, [['d2', 'd4']]);
  await expect(page.locator('[data-ply]')).toHaveCount(4, { timeout: 30_000 });
  await page.reload();
  await page.goto('/games');
  const row = page.getByTestId('game-row');
  await expect(row).toHaveCount(1);
  await expect(row).toContainText('You vs Pawn');
  await expect(row.getByTestId('game-outcome')).toHaveText('Not finished');
});

test('Copy PGN gives the moves played, and a pasted PGN is imported (ch-014)', async ({ page }) => {
  await startLocalGame(page);
  await play(page, FOOLS_MATE);
  await page.goto('/games');
  await page.getByTestId('export-pgn').click();
  const pgn = page.getByTestId('pgn-output');
  await expect(pgn).toHaveValue(/\[Result "0-1"\]/);
  await expect(pgn).toHaveValue(/1\. f3 e5 2\. g4 Qh4# 0-1/);
  await expect(pgn).not.toHaveValue(/127\.0\.0\.1|localhost|https?:/);
  await page.keyboard.press('Escape');

  await page.getByTestId('import-pgn').click();
  await page.getByTestId('pgn-input').fill('1. e4 e5 2. Ke3');
  await page.getByTestId('pgn-submit').click();
  await expect(page.getByTestId('pgn-error')).toHaveText('Move 2 (Ke3) is not legal in this game.');
  await page.getByTestId('pgn-input').fill('[White "Anderssen"]\n[Black "Kieseritzky"]\n[Result "1-0"]\n\n1. e4 e5 2. f4 exf4 3. Bc4 1-0');
  await page.getByTestId('pgn-submit').click();
  await page.goto('/games');
  await expect(page.getByTestId('game-row')).toHaveCount(2);
  await expect(page.getByTestId('game-row').first()).toContainText('Anderssen vs Kieseritzky');
  await expect(page.getByTestId('game-row').first().getByTestId('game-outcome')).toHaveText('White won');
});

test('a game can be deleted (ch-014)', async ({ page }) => {
  await startLocalGame(page);
  await play(page, FOOLS_MATE);
  await page.goto('/games');
  await page.getByTestId('delete-game').click();
  await page.getByTestId('confirm-delete').click();
  await expect(page.getByTestId('games-empty')).toBeVisible();
});
