import { expect, test } from '@playwright/test';
import { startLocalGame } from './helpers';

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

test('the full board is visible on a phone without scrolling (ch-005)', async ({ page }) => {
  await startLocalGame(page);
  const board = page.getByRole('grid');
  const box = (await board.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(390 + 1);
  expect(box.y + box.height).toBeLessThanOrEqual(844 + 1);
  // Square, in the board's own proportion.
  expect(box.height / box.width).toBeCloseTo(1, 1);
  await expect(page.locator('nav')).toBeHidden();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth))
    .toBeLessThanOrEqual(0);
  await page.screenshot({ path: 'e2e-evidence/play-390.png' });
});

test.describe('with the browser toolbars shown', () => {
  // A phone's visible height once Safari shows its toolbars: the board is then sized by height, not width.
  test.use({ viewport: { width: 390, height: 664 } });

  test('the board keeps its size while the computer thinks on a phone', async ({ page }) => {
    await page.goto('/play/computer');
    await page.locator('[data-bot-level="1"]').click();
    await page.getByRole('radio', { name: 'White' }).click();
    await page.getByRole('button', { name: 'Start' }).click();
    await expect(page.getByTestId('turn-banner')).toHaveText('White to move');
    // Record every width the board takes, frame by frame, across the computer's turn.
    await page.evaluate(() => {
      const widths = new Set<number>();
      (window as unknown as { __widths: Set<number> }).__widths = widths;
      const record = () => {
        widths.add(Math.round(document.querySelector('[role=grid]')!.getBoundingClientRect().width));
        requestAnimationFrame(record);
      };
      record();
    });
    await page.locator('[data-square="e2"]').click();
    await page.locator('[data-square="e4"]').click();
    await expect(page.getByTestId('turn-banner')).toHaveText('Black to move');
    await expect(page.getByTestId('turn-banner')).toHaveText('White to move', { timeout: 30_000 });
    expect(
      await page.evaluate(() => [...(window as unknown as { __widths: Set<number> }).__widths]),
    ).toHaveLength(1);
  });
});
