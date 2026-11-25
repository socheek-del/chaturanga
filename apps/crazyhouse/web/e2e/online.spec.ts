import { expect, type Page, test } from '@playwright/test';

const moveList = (page: Page) => page.getByTestId('move-list').locator('[data-ply]');
const square = (page: Page, name: string) => page.getByRole('gridcell', { name: new RegExp(`^${name},`) });

async function play(page: Page, from: string, to: string) {
  await square(page, from).click();
  await square(page, to).click();
}

async function newPlayer(page: Page) {
  await page.goto('/online');
  await expect(page.getByRole('button', { name: 'Create room' })).toBeEnabled();
}

test('invites a second player, validates a capture and pocket drop, then reconnects', async ({ browser }) => {
  const hostContext = await browser.newContext();
  const host = await hostContext.newPage();
  await newPlayer(host);
  await host.getByRole('radio', { name: 'White', exact: true }).click();
  await host.getByRole('button', { name: 'Create room' }).click();
  const code = (await host.getByTestId('room-code').textContent())!.trim();
  expect(code).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
  await expect(host.getByTestId('room-link')).toContainText(`/online/${code}`);

  const friendContext = await browser.newContext();
  const friend = await friendContext.newPage();
  await newPlayer(friend);
  await friend.getByLabel('Room code').fill(code.toLowerCase());
  await friend.getByRole('button', { name: 'Join', exact: true }).click();
  await expect(host.getByRole('grid')).toHaveAttribute('data-orientation', 'w');
  await expect(friend.getByRole('grid')).toHaveAttribute('data-orientation', 'b');

  await play(host, 'e2', 'e4');
  await expect(moveList(friend)).toHaveCount(1);
  await play(friend, 'd7', 'd5');
  await expect(moveList(host)).toHaveCount(2);
  await play(host, 'e4', 'd5');
  await expect(moveList(friend)).toHaveCount(3);
  await play(friend, 'c7', 'c6');
  await expect(moveList(host)).toHaveCount(4);
  const pawnInPocket = host.getByRole('button', { name: 'pawn in pocket, 1' });
  await expect(pawnInPocket).toBeEnabled();
  await pawnInPocket.click();
  await square(host, 'e4').click();
  await expect(moveList(friend)).toHaveCount(5);
  await expect(moveList(friend).last()).toHaveText('P@e4');

  for (const page of [host, friend]) await expect(page.getByRole('textbox')).toHaveCount(0);
  await host.reload();
  await expect(moveList(host)).toHaveCount(5);
  await expect(moveList(host).last()).toHaveText('P@e4');

  await hostContext.close();
  await friendContext.close();
});

test('unknown invite code gives a localized not-found message', async ({ page }) => {
  await newPlayer(page);
  await page.getByLabel('Room code').fill('ZZZZZZ');
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Room not found');
});
