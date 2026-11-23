import { expect, test } from '@playwright/test';
import { pieceOn, play, point, seedSavedGame, startLocalGame, targets } from './helpers';

test('pieces stand on the points of a 9x10 board, Cho at the bottom (jg-005)', async ({ page }) => {
  await startLocalGame(page);
  const board = page.getByRole('grid');
  await expect(board).toHaveAttribute('data-grid', 'points');
  await expect(page.locator('[data-square]')).toHaveCount(90);
  await expect(page.locator('[data-square] [data-piece]')).toHaveCount(32);
  await expect(pieceOn(page, 'e2')).toHaveAttribute('data-piece', 'wk');
  await expect(pieceOn(page, 'e9')).toHaveAttribute('data-piece', 'bk');
  await expect(page.locator('[data-underlay] svg')).toHaveCount(1);
});

test('a tapped move is played and the turn passes to Han; undo takes it back (jg-005)', async ({ page }) => {
  await startLocalGame(page);
  const banner = page.getByTestId('turn-banner');
  await expect(banner).toHaveText('초 차례');
  await play(page, [['a4', 'b4']]);
  await expect(banner).toHaveText('한 차례');
  await expect(page.getByTestId('move-list')).toContainText('Pab4');

  await page.getByRole('button', { name: '무르기' }).click();
  await expect(pieceOn(page, 'a4')).toHaveAttribute('data-piece', 'wp');
  await expect(pieceOn(page, 'b4')).toHaveCount(0);
  await expect(banner).toHaveText('초 차례');
});

test('a dragged move is played (jg-005)', async ({ page }) => {
  await startLocalGame(page);
  const from = (await point(page, 'b1').boundingBox())!;
  const to = (await point(page, 'c3').boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect(pieceOn(page, 'c3')).toHaveAttribute('data-piece', 'wn');
  await expect(page.getByTestId('turn-banner')).toHaveText('한 차례');
});

test('a hobbled horse is not offered the blocked leap (jg-005)', async ({ page }) => {
  // Start position: the horse on b1 may go to a3 or c3, but not d2: that leap needs its leg c1 empty, and
  // the elephant stands there.
  await startLocalGame(page);
  await point(page, 'b1').click();
  expect(await targets(page)).toEqual(['a3', 'c3']);
});

test('a cannon with nothing to jump has no move (jg-005)', async ({ page }) => {
  await seedSavedGame(page, '3k5/9/9/9/9/4C4/9/9/9/R4K3 w - - 0 1');
  await page.goto('/play/local');
  await point(page, 'e5').click();
  expect(await targets(page)).toEqual([]);
});

test('a chariot follows the palace diagonal (jg-005)', async ({ page }) => {
  await seedSavedGame(page, '4k4/9/9/9/9/9/9/5R3/9/3K5 w - - 0 1');
  await page.goto('/play/local');
  await point(page, 'f3').click();
  expect(await targets(page)).toContain('e2');
});

test('both sides choose an opening arrangement (jg-005)', async ({ page }) => {
  await page.goto('/play/local');
  await page.locator('[data-setup="w-right"]').click();
  await page.locator('[data-setup="b-outer"]').click();
  await page.getByRole('button', { name: '시작' }).click();
  for (const [at, piece] of [['b1', 'wn'], ['c1', 'wb'], ['g1', 'wn'], ['h1', 'wb'], ['b10', 'bb'], ['c10', 'bn'], ['g10', 'bn'], ['h10', 'bb']] as const) {
    await expect(pieceOn(page, at)).toHaveAttribute('data-piece', piece);
  }
});

test('passing: one pass hands over the turn, a second asks first and ends the game on points (jg-005)', async ({ page }) => {
  await startLocalGame(page);
  await expect(page.getByTestId('points')).toContainText('초 72점');
  await expect(page.getByTestId('points')).toContainText('한 73.5점');
  await page.getByTestId('pass').click();
  await expect(page.getByTestId('turn-banner')).toHaveText('한 차례');
  await page.getByTestId('pass').click();
  await page.getByRole('button', { name: '취소' }).click();
  await expect(page.getByTestId('turn-banner')).toHaveText('한 차례');
  await page.getByTestId('pass').click();
  await page.getByTestId('confirm-pass').click();
  await expect(page.getByRole('dialog').getByRole('heading', { name: '한 승리' })).toBeVisible();
  await expect(page.getByTestId('result-reason')).toHaveText('양쪽 모두 한수쉼, 점수 판정');
});

test('bikjang is announced, and accepting it settles the game on points (jg-005)', async ({ page }) => {
  await seedSavedGame(page, '4k4/9/9/9/9/9/9/9/3K5/R8 w - - 0 1');
  await page.goto('/play/local');
  await play(page, [['d2', 'e2']]);
  await expect(page.getByTestId('points')).toContainText('빅장!');
  await page.getByTestId('pass').click();
  await page.getByTestId('confirm-pass').click();
  await expect(page.getByTestId('result-reason')).toHaveText('빅장, 점수 판정');
});

test('dropping the general back on its point does not pass (jg-005)', async ({ page }) => {
  await startLocalGame(page);
  const at = (await point(page, 'e2').boundingBox())!;
  await page.mouse.move(at.x + at.width / 2, at.y + at.height / 2);
  await page.mouse.down();
  await page.mouse.move(at.x + at.width / 2, at.y - 30, { steps: 5 });
  await page.mouse.move(at.x + at.width / 2, at.y + at.height / 2, { steps: 5 });
  await page.mouse.up();
  await expect(page.getByTestId('turn-banner')).toHaveText('초 차례');
  await expect(page.locator('[data-ply]')).toHaveCount(0);
});

test('the board flips for Han (jg-005)', async ({ page }) => {
  await startLocalGame(page);
  await expect(page.getByRole('grid')).toHaveAttribute('data-orientation', 'w');
  await page.getByRole('button', { name: '판 뒤집기' }).click();
  await expect(page.getByRole('grid')).toHaveAttribute('data-orientation', 'b');
  await expect(page.locator('[data-square]').first()).toHaveAttribute('data-square', 'i1');
});

test('a refresh restores the local game (jg-005)', async ({ page }) => {
  await startLocalGame(page);
  await play(page, [
    ['a4', 'b4'],
    ['i7', 'h7'],
  ]);
  await page.reload();
  await expect(pieceOn(page, 'b4')).toHaveAttribute('data-piece', 'wp');
  await expect(pieceOn(page, 'h7')).toHaveAttribute('data-piece', 'bp');
  await expect(page.getByTestId('turn-banner')).toHaveText('초 차례');
});

test('the piece set can be switched for players who do not read hanja (jg-004)', async ({ page }) => {
  await page.goto('/settings');
  await page.locator('[data-piece-set-option="letters"]').click();
  await startLocalGame(page);
  await expect(pieceOn(page, 'e2').locator('svg')).toHaveAttribute('data-piece-set', 'letters');
  await expect(pieceOn(page, 'e2')).toContainText('K');
  await expect(pieceOn(page, 'a1')).toContainText('R');
  await expect(pieceOn(page, 'b3')).toContainText('C');

  await page.goto('/settings');
  await page.locator('[data-piece-set-option="symbols"]').click();
  await page.goto('/play/local');
  await expect(pieceOn(page, 'e2').locator('svg')).toHaveAttribute('data-piece-set', 'symbols');
  await expect(pieceOn(page, 'e2')).not.toContainText('K');
});
