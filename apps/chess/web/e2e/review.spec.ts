import { expect, test } from '@playwright/test';
import { play, startLocalGame } from './helpers';

// 1. f3 e5 2. g4?? Qh4#
const FOOLS_MATE = [
  ['f2', 'f3'],
  ['e7', 'e5'],
  ['g2', 'g4'],
  ['d8', 'h4'],
] as const;

test('a finished game opens its review from the result dialog, and the analysis finishes (ch-015, ch-016)', async ({ page }) => {
  await startLocalGame(page);
  await play(page, FOOLS_MATE);
  await page.getByTestId('game-review').click();
  await expect(page).toHaveURL(/\/games\/local-/);

  await expect(page.getByTestId('analysis-progress')).toBeVisible();
  const summary = page.getByTestId('review-summary');
  await expect(summary).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId('review-opening')).toContainText('Barnes Opening');
  await expect(page.getByTestId('accuracy-b')).toHaveText(/^\d+\.\d$/);
  await expect(page.getByTestId('label-counts').locator('tr[data-label="blunder"] td').first()).not.toHaveText('0');
  await expect(page.getByTestId('eval-bar')).toBeVisible();
  await page.screenshot({ path: 'e2e-evidence/review-summary.png' });

  // Walk: 2. g4 is the blunder, with the engine's better move drawn as an arrow.
  await page.getByTestId('start-review').click();
  await expect(page.getByTestId('coach-verdict')).toBeVisible();
  await page.getByTestId('review-move-list').locator('[data-ply="3"]').click();
  await expect(page.getByTestId('coach-verdict')).toHaveAttribute('data-label', 'blunder');
  await expect(page.getByTestId('coach-verdict')).toContainText('2. g4 is a blunder');
  await expect(page.getByTestId('coach-best')).toContainText('Best was');
  await expect(page.getByTestId('best-arrow')).toHaveCount(1);
  await expect(page.getByTestId('square-badge')).toHaveAttribute('data-label', 'blunder');
  await page.screenshot({ path: 'e2e-evidence/review-blunder.png' });

  // Next steps on; the last move is the mate, the engine's own choice.
  await page.getByTestId('review-next').click();
  await expect(page.getByTestId('coach-verdict')).toHaveAttribute('data-label', /best|great|brilliant/);
  await expect(page.getByTestId('best-arrow')).toHaveCount(0);

  // A tap on the left of the graph jumps to the start.
  // The coach card changes height with each move, so the graph is measured before each tap.
  const graph = page.getByTestId('eval-graph');
  let box = (await graph.boundingBox())!;
  await page.mouse.click(box.x + 2, box.y + box.height / 2);
  await expect(page.getByTestId('graph-cursor')).toHaveAttribute('data-ply', '0');
  box = (await graph.boundingBox())!;
  await page.mouse.click(box.x + box.width - 2, box.y + box.height / 2);
  await expect(page.getByTestId('graph-cursor')).toHaveAttribute('data-ply', '4');
});

test('a reviewed game opens again without being analysed again (ch-015)', async ({ page }) => {
  await startLocalGame(page);
  await play(page, FOOLS_MATE);
  await page.getByTestId('game-review').click();
  await expect(page.getByTestId('review-summary')).toBeVisible({ timeout: 60_000 });
  const url = page.url();
  await page.reload();
  await expect(page).toHaveURL(url);
  await expect(page.getByTestId('review-summary')).toBeVisible({ timeout: 5_000 });
  // Nothing was left to analyse, so the engine never started.
  const workers = await page.evaluate(() => performance.getEntriesByType('resource').filter((e) => e.name.includes('/engine/')).length);
  expect(workers).toBe(0);
});

test('Games opens the review of an imported game, and an unknown id says so (ch-016)', async ({ page }) => {
  await page.goto('/games');
  await page.getByTestId('import-pgn').click();
  await page.getByTestId('pgn-input').fill('[White "Anderssen"]\n[Black "Kieseritzky"]\n\n1. e4 e5 2. f4 exf4 3. Bc4 Qh4+ 4. Kf1 *');
  await page.getByTestId('pgn-submit').click();
  await expect(page).toHaveURL(/\/games\/imported-/);
  await expect(page.getByTestId('review-summary')).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId('review-opening')).toContainText("King's Gambit");
  await expect(page.getByTestId('review-summary')).toContainText('Anderssen');

  await page.goto('/games/nope');
  await expect(page.getByTestId('review-missing')).toBeVisible();
});
