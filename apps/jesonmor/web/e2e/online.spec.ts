import { expect, type Page, test } from '@playwright/test';

const moveList = (page: Page) => page.getByTestId('move-list').locator('[data-ply]');
const square = (page: Page, name: string) => page.getByRole('gridcell', { name: new RegExp('^' + name + ',') });

async function play(page: Page, from: string, to: string) {
  await square(page, from).click();
  await square(page, to).click();
}

async function newPlayer(page: Page) {
  await page.goto('/online');
  await expect(page.getByRole('button', { name: 'Create room' })).toBeEnabled();
}

test('invites a second player, synchronizes Jeson Mor moves, and reconnects', async ({ browser }) => {
  const hostContext = await browser.newContext();
  const host = await hostContext.newPage();
  await newPlayer(host);
  await host.getByRole('radiogroup', { name: 'Choose your colour' }).getByRole('radio', { name: 'White' }).click();
  await host.getByRole('button', { name: 'Create room' }).click();
  const code = (await host.getByTestId('room-code').textContent())!.trim();
  expect(code).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
  await expect(host.getByTestId('room-link')).toContainText('/online/' + code);

  const friendContext = await browser.newContext();
  const friend = await friendContext.newPage();
  await newPlayer(friend);
  await friend.getByLabel('Room code').fill(code.toLowerCase());
  await friend.getByRole('button', { name: 'Join', exact: true }).click();
  await expect(host.getByRole('grid')).toHaveAttribute('data-orientation', 'w');
  await expect(friend.getByRole('grid')).toHaveAttribute('data-orientation', 'b');
  await expect(host.getByTestId('connection-status')).toHaveCount(0);
  await expect(friend.getByTestId('connection-status')).toHaveCount(0);

  await play(host, 'a1', 'b3');
  await expect(moveList(friend)).toHaveCount(1);
  await play(friend, 'a9', 'b7');
  await expect(moveList(host)).toHaveCount(2);
  await expect(host.getByRole('textbox')).toHaveCount(0);

  await host.reload();
  await expect(moveList(host)).toHaveCount(2);
  await expect(host.getByTestId('turn-banner')).toContainText('White to move');
  await hostContext.close();
  await friendContext.close();
});

test('unknown invite code gives a localized not-found message', async ({ page }) => {
  await newPlayer(page);
  await page.getByLabel('Room code').fill('ZZZZZZ');
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Room not found');
});
