import { expect, type Page, test } from '@playwright/test';

const moves = (page: Page) => page.getByTestId('move-list').locator('[data-ply]');
const square = (page: Page, name: string) => page.getByRole('gridcell', { name: new RegExp('^' + name + ',') });

async function play(page: Page, from: string, to: string) {
  await square(page, from).click();
  await square(page, to).click();
}

async function lobby(page: Page) {
  await page.goto('/online');
  await expect(page.getByRole('button', { name: 'Create room' })).toBeEnabled();
}

test('invites a second player and synchronizes server-validated Suffragetto routes', async ({ browser }) => {
  const hostContext = await browser.newContext();
  const host = await hostContext.newPage();
  await lobby(host);
  await host.getByRole('radiogroup', { name: 'Choose your colour' }).getByRole('radio', { name: 'Suffragettes' }).click();
  await host.getByRole('button', { name: 'Create room' }).click();
  const code = (await host.getByTestId('room-code').textContent())!.trim();
  expect(code).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);

  const friendContext = await browser.newContext();
  const friend = await friendContext.newPage();
  await lobby(friend);
  await friend.getByLabel('Room code').fill(code.toLowerCase());
  await friend.getByRole('button', { name: 'Join', exact: true }).click();
  await expect(host.getByRole('grid')).toHaveAttribute('data-orientation', 'w');
  await expect(friend.getByRole('grid')).toHaveAttribute('data-orientation', 'b');
  await expect(host.getByTestId('connection-status')).toHaveCount(0);
  await expect(friend.getByTestId('connection-status')).toHaveCount(0);

  await play(host, 'i6', 'i7');
  await expect(moves(friend)).toHaveCount(1);
  await play(friend, 'i12', 'i11');
  await expect(moves(host)).toHaveCount(2);
  await expect(host.getByRole('textbox')).toHaveCount(0);

  await host.reload();
  await expect(moves(host)).toHaveCount(2);
  await expect(host.getByTestId('turn-banner')).toContainText('Suffragettes to move');
  await hostContext.close();
  await friendContext.close();
});

test('unknown invite code gives a localized not-found message', async ({ page }) => {
  await lobby(page);
  await page.getByLabel('Room code').fill('ZZZZZZ');
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Room not found');
});
