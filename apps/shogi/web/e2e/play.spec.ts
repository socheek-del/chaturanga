import { expect, test } from '@playwright/test';
import { pieceOn, play, seedSavedGame, square, startLocalGame, targets } from './helpers';

test('pieces stand in the squares of a 9x9 board, Sente at the bottom (sg-005)', async ({ page }) => {
  await startLocalGame(page);
  await expect(page.locator('[data-square]')).toHaveCount(81);
  await expect(page.locator('[data-square] [data-piece]')).toHaveCount(40);
  await expect(pieceOn(page, 'e1')).toHaveAttribute('data-piece', 'wk');
  await expect(pieceOn(page, 'e9')).toHaveAttribute('data-piece', 'bk');
  await expect(page.locator('[data-underlay] svg')).toHaveCount(1);
});

test('a tapped move is played and the turn passes to Gote; undo takes it back (sg-005)', async ({ page }) => {
  await startLocalGame(page);
  const banner = page.getByTestId('turn-banner');
  await expect(banner).toHaveText('先手の番');
  await play(page, [['g3', 'g4']]);
  await expect(banner).toHaveText('後手の番');
  await expect(page.getByTestId('move-list')).toContainText('Pg4');

  await page.getByRole('button', { name: '待った' }).click();
  await expect(pieceOn(page, 'g3')).toHaveAttribute('data-piece', 'wp');
  await expect(pieceOn(page, 'g4')).toHaveCount(0);
  await expect(banner).toHaveText('先手の番');
});

test('a dragged move is played (sg-005)', async ({ page }) => {
  await startLocalGame(page);
  const from = (await square(page, 'c3').boundingBox())!;
  const to = (await square(page, 'c4').boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect(pieceOn(page, 'c4')).toHaveAttribute('data-piece', 'wp');
  await expect(page.getByTestId('turn-banner')).toHaveText('後手の番');
});

test('selecting a piece shows exactly the engine\'s legal squares (sg-005)', async ({ page }) => {
  await startLocalGame(page);
  // The rook on h2 runs along its own rank until its bishop blocks it; its own pawn and knight box it in.
  await square(page, 'h2').click();
  expect(await targets(page)).toEqual(['c2', 'd2', 'e2', 'f2', 'g2', 'i2'].sort());
});

test('the player chooses whether to promote (plat-011, sg-005)', async ({ page }) => {
  // A silver on e6, one step from the enemy camp, with both kings out of the way.
  await seedSavedGame(page, '2k6/9/9/4S4/9/9/9/9/2K6[] w - - 0 1');
  await page.goto('/play/local');

  await square(page, 'e6').click();
  await square(page, 'e7').click();
  await expect(page.getByText('成りますか？')).toBeVisible();
  await page.getByTestId('promote-yes').click();
  await expect(pieceOn(page, 'e7')).toHaveAttribute('data-piece', 'ws~');
  await expect(page.getByTestId('move-list')).toContainText('=G');
});

test('a captured piece goes into the hand and can be dropped back (plat-012, sg-005)', async ({ page }) => {
  // Sente's rook can take the gold on e7; that gold then sits in Sente's hand.
  await seedSavedGame(page, '2k6/9/4g4/9/4R4/9/9/9/2K6[] w - - 0 1');
  await page.goto('/play/local');

  await play(page, [['e5', 'e7', 'keep']]);
  const tray = page.locator('[data-hand="w"] [data-hand-piece="g"]');
  await expect(tray).toBeVisible();

  await page.getByRole('button', { name: '待った' }).click();
  await expect(page.locator('[data-hand="w"] [data-hand-piece="g"]')).toHaveCount(0);
});

test('history navigation walks the game and comes back to the live position (sg-005)', async ({ page }) => {
  await startLocalGame(page);
  await play(page, [
    ['g3', 'g4'],
    ['c7', 'c6'],
  ]);
  await page.getByRole('button', { name: '前の手' }).click();
  await expect(pieceOn(page, 'c6')).toHaveCount(0);
  await page.getByRole('button', { name: '対局に戻る' }).click();
  await expect(pieceOn(page, 'c6')).toHaveAttribute('data-piece', 'bp');
});

test('a saved game survives a reload (sg-005)', async ({ page }) => {
  await startLocalGame(page);
  await play(page, [['g3', 'g4']]);
  await page.reload();
  await expect(pieceOn(page, 'g4')).toHaveAttribute('data-piece', 'wp');
  await expect(page.getByTestId('move-list')).toContainText('Pg4');
});

test('the piece set can be switched, and the opponent tinted (sg-012)', async ({ page }) => {
  await page.goto('/settings');
  await page.locator('[data-piece-set-option="letters"]').click();
  await startLocalGame(page);
  await expect(pieceOn(page, 'e1').locator('svg')).toHaveAttribute('data-piece-set', 'letters');
  await expect(pieceOn(page, 'e1')).toContainText('K');
  await expect(pieceOn(page, 'h2')).toContainText('R');
  await expect(pieceOn(page, 'e9')).toContainText('K');

  await page.goto('/settings');
  await page.locator('[data-piece-set-option="symbols"]').click();
  await page.getByLabel('相手の駒に色をつける', { exact: true }).click();
  await page.goto('/play/local');
  await expect(pieceOn(page, 'e1').locator('svg')).toHaveAttribute('data-piece-set', 'symbols');
  // The far player's tiles are drawn in the tinted wood, the near player's are not.
  const fills = await page
    .locator('[data-square="e1"] svg path, [data-square="e9"] svg path')
    .evaluateAll((els) => els.map((el) => el.getAttribute('fill')).filter(Boolean));
  expect(new Set(fills).size).toBeGreaterThan(1);
});
