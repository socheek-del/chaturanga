import { type Browser, expect, type Page, test } from '@playwright/test';

const plies = (page: Page) => page.getByTestId('move-list').locator('[data-ply]');
const square = (page: Page, name: string) => page.locator(`[data-square="${name}"]`);

async function play(page: Page, moves: ReadonlyArray<readonly [string, string]>): Promise<void> {
  for (const [from, to] of moves) {
    await square(page, from).click();
    await square(page, to).click();
    await expect(square(page, to).locator('[data-piece]')).toBeVisible();
  }
}

async function newPlayer(browser: Browser): Promise<Page> {
  const page = await (await browser.newContext()).newPage();
  await page.goto('/play/online');
  await expect(page.getByRole('button', { name: 'Create room' })).toBeEnabled();
  return page;
}

/**
 * ch-008: one online room played end to end against the deployed Worker, its Durable Object and its D1 —
 * the guest token, the room code, the seats and the live board, all in production.
 */
test('two browsers share a room on the live Worker (ch-008)', async ({ browser }) => {
  const host = await newPlayer(browser);
  await host.locator('[data-time-control="5+0"]').click();
  await host.getByRole('radio', { name: 'White', exact: true }).click();
  await host.getByRole('button', { name: 'Create room' }).click();
  const code = (await host.getByTestId('room-code').textContent())!.trim();
  expect(code).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);

  const friend = await newPlayer(browser);
  await friend.getByLabel('Room code').fill(code.toLowerCase());
  await friend.getByRole('button', { name: 'Join', exact: true }).click();

  await expect(host.getByRole('grid')).toHaveAttribute('data-orientation', 'w');
  await expect(friend.getByRole('grid')).toHaveAttribute('data-orientation', 'b');

  await play(host, [['e2', 'e4']]);
  await expect(plies(friend)).toHaveCount(1);
  await play(friend, [['e7', 'e5']]);
  await expect(plies(host)).toHaveCount(2);
  expect(await plies(friend).allTextContents()).toEqual(await plies(host).allTextContents());

  // No chat of any kind (docs/PLATFORM.md).
  for (const page of [host, friend]) await expect(page.getByRole('textbox')).toHaveCount(0);
});
