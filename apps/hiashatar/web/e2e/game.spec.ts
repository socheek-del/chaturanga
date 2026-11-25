import { Game } from '@chaturanga/hiashatar';
import { expect, test, type Page } from '@playwright/test';

const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const square = (page: Page, coordinate: string) => page.locator(`[data-square="${coordinate}"]`);
const play = async (page: Page, from: string, to: string) => {
  await square(page, from).click();
  await square(page, to).click();
};
const plies = (page: Page) => page.locator('[data-ply]');

test('the full field guide teaches every special rule on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await page.getByRole('link', { name: 'Explore the field guide' }).click();
  const next = () => button(page, 'Continue').click();
  const feedback = page.getByTestId('feedback');
  await next();

  await play(page, 'a2', 'a3');
  await expect(feedback).toHaveAttribute('data-result', 'wrong');
  await button(page, 'Try again').click();
  for (const [from, to] of [['e2', 'e5'], ['e1', 'e4'], ['c3', 'd5']] as const) {
    await play(page, from, to);
    await expect(feedback).toHaveAttribute('data-result', 'correct');
    await next();
    if (from !== 'c3') await next();
  }
  await next();
  await next();
  for (const move of [['d4', 'e3'], ['d5', 'e4']] as const) {
    await play(page, ...move);
    await expect(feedback).toHaveAttribute('data-result', 'correct');
    await next();
  }
  await next();
  for (const [from, to] of [['e9', 'e10'], ['b8', 'b9']] as const) {
    await play(page, from, to);
    await expect(feedback).toHaveAttribute('data-result', 'correct');
    await next();
  }
  for (const choice of [0, 1]) {
    await page.locator(`[data-choice="${choice}"]`).click();
    await button(page, 'Check').click();
    await expect(feedback).toHaveAttribute('data-result', 'correct');
    await next();
  }
  await expect(page.getByTestId('lesson-complete')).toBeVisible();
  await next();
  await expect(page.getByText('Field guide complete', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
});

test('local play saves both long pawn advances across reload', async ({ page }) => {
  await page.goto('/local');
  await button(page, 'Start').click();
  await play(page, 'e2', 'e5');
  await play(page, 'e9', 'e6');
  await expect(plies(page)).toHaveCount(2);
  await page.reload();
  await expect(plies(page)).toHaveCount(2);
});

for (const side of ['w', 'b'] as const) {
  test(`the bot plays as ${side === 'w' ? 'Black' : 'White'}`, async ({ page }) => {
    await page.goto(`/computer/${side}`);
    await button(page, 'Start').click();
    if (side === 'w') {
      await play(page, 'e2', 'e5');
      await expect(plies(page)).toHaveCount(2);
    } else {
      await expect(plies(page)).toHaveCount(1);
      await expect(page.getByRole('grid')).toHaveAttribute('data-orientation', 'b');
      const markers = await page.locator('[data-last-move]').evaluateAll((cells) =>
        cells.map((cell) => ({
          coordinate: cell.getAttribute('data-square'),
          occupied: !cell.getAttribute('aria-label')?.endsWith(', empty'),
        })));
      const game = new Game();
      game.move(`${markers.find((marker) => !marker.occupied)?.coordinate}${markers.find((marker) => marker.occupied)?.coordinate}`);
      const reply = game.legalUci()[0]!;
      await play(page, reply.match(/^[a-j]\d{1,2}/)![0], reply.match(/[a-j]\d{1,2}(?:q)?$/)![0].replace(/q$/, ''));
      await expect(plies(page)).toHaveCount(3);
    }
    await button(page, 'Resign').click();
    await page.getByTestId('confirm-resign').click();
    await expect(page.getByRole('dialog')).toContainText(side === 'w' ? 'Black wins' : 'White wins');
  });
}

test('invite rooms synchronize triple advances, en passant and reconnects', async ({ browser }) => {
  const host = await browser.newPage();
  const guest = await browser.newPage();
  await host.goto('/online');
  await host.getByRole('radio', { name: 'White' }).click();
  await button(host, 'Create room').click();
  await expect(host.getByTestId('room-qr')).toBeVisible();
  await guest.goto(host.url());
  await expect(host.getByRole('grid')).toHaveAttribute('data-orientation', 'w');
  await expect(guest.getByRole('grid')).toHaveAttribute('data-orientation', 'b');
  await play(host, 'e2', 'e5');
  await expect(plies(guest)).toHaveCount(1);
  await guest.reload();
  await expect(guest.getByRole('grid')).toHaveAttribute('data-orientation', 'b');
  await play(guest, 'e9', 'e6');
  await expect(plies(host)).toHaveCount(2);
  await button(guest, 'Resign').click();
  await guest.getByTestId('confirm-resign').click();
  await expect(host.getByRole('dialog')).toContainText('White wins');
});

test('the installed site starts a saved game offline', async ({ page, context }) => {
  test.skip(!process.env.HIASHATAR_E2E_URL, 'Requires a built PWA served over HTTPS or loopback.');
  await page.goto('/');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await page.getByRole('link', { name: 'Pass and play' }).click();
  await button(page, 'Start').click();
  await play(page, 'e2', 'e5');
  await expect(plies(page)).toHaveCount(1);
});
