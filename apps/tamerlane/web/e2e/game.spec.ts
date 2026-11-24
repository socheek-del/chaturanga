import { Game } from '@chaturanga/tamerlane';
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

  await expect(page.getByRole('gridcell')).toHaveCount(112);
  await expect(page.locator('[data-board-hole=a10]')).toHaveAttribute('aria-hidden', 'true');
  await play(page, 'b3', 'b4');
  await expect(feedback).toHaveAttribute('data-result', 'wrong');
  await button(page, 'Try again').click();

  for (const [from, to] of [['c3', 'c4'], ['d4', 'f6'], ['d4', 'h5']] as const) {
    await play(page, from, to);
    await expect(feedback).toHaveAttribute('data-result', 'correct');
    await next();
  }
  await next();
  for (const [from, to] of [['g2', 'b1'], ['e9', 'e10'], ['b10', 'f7'], ['f9', 'f10'], ['g9', 'g10'], ['b9', 'a9'], ['f3', 'a9']] as const) {
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
  await expect(page.getByTestId('lesson-complete')).toBeVisible();
  await next();
  await expect(page.getByText('Tutorial complete', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
});

test('local play alternates and retains moves across reload', async ({ page }) => {
  await page.goto('/local');
  await button(page, 'Start').click();
  await play(page, 'd3', 'd4');
  await play(page, 'd8', 'd7');
  await expect(plies(page)).toHaveCount(2);
  await page.reload();
  await expect(plies(page)).toHaveCount(2);
});

for (const side of ['w', 'b'] as const) {
  test(`the bot plays as ${side === 'w' ? 'Black' : 'White'}`, async ({ page }) => {
    await page.goto(`/computer/${side}`);
    await button(page, 'Start').click();
    if (side === 'w') await play(page, 'd3', 'd4');
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
      const [from, to] = reply.match(/[a-m]\d+/g)!;
      await play(page, from!, to!);
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
  await play(host, 'd3', 'd4');
  await expect(plies(guest)).toHaveCount(1);
  await guest.reload();
  await expect(guest.getByRole('grid')).toHaveAttribute('data-orientation', 'b');
  await play(guest, 'd8', 'd7');
  await expect(plies(host)).toHaveCount(2);
  await button(guest, 'Resign').click();
  await guest.getByTestId('confirm-resign').click();
  await expect(host.getByRole('dialog')).toContainText('White wins');
  await expect(guest.getByRole('dialog')).toContainText('White wins');
});

test('reaching the opposing citadel records a draw that survives reload', async ({ page }) => {
  await page.addInitScript(() => {
    if (localStorage.getItem('tamerlane.local')) return;
    localStorage.setItem('tamerlane.local', JSON.stringify({
      version: 1,
      state: { phase: 'playing', startFen: '11k1/1K11/13/13/13/13/13/13/13/13 w - - 0 1', moves: [] },
    }));
  });
  await page.goto('/local');
  await play(page, 'b9', 'a9');
  await expect(page.getByRole('dialog')).toContainText('Draw by entering the opposing citadel');
  await page.reload();
  await expect(page.getByRole('dialog')).toContainText('Draw by entering the opposing citadel');
});

test('the installed site can load and start a local game offline', async ({ page, context }) => {
  test.skip(!process.env.TAMERLANE_E2E_URL, 'Requires a built PWA served over HTTPS or loopback.');
  await page.goto('/');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await page.getByRole('link', { name: 'Play on one device' }).click();
  await button(page, 'Start').click();
  await play(page, 'd3', 'd4');
  await expect(plies(page)).toHaveCount(1);
});
