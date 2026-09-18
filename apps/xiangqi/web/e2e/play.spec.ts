import { expect, test } from '@playwright/test';
import { pieceOn, play, point, seedSavedGame, startLocalGame, targets } from './helpers';

test('pieces stand on the points of a 9x10 board, Red at the bottom (xq-005)', async ({ page }) => {
  await startLocalGame(page);
  const board = page.getByRole('grid');
  await expect(board).toHaveAttribute('data-grid', 'points');
  await expect(page.locator('[data-square]')).toHaveCount(90);
  await expect(page.locator('[data-square] [data-piece]')).toHaveCount(32);
  await expect(pieceOn(page, 'e1')).toHaveAttribute('data-piece', 'wk');
  await expect(pieceOn(page, 'e10')).toHaveAttribute('data-piece', 'bk');
  await expect(page.locator('[data-underlay] svg')).toHaveCount(1);
});

test('a tapped move is played and the turn passes to Black; undo takes it back (xq-005)', async ({ page }) => {
  await startLocalGame(page);
  const banner = page.getByTestId('turn-banner');
  await expect(banner).toHaveText('轮到红方');
  await play(page, [['h3', 'e3']]);
  await expect(banner).toHaveText('轮到黑方');
  // Both cannons can reach e3, so the SAN names the file it came from.
  await expect(page.getByTestId('move-list')).toContainText('Che3');

  await page.getByRole('button', { name: '悔棋' }).click();
  await expect(pieceOn(page, 'h3')).toHaveAttribute('data-piece', 'wc');
  await expect(pieceOn(page, 'e3')).toHaveCount(0);
  await expect(banner).toHaveText('轮到红方');
});

test('a dragged move is played (xq-005)', async ({ page }) => {
  await startLocalGame(page);
  const from = (await point(page, 'b1').boundingBox())!;
  const to = (await point(page, 'c3').boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect(pieceOn(page, 'c3')).toHaveAttribute('data-piece', 'wn');
  await expect(page.getByTestId('turn-banner')).toHaveText('轮到黑方');
});

test('a hobbled horse is not offered the blocked leap (xq-005)', async ({ page }) => {
  // Start position: the horse on b1 may go to a3 or c3, but not d2: that leap needs its leg c1 empty, and
  // the elephant stands there.
  await startLocalGame(page);
  await point(page, 'b1').click();
  expect(await targets(page)).toEqual(['a3', 'c3']);
});

test('an elephant never crosses the river', async ({ page }) => {
  await seedSavedGame(page, '3k5/9/9/9/9/2B6/9/9/9/R3K4 w - - 0 1');
  await page.goto('/play/local');
  await point(page, 'c5').click();
  expect(await targets(page)).toEqual(['a3', 'e3']);
});

test('a move that leaves the generals facing is not offered (xq-005)', async ({ page }) => {
  // The horse on e5 is the only piece between the generals, and every horse move leaves the file.
  await seedSavedGame(page, '4k4/9/9/9/9/4N4/9/9/9/4K4 w - - 0 1');
  await page.goto('/play/local');
  await point(page, 'e5').click();
  expect(await targets(page)).toEqual([]);
  // The general itself still moves.
  await point(page, 'e1').click();
  expect(await targets(page)).toEqual(['d1', 'e2', 'f1']);
});

test('the board flips for Black (xq-005)', async ({ page }) => {
  await startLocalGame(page);
  await expect(page.getByRole('grid')).toHaveAttribute('data-orientation', 'w');
  await page.getByRole('button', { name: '翻转棋盘' }).click();
  await expect(page.getByRole('grid')).toHaveAttribute('data-orientation', 'b');
  await expect(page.locator('[data-square]').first()).toHaveAttribute('data-square', 'i1');
});

test('a stalemate ends the game as a win, not a draw (xq-005)', async ({ page }) => {
  await seedSavedGame(page, '3k5/9/8R/9/9/9/9/9/9/4K4 w - - 0 1');
  await page.goto('/play/local');
  await play(page, [['i8', 'i9']]);
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading')).toHaveText('红方胜');
  await expect(page.getByTestId('result-reason')).toHaveText('困毙：无子可走判负');
});

test('a refresh restores the local game (xq-005)', async ({ page }) => {
  await startLocalGame(page);
  await play(page, [
    ['h3', 'e3'],
    ['h10', 'g8'],
  ]);
  await page.reload();
  await expect(pieceOn(page, 'e3')).toHaveAttribute('data-piece', 'wc');
  await expect(pieceOn(page, 'g8')).toHaveAttribute('data-piece', 'bn');
  await expect(page.getByTestId('turn-banner')).toHaveText('轮到红方');
});

test('the piece set can be switched for players who do not read Chinese (xq-012)', async ({ page }) => {
  await page.goto('/settings');
  await page.locator('[data-piece-set-option="letters"]').click();
  await startLocalGame(page);
  await expect(pieceOn(page, 'e1').locator('svg')).toHaveAttribute('data-piece-set', 'letters');
  await expect(pieceOn(page, 'e1')).toContainText('K');
  await expect(pieceOn(page, 'a1')).toContainText('R');
  await expect(pieceOn(page, 'b3')).toContainText('C');

  await page.goto('/settings');
  await page.locator('[data-piece-set-option="symbols"]').click();
  await page.goto('/play/local');
  await expect(pieceOn(page, 'e1').locator('svg')).toHaveAttribute('data-piece-set', 'symbols');
  await expect(pieceOn(page, 'e1')).not.toContainText('K');
});
