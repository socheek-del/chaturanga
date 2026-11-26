import { expect, test } from '@playwright/test';
import { Game } from '@chaturanga/chaturaji';
import { TUTORIAL_LESSONS } from '../src/tutorialLessons';

async function makeAvailableMove(page: import('@playwright/test').Page, player: string) {
  const face = (await page.locator('.die-tile.is-current strong').innerText()).toLowerCase();
  const types = face.includes('pawn') ? ['p', 'k'] : face.includes('boat') ? ['b'] : face.includes('horse') ? ['h'] : ['e'];
  for (const type of types) {
    const sources = page.locator(`[data-piece="${player}${type}"]`).locator('xpath=..');
    for (let index = 0; index < await sources.count(); index++) {
      await sources.nth(index).click();
      const target = page.locator('[data-target="true"]').first();
      if (await target.count()) { await target.click(); return; }
    }
  }
  await page.getByRole('button', { name: 'Pass this action' }).click();
}

test('teaches the selected rules, including a legal board move, and supports bot play', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Four courts. One board.' })).toBeVisible();
  await page.getByRole('button', { name: 'Learn the rules' }).click();
  for (const lesson of TUTORIAL_LESSONS) {
    if (lesson.kind === 'quiz') await page.locator('.quiz-option').nth(lesson.answer).click();
    else {
      const move = new Game().legalUci().find((uci) => uci !== 'pass')!;
      await page.locator(`[data-square="${move.slice(0, 2)}"]`).click();
      await page.locator(`[data-square="${move.slice(2, 4)}"]`).click();
      await expect(page.getByText('That’s right. Keep going.')).toBeVisible();
    }
    await page.getByRole('button', { name: 'Continue' }).click();
  }
  await expect(page.getByRole('heading', { name: 'The table is yours' })).toBeVisible();

  await page.getByRole('button', { name: 'Play a game' }).click();
  await page.getByRole('button', { name: 'Play against computers' }).click();
  await page.getByLabel('Computer level').selectOption('1');
  await page.getByRole('button', { name: 'Play as Red' }).click();
  await expect(page.getByRole('grid', { name: 'Chaturaji board' })).toBeVisible();
  await makeAvailableMove(page, 'r');
  await page.getByRole('button', { name: 'Pass this action' }).click();
  await expect.poll(() => page.locator('.move-history li').count(), { timeout: 20_000 }).toBeGreaterThanOrEqual(4);
  await expect(page.getByRole('grid', { name: 'Chaturaji board' })).toBeVisible();
});

test('saves a pass-and-play game and keeps the mobile layout within the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Play together' }).click();
  await page.getByRole('button', { name: 'Pass this action' }).click();
  await page.getByRole('button', { name: 'Pass this action' }).click();
  await expect(page.locator('.move-history li')).toHaveCount(3);
  await page.reload();
  await page.getByRole('button', { name: 'Play together' }).click();
  await expect(page.locator('.move-history li')).toHaveCount(3);
  await expect(page.locator('html')).toHaveJSProperty('scrollWidth', await page.evaluate(() => document.documentElement.clientWidth));
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', /manifest\.webmanifest/);
});
