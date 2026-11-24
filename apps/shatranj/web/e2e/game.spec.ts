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

  await play(page, 'd2', 'd3');
  await expect(feedback).toHaveAttribute('data-result', 'wrong');
  await button(page, 'Try again').click();

  for (const [from, to] of [['e2', 'e3'], ['c1', 'e3'], ['e1', 'd2']] as const) {
    await play(page, from, to);
    await expect(feedback).toHaveAttribute('data-result', 'correct');
    await next();
  }
  await next();
  for (const [from, to] of [['e7', 'e8'], ['d1', 'd3']] as const) {
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
      await play(page, 'e7', 'e6');
    }
    await expect(plies(page)).toHaveCount(side === 'w' ? 2 : 3);
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
});
