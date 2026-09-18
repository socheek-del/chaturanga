import { type Browser, expect, type Page, test } from '@playwright/test';

const plies = (page: Page) => page.getByTestId('move-list').locator('[data-ply]');
const point = (page: Page, name: string) => page.locator(`[data-square="${name}"]`);

async function play(page: Page, moves: ReadonlyArray<readonly [string, string]>): Promise<void> {
  for (const [from, to] of moves) {
    await point(page, from).click();
    await point(page, to).click();
    await expect(point(page, to).locator('[data-piece]')).toBeVisible();
  }
}

async function newPlayer(browser: Browser): Promise<Page> {
  const page = await (await browser.newContext()).newPage();
  await page.goto('/play/online');
  await expect(page.getByRole('button', { name: '创建房间' })).toBeEnabled();
  return page;
}

/**
 * xq-008: one online room played end to end against the deployed Worker, its Durable Object and its D1 —
 * the guest token, the room code, the seats and the live board, all in production.
 */
test('two browsers share a room on the live Worker (xq-008)', async ({ browser }) => {
  const host = await newPlayer(browser);
  await host.locator('[data-time-control="5+0"]').click();
  await host.getByRole('radio', { name: '红方', exact: true }).click();
  await host.getByRole('button', { name: '创建房间' }).click();
  const code = (await host.getByTestId('room-code').textContent())!.trim();
  expect(code).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);

  const friend = await newPlayer(browser);
  await friend.getByLabel('房间号').fill(code.toLowerCase());
  await friend.getByRole('button', { name: '加入', exact: true }).click();

  await expect(host.getByRole('grid')).toHaveAttribute('data-orientation', 'w');
  await expect(friend.getByRole('grid')).toHaveAttribute('data-orientation', 'b');

  await play(host, [['h3', 'e3']]);
  await expect(plies(friend)).toHaveCount(1);
  await play(friend, [['h10', 'g8']]);
  await expect(plies(host)).toHaveCount(2);
  expect(await plies(friend).allTextContents()).toEqual(await plies(host).allTextContents());

  // No chat of any kind (docs/PLATFORM.md).
  for (const page of [host, friend]) await expect(page.getByRole('textbox')).toHaveCount(0);
});
