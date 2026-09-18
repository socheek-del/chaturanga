import { expect, type Page, test } from '@playwright/test';
import { square, startLocalGame } from './helpers';

const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });

test('settings offer 6 board themes and 3 piece sets with previews; the choice applies and persists (theme-002)', async ({ page }) => {
  await page.goto('/settings');
  await expect(page.locator('[data-board-theme]')).toHaveCount(6);
  await expect(page.locator('[data-piece-set]')).toHaveCount(3);
  for (const set of ['classic', 'traditional', 'flat']) {
    await expect(page.locator(`[data-piece-set="${set}"] svg[data-set="${set}"]`)).toHaveCount(7);
  }
  await page.screenshot({ path: 'e2e-evidence/settings-pieces.png', fullPage: true });

  await page.locator('[data-piece-set="flat"]').click();
  await page.locator('[data-board-theme="night"]').click();
  await page.reload();
  await expect(page.locator('[data-piece-set="flat"]')).toHaveAttribute('aria-checked', 'true');

  await startLocalGame(page);
  await expect(page.locator('[data-square] svg[data-set="flat"]')).toHaveCount(32);
  await expect(square(page, 'a4')).toHaveCSS('background-color', 'rgb(31, 45, 79)');
  await page.screenshot({ path: 'e2e-evidence/board-flat-night.png' });
});

test('the classic set draws every piece type in both colours, readable on a 360px board (art-001)', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  // Every type including a promoted Bia (M~) for both colours.
  // In FEN a promoted Bia is a Met marked with ~.
  await startLocalGame(page, { fen: 'rnsmk3/8/m~7/8/8/M~7/8/RNSMK3 w - - 0 1' });
  for (const [sq, type] of [
    ['a1', 'r'], ['b1', 'n'], ['c1', 's'], ['d1', 'm'], ['e1', 'k'], ['a3', 'p~'],
    ['a8', 'r'], ['b8', 'n'], ['c8', 's'], ['d8', 'm'], ['e8', 'k'], ['a6', 'p~'],
  ] as const) {
    await expect(square(page, sq).locator('svg[data-set="classic"]')).toHaveAttribute('data-type', type);
  }
  await startLocalGame(page);
  const types = await page.locator('[data-square] svg').evaluateAll((els) => [...new Set(els.map((el) => el.getAttribute('data-type')))].sort());
  expect(types).toEqual(['k', 'm', 'n', 'p', 'r', 's']);
  await page.screenshot({ path: 'e2e-evidence/classic-360.png' });
});

test('the mascot reacts through the lesson flow (art-002)', async ({ page }) => {
  await page.goto('/learn/met');
  const mascot = page.getByTestId('lesson-player').getByTestId('mascot');
  await expect(mascot).toHaveAttribute('data-pose', 'idle');
  await button(page, 'ต่อไป').click();
  await expect(mascot).toHaveAttribute('data-pose', 'thinking');

  await square(page, 'c3').click();
  await button(page, 'ตรวจคำตอบ').click();
  await expect(mascot).toHaveAttribute('data-pose', 'sad');
  await page.screenshot({ path: 'e2e-evidence/mascot-sad.png' });
  await button(page, 'ลองอีกครั้ง').click();

  for (const sq of ['c3', 'c5', 'e3', 'e5']) await square(page, sq).click();
  await button(page, 'ตรวจคำตอบ').click();
  await expect(mascot).toHaveAttribute('data-pose', 'happy');
  await button(page, 'ต่อไป').click();
  await square(page, 'd4').click();
  await square(page, 'c5').click();
  await button(page, 'ต่อไป').click();
  await page.locator('[data-choice="1"]').click();
  await button(page, 'ตรวจคำตอบ').click();
  await button(page, 'ต่อไป').click();

  await expect(page.getByTestId('lesson-complete').getByTestId('mascot')).toHaveAttribute('data-pose', 'celebrate');
  await page.screenshot({ path: 'e2e-evidence/mascot-celebrate.png' });

  await page.goto('/play/guided');
  await expect(page.getByTestId('coach-tip').getByTestId('mascot')).toBeVisible();
});

test('the traditional wood set draws the real carved pieces and can be chosen (art-003)', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto('/settings');
  await page.locator('[data-piece-set="traditional"]').click();
  await page.reload();
  await expect(page.locator('[data-piece-set="traditional"]')).toHaveAttribute('aria-checked', 'true');

  // Every type including a promoted Bia (the cowrie turned over) for both colours.
  await startLocalGame(page, { fen: 'rnsmk3/8/m~7/8/8/M~7/8/RNSMK3 w - - 0 1' });
  for (const [sq, type] of [
    ['a1', 'r'], ['b1', 'n'], ['c1', 's'], ['d1', 'm'], ['e1', 'k'], ['a3', 'p~'],
    ['a8', 'r'], ['b8', 'n'], ['c8', 's'], ['d8', 'm'], ['e8', 'k'], ['a6', 'p~'],
  ] as const) {
    await expect(square(page, sq).locator('svg[data-set="traditional"]')).toHaveAttribute('data-type', type);
  }
  await page.screenshot({ path: 'e2e-evidence/traditional-360.png' });

  await startLocalGame(page);
  await expect(page.locator('[data-square] svg[data-set="traditional"]')).toHaveCount(32);
  await page.screenshot({ path: 'e2e-evidence/board-traditional.png' });
});
