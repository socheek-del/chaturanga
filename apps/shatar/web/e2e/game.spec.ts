import { Game } from '@chaturanga/shatar';
import { expect, test, type Page } from '@playwright/test';

const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const square = (page: Page, coordinate: string) => page.locator(`[data-square="${coordinate}"]`);
const play = async (page: Page, from: string, to: string) => {
  await square(page, from).click();
  await square(page, to).click();
};
const plies = (page: Page) => page.locator('[data-ply]');

test('a learner can complete every step on a phone, with feedback and retry', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await page.getByRole('link', { name: 'Start tutorial' }).click();
  const next = () => button(page, 'Continue').click();
  const feedback = page.getByTestId('feedback');
  await next();

  await play(page, 'a2', 'a3');
  await expect(feedback).toHaveAttribute('data-result', 'wrong');
  await button(page, 'Try again').click();

  for (const [from, to] of [['e2', 'e3'], ['d1', 'd3'], ['d4', 'e5']] as const) {
    await play(page, from, to);
    await expect(feedback).toHaveAttribute('data-result', 'correct');
    await next();
  }
  await next();
  for (const [from, to] of [['e7', 'e8'], ['d1', 'd8'], ['a5', 'b6']] as const) {
    await play(page, from, to);
    await expect(feedback).toHaveAttribute('data-result', 'correct');
    await next();
  }
  for (const choice of [1, 0]) {
    await page.locator(`[data-choice="${choice}"]`).click();
    await button(page, 'Check').click();
    await expect(feedback).toHaveAttribute('data-result', 'correct');
    await next();
  }
  await next();
  await expect(page.getByTestId('lesson-complete')).toBeVisible();
  await next();
  await expect(page.getByText('Tutorial complete', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
});

test('local play alternates and retains moves across reload', async ({ page }) => {
  await page.goto('/local');
  await button(page, 'Start').click();
  await play(page, 'e2', 'e3');
  await play(page, 'e7', 'e6');
  await expect(plies(page)).toHaveCount(2);
  await page.reload();
  await expect(plies(page)).toHaveCount(2);
});

for (const side of ['w', 'b'] as const) {
  test(`the bot plays as ${side === 'w' ? 'Black' : 'White'}`, async ({ page }) => {
    await page.goto(`/computer/${side}`);
    await button(page, 'Start').click();
    if (side === 'w') await play(page, 'e2', 'e3');
    else {
      await expect(plies(page)).toHaveCount(1);
      await expect(page.getByRole('grid')).toHaveAttribute('data-orientation', 'b');
      const markers = await page.locator('[data-last-move]').evaluateAll((cells) =>
        cells.map((cell) => ({ coordinate: cell.getAttribute('data-square'), occupied: !cell.getAttribute('aria-label')?.endsWith(', empty') })));
      const game = new Game();
      const source = markers.find((marker) => !marker.occupied)?.coordinate;
      const destination = markers.find((marker) => marker.occupied)?.coordinate;
      game.move(`${source}${destination}`);
      const reply = game.legalUci()[0]!;
      await play(page, reply.slice(0, 2), reply.slice(2));
    }
    await expect(plies(page)).toHaveCount(side === 'w' ? 2 : 3);
    await button(page, 'Resign').click();
    await page.getByTestId('confirm-resign').click();
    await expect(page.getByRole('dialog')).toContainText(side === 'w' ? 'Black wins' : 'White wins');
  });
}

test('invite rooms synchronize moves and retain the guest seat after reconnect', async ({ browser }) => {
  const host = await browser.newPage();
  const guest = await browser.newPage();
  await host.goto('/online');
  await host.getByRole('radio', { name: 'White' }).click();
  await button(host, 'Create room').click();
  await expect(host.getByTestId('room-qr')).toBeVisible();
  await guest.goto(host.url());
  await expect(host.getByRole('grid')).toHaveAttribute('data-orientation', 'w');
  await expect(guest.getByRole('grid')).toHaveAttribute('data-orientation', 'b');
  await play(host, 'e2', 'e3');
  await expect(plies(guest)).toHaveCount(1);
  await guest.reload();
  await expect(guest.getByRole('grid')).toHaveAttribute('data-orientation', 'b');
  await play(guest, 'e7', 'e6');
  await expect(plies(host)).toHaveCount(2);
  await button(guest, 'Resign').click();
  await guest.getByTestId('confirm-resign').click();
  await expect(host.getByRole('dialog')).toContainText('White wins');
  await expect(guest.getByRole('dialog')).toContainText('White wins');
});

for (const ending of [
  { name: 'horse mate', fen: 'k7/n1K5/8/3N4/8/8/8/8 w - - 0 1', to: 'b6', outcome: 'Black wins' },
  { name: 'camel mate without shak', fen: 'k7/p1K5/8/3B4/8/8/8/8 w - - 0 1', to: 'b7', outcome: 'Draw' },
]) {
  test(`a ${ending.name} has the correct saved result`, async ({ page }) => {
    await page.addInitScript((startFen) => {
      if (localStorage.getItem('shatar.local')) return;
      localStorage.setItem('shatar.local', JSON.stringify({
        version: 1, state: { phase: 'playing', startFen, moves: [] },
      }));
    }, ending.fen);
    await page.goto('/local');
    await play(page, 'd5', ending.to);
    await expect(page.getByRole('dialog')).toContainText(ending.outcome);
    await expect(page.getByRole('dialog')).toContainText('A sole horse mate loses.');
    await page.reload();
    await expect(page.getByRole('dialog')).toContainText(ending.outcome);
  });
}

test('the installed site can load and start a local game offline', async ({ page, context }) => {
  test.skip(!process.env.SHATAR_E2E_URL, 'Requires a built PWA served over HTTPS or loopback.');
  await page.goto('/');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await page.getByRole('link', { name: 'Play on one device' }).click();
  await button(page, 'Start').click();
  await play(page, 'e2', 'e3');
  await expect(plies(page)).toHaveCount(1);
});
