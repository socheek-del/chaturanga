import { expect, test, type Page } from '@playwright/test';
import { Game } from '@chaturanga/shatra';

const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const square = (page: Page, coordinate: string) => page.locator(`[data-square="${coordinate}"]`);
const play = async (page: Page, from: string, to: string) => {
  await square(page, from).click();
  await square(page, to).click();
};
const plies = (page: Page) => page.locator('[data-ply]');
const moveSquares = (uci: string) => uci.match(/[a-g]\d{1,2}/g) ?? [];

test('the field guide teaches the tournament opening, capture routes, reserves and promotion on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await page.getByRole('link', { name: 'Explore the field guide' }).click();
  const next = () => button(page, 'Continue').click();
  const feedback = page.getByTestId('feedback');
  await next();

  for (const [from, to] of [['a6', 'a7'], ['d4', 'e5']] as const) {
    await play(page, from, to);
    await expect(feedback).toHaveAttribute('data-result', 'correct');
    await next();
  }
  await next();
  await play(page, 'c3', 'a7');
  await expect(feedback).toHaveAttribute('data-result', 'correct');
  await next();
  await play(page, 'd6', 'f8');
  await expect(feedback).toHaveAttribute('data-result', 'correct');
  await next();
  await play(page, 'd9', 'd11');
  await expect(page.getByTestId('choose-route')).toHaveCount(2);
  await page.getByTestId('choose-route').filter({ hasText: 'd9 → b9 → d11' }).click();
  await expect(feedback).toHaveAttribute('data-result', 'correct');
  await next();
  await next();
  await next();
  await play(page, 'd13', 'd14');
  await expect(feedback).toHaveAttribute('data-result', 'correct');
  await next();
  await play(page, 'c6', 'c10');
  await expect(feedback).toHaveAttribute('data-result', 'correct');
  await next();
  await next();

  for (const answer of [0, 0]) {
    await page.locator(`[data-choice="${answer}"]`).click();
    await button(page, 'Check').click();
    await expect(feedback).toHaveAttribute('data-result', 'correct');
    await next();
  }
  await expect(page.getByTestId('lesson-complete')).toBeVisible();
  await next();
  await expect(page.getByText('Field guide complete', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
});

test('pass and play saves both turns across reload', async ({ page }) => {
  await page.goto('/local');
  await button(page, 'Start').click();
  await play(page, 'a6', 'a7');
  await play(page, 'a9', 'a8');
  await expect(plies(page)).toHaveCount(2);
  await page.reload();
  await expect(plies(page)).toHaveCount(2);
});

for (const side of ['w', 'b'] as const) {
  test(`the bot plays as ${side === 'w' ? 'Black' : 'White'}`, async ({ page }) => {
    await page.goto(`/computer/${side}`);
    await button(page, 'Start').click();
    if (side === 'w') {
      await play(page, 'a6', 'a7');
      await expect(plies(page)).toHaveCount(2, { timeout: 15_000 });
    } else {
      await expect(plies(page)).toHaveCount(1, { timeout: 15_000 });
      await expect(page.getByRole('grid')).toHaveAttribute('data-orientation', 'b');
      const lastSquares = await page.locator('[data-last-move]').evaluateAll((cells) => cells.map((cell) => cell.getAttribute('data-square')!));
      expect(lastSquares).toHaveLength(2);
      const game = new Game();
      const opening = game.legalUci().find((uci) => {
        const route = moveSquares(uci);
        return route.length === 2 && route[0] === lastSquares[0] && route[1] === lastSquares[1];
      });
      expect(opening).toBeDefined();
      game.move(opening!);
      const reply = game.legalUci().find((uci) => moveSquares(uci).length === 2 && !uci.endsWith('b'));
      expect(reply).toBeDefined();
      const [from, to] = moveSquares(reply!);
      await play(page, from!, to!);
      await expect(plies(page)).toHaveCount(3);
    }
    await button(page, 'Resign').click();
    await page.getByTestId('confirm-resign').click();
    await expect(page.getByRole('dialog')).toContainText(side === 'w' ? 'Black wins' : 'White wins');
  });
}

test('invite rooms sync moves and restore the guest seat after reconnect', async ({ browser }) => {
  const host = await browser.newPage();
  const guest = await browser.newPage();
  await host.goto('/online');
  await host.getByRole('radio', { name: 'White' }).click();
  await button(host, 'Create room').click();
  await expect(host.getByTestId('room-qr')).toBeVisible();
  await guest.goto(host.url());
  await expect(host.getByRole('grid')).toHaveAttribute('data-orientation', 'w');
  await expect(guest.getByRole('grid')).toHaveAttribute('data-orientation', 'b');
  await play(host, 'a6', 'a7');
  await expect(plies(guest)).toHaveCount(1);
  await guest.reload();
  await expect(guest.getByRole('grid')).toHaveAttribute('data-orientation', 'b');
  await play(guest, 'a9', 'a8');
  await expect(plies(host)).toHaveCount(2);
  await button(guest, 'Resign').click();
  await guest.getByTestId('confirm-resign').click();
  await expect(host.getByRole('dialog')).toContainText('White wins');
});

test('the site installs its manifest and opens from cache offline', async ({ page, context }, testInfo) => {
  test.skip(!process.env.SHATRA_E2E_URL, 'Requires the staged PWA origin.');
  await page.goto('/');
  await page.screenshot({ path: testInfo.outputPath('shatra-home.png'), fullPage: true, animations: 'disabled' });
  const manifest = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(manifest).toBeTruthy();
  const response = await page.request.get(manifest!);
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.name).toBe('Altai Shatra');
  expect(body.icons.map((icon: { sizes: string }) => icon.sizes)).toEqual(expect.arrayContaining(['192x192', '512x512']));
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Altai Shatra' })).toBeVisible();
  await context.setOffline(false);
});
