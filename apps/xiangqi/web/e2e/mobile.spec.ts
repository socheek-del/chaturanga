import { expect, test } from '@playwright/test';
import { startLocalGame } from './helpers';

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

test('the full 9x10 board is visible on a phone without scrolling (xq-005)', async ({ page }) => {
  await startLocalGame(page);
  const board = page.getByRole('grid');
  const box = (await board.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(390 + 1);
  expect(box.y + box.height).toBeLessThanOrEqual(844 + 1);
  // Taller than wide, in the board's own proportion.
  expect(box.height / box.width).toBeCloseTo(10 / 9, 1);
  await expect(page.locator('nav')).toBeHidden();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  await page.screenshot({ path: 'e2e-evidence/play-390.png' });
});
