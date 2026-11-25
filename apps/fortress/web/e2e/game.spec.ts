import { expect, test } from '@playwright/test';

const setupMoves: readonly [string, string][] = [
  ['bishop', 'a13'],
  ['knight', 'b13'],
  ['rook', 'c13'],
  ['bishop', 'm13'],
  ['knight', 'n13'],
  ['rook', 'o13'],
  ['bishop', 'm1'],
  ['knight', 'n1'],
  ['rook', 'o1'],
  ['bishop', 'a1'],
  ['knight', 'b1'],
  ['rook', 'c1'],
];

async function place(page: import('@playwright/test').Page, piece: string, square: string) {
  await page.locator('.reserve-token').filter({ hasText: piece }).click();
  await page.getByTestId(`square-${square}`).click();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('completes the full interactive lesson at phone and desktop widths', async ({ page }) => {
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    await page.locator('.hero-tabs button').filter({ hasText: 'Learn the rules' }).click();
    await expect(page.locator('[data-step="welcome"]')).toBeVisible();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();

    await page.locator('.lesson-reserve .reserve-token').filter({ hasText: 'bishop' }).click();
    await page.getByTestId('square-a13').click();
    await expect(page.getByRole('status')).toContainText('That is right');
    await page.getByRole('button', { name: 'Continue' }).click();

    for (const [from, to] of [['e13', 'e11']]) {
      await page.getByTestId(`square-${from}`).click();
      await page.getByTestId(`square-${to}`).click();
      await expect(page.getByRole('status')).toContainText('That is right');
      await page.getByRole('button', { name: 'Continue' }).click();
    }
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    for (const [from, to] of [
      ['f11', 'e12'],
      ['h14', 'f14'],
      ['e4', 'e3'],
    ]) {
      await page.getByTestId(`square-${from}`).click();
      await page.getByTestId(`square-${to}`).click();
      if (from === 'e4') await page.getByRole('button', { name: 'Promote to queen' }).click();
      await expect(page.getByRole('status')).toContainText('That is right');
      await page.getByRole('button', { name: 'Continue' }).click();
    }

    await page.getByTestId('square-a15').click();
    await page.getByTestId('square-a14').click();
    await expect(page.getByRole('status')).toContainText('That is right');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'The game is drawn' }).click();
    await page.getByRole('button', { name: 'Check answer' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('heading', { name: 'You know your way around the walls.' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.getByRole('button', { name: 'Back to the game' }).click();
  }
});

test('saves pass-and-play through the reserve phase and reload', async ({ page }) => {
  await page.getByRole('button', { name: 'Pass and play' }).click();
  await expect(page.getByTestId('square-a13')).toBeVisible();
  for (const [piece, square] of setupMoves) await place(page, piece, square);
  await expect(page.locator('.move-record li')).toHaveCount(12);
  await page.getByTestId('square-e13').click();
  await page.getByTestId('square-e11').click();
  await expect(page.locator('.turn-banner')).toContainText('Blue moves next');
  await page.reload();
  await page.getByRole('button', { name: 'Pass and play' }).click();
  await expect(page.locator('.move-record li')).toHaveCount(13);
  await expect(page.locator('.turn-banner')).toContainText('Blue moves next');
  await page.getByRole('button', { name: 'Take back' }).click();
  await expect(page.locator('.move-record li')).toHaveCount(12);
  await expect(page.locator('.turn-banner')).toContainText('Red moves next');
});

test('keeps the 192-cell board inside a phone viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Pass and play' }).click();
  await expect(page.getByRole('gridcell')).toHaveCount(192);
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    board: document.querySelector('.board-grid')!.getBoundingClientRect().width,
  }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
  expect(dimensions.board).toBeLessThanOrEqual(dimensions.viewport);
});

for (const [seat, color] of [
  ['Red', 'Red'],
  ['Blue', 'Blue'],
  ['White', 'White'],
  ['Black', 'Black'],
] as const) {
  test(`plays a legal move against three bounded bots as ${seat}`, async ({ page }) => {
    await page.getByRole('button', { name: 'Play three bots' }).click();
    await page.getByRole('button', { name: new RegExp(`^${seat}`) }).click();
    await page.getByRole('button', { name: 'Take this seat' }).click();
    await expect(page.locator('.turn-banner')).toContainText(`Your turn as ${color}`, { timeout: 60_000 });
    const placements: Record<string, readonly [string, string][]> = {
      Red: setupMoves.slice(0, 3),
      Blue: setupMoves.slice(3, 6),
      White: setupMoves.slice(6, 9),
      Black: setupMoves.slice(9, 12),
    };
    if ((await page.locator('.reserve-panel .reserve-token:not([disabled])').count()) > 0) {
      for (const [piece, square] of placements[color]!) await place(page, piece, square);
    }
    await expect(page.locator('.reserve-panel')).toHaveCount(0, { timeout: 60_000 });
    await expect(page.locator('.turn-banner')).toContainText(`Your turn as ${color}`, { timeout: 60_000 });
    const startingCount = await page.locator('.move-record li').count();
    const pieces = page.locator(`[role="gridcell"][aria-label*="${color}"]`);
    let moved = false;
    for (let index = 0; index < (await pieces.count()) && !moved; index++) {
      await pieces.nth(index).click();
      const target = page.locator('[role="gridcell"][data-legal="true"]').first();
      if (await target.count()) {
        await target.click();
        moved = true;
      }
    }
    expect(moved).toBe(true);
    await expect(page.locator('.move-record li')).toHaveCount(startingCount + 4, { timeout: 60_000 });
    await expect(page.locator('.turn-banner')).toContainText(`Your turn as ${color}`);
    await page.reload();
    await page.getByRole('button', { name: 'Play three bots' }).click();
    await page.getByRole('button', { name: new RegExp(`^${seat}`) }).click();
    await page.getByRole('button', { name: 'Take this seat' }).click();
    await expect(page.locator('.move-record li')).toHaveCount(startingCount + 4, { timeout: 30_000 });
  });
}
