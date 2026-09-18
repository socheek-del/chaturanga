import { expect, test } from '@playwright/test';
import { pieceOn, play, seedSavedGame, square, startLocalGame, targets } from './helpers';

test('pieces stand in the squares of an 8x8 board, White at the bottom (ch-005)', async ({ page }) => {
  await startLocalGame(page);
  await expect(page.locator('[data-square]')).toHaveCount(64);
  await expect(page.locator('[data-square] [data-piece]')).toHaveCount(32);
  await expect(pieceOn(page, 'e1')).toHaveAttribute('data-piece', 'wk');
  await expect(pieceOn(page, 'e8')).toHaveAttribute('data-piece', 'bk');
  // The chequer is drawn underneath the squares, not by the squares themselves.
  await expect(page.locator('[data-underlay] svg')).toHaveCount(1);
});

test('a tapped move is played and the turn passes to Black; undo takes it back (ch-005)', async ({ page }) => {
  await startLocalGame(page);
  const banner = page.getByTestId('turn-banner');
  await expect(banner).toHaveText('White to move');
  await play(page, [['e2', 'e4']]);
  await expect(banner).toHaveText('Black to move');
  await expect(page.getByTestId('move-list')).toContainText('e4');

  await page.getByRole('button', { name: 'Take back' }).click();
  await expect(pieceOn(page, 'e2')).toHaveAttribute('data-piece', 'wp');
  await expect(pieceOn(page, 'e4')).toHaveCount(0);
  await expect(banner).toHaveText('White to move');
});

test('a dragged move is played (ch-005)', async ({ page }) => {
  await startLocalGame(page);
  const from = (await square(page, 'd2').boundingBox())!;
  const to = (await square(page, 'd4').boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect(pieceOn(page, 'd4')).toHaveAttribute('data-piece', 'wp');
  await expect(page.getByTestId('turn-banner')).toHaveText('Black to move');
});

test("selecting a piece shows exactly the engine's legal squares (ch-005)", async ({ page }) => {
  await startLocalGame(page);
  await square(page, 'g1').click();
  expect(await targets(page)).toEqual(['f3', 'h3']);
  await square(page, 'e2').click();
  expect(await targets(page)).toEqual(['e3', 'e4']);
});

test('castling moves the rook with the king (ch-005)', async ({ page }) => {
  await seedSavedGame(page, 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1');
  await page.goto('/play/local');
  await play(page, [['e1', 'g1']]);
  await expect(pieceOn(page, 'g1')).toHaveAttribute('data-piece', 'wk');
  await expect(pieceOn(page, 'f1')).toHaveAttribute('data-piece', 'wr');
  await expect(pieceOn(page, 'h1')).toHaveCount(0);
  await expect(page.getByTestId('move-list')).toContainText('O-O');
});

test('a pawn can be taken in passing (ch-005)', async ({ page }) => {
  await seedSavedGame(page, 'rnbqkbnr/pppppppp/8/4P3/8/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1');
  await page.goto('/play/local');
  await play(page, [['d7', 'd5']]);
  await square(page, 'e5').click();
  expect(await targets(page)).toContain('d6');
  await square(page, 'd6').click();
  await expect(pieceOn(page, 'd6')).toHaveAttribute('data-piece', 'wp');
  await expect(pieceOn(page, 'd5')).toHaveCount(0);
  await expect(page.getByTestId('move-list')).toContainText('exd6');
});

test('a promoting pawn asks which piece, and an under-promotion is possible (ch-005, plat-014)', async ({ page }) => {
  await seedSavedGame(page, '7k/1P6/8/8/8/8/8/K7 w - - 0 1');
  await page.goto('/play/local');
  await square(page, 'b7').click();
  await square(page, 'b8').click();
  await expect(page.getByTestId('promote-q')).toBeVisible();
  await expect(page.getByTestId('promote-n')).toBeVisible();
  await page.getByTestId('promote-n').click();
  await expect(pieceOn(page, 'b8')).toHaveAttribute('data-piece', 'wn');
  await expect(page.getByTestId('move-list')).toContainText('b8=N');
});

test('checkmate ends the game and names the winner (ch-005)', async ({ page }) => {
  await seedSavedGame(page, '6k1/5ppp/8/8/8/8/8/3R2K1 w - - 0 1');
  await page.goto('/play/local');
  await play(page, [['d1', 'd8']]);
  await expect(page.getByTestId('turn-banner')).toHaveText('White wins');
  await expect(page.getByTestId('result-reason')).toHaveText('Checkmate');
});

test('stalemate is shown as a draw (ch-005)', async ({ page }) => {
  await seedSavedGame(page, '7k/8/8/3K1Q2/8/8/8/8 w - - 0 1');
  await page.goto('/play/local');
  await play(page, [['f5', 'f7']]);
  await expect(page.getByTestId('turn-banner')).toHaveText('Draw');
  await expect(page.getByTestId('result-reason')).toContainText('Stalemate');
});

test('a finished game can be reviewed and played again (ch-005)', async ({ page }) => {
  await seedSavedGame(page, '6k1/5ppp/8/8/8/8/8/3R2K1 w - - 0 1');
  await page.goto('/play/local');
  await play(page, [['d1', 'd8']]);
  await page.getByRole('button', { name: 'Look at the board' }).click();
  await page.getByRole('button', { name: 'Previous move' }).click();
  await expect(pieceOn(page, 'd1')).toHaveAttribute('data-piece', 'wr');
  await page.getByRole('button', { name: 'Back to the game' }).click();
  await expect(pieceOn(page, 'd8')).toHaveAttribute('data-piece', 'wr');
});
