import { expect, test, type Browser, type Page } from '@playwright/test';

const seat = (page: Page, color: string) => page.locator(`[data-online-seat="${color}"]`);
const turns = (page: Page) => page.locator('.online-turn');
const moves = (page: Page) => page.locator('.move-history li');
const play = async (page: Page, from: string, to: string) => {
  await page.locator(`[data-square="${from}"]`).click();
  await page.locator(`[data-square="${to}"]`).click();
};

async function roomPlayer(browser: Browser, url: string): Promise<Page> {
  const page = await (await browser.newContext()).newPage();
  await page.goto(url);
  return page;
}

test('shares four stable seats, synchronizes server-validated moves, and reconnects', async ({ browser, page: red }) => {
  await red.goto('/');
  await red.getByRole('button', { name: 'Invite friends' }).click();
  await red.getByRole('button', { name: 'Create room' }).click();
  await expect(seat(red, 'r')).toContainText('Red · You');
  await expect(turns(red)).toContainText('Waiting for all four players');
  const invite = await red.evaluate(() => location.href);
  const code = new URL(invite).searchParams.get('room')!;

  let blue = await roomPlayer(browser, invite);
  const blueContext = blue.context();
  await expect(seat(blue, 'b')).toContainText('Blue · You');
  const yellow = await roomPlayer(browser, `/`);
  await yellow.getByRole('button', { name: 'Invite friends' }).click();
  await yellow.getByLabel('Six-character room code').fill(code.toLowerCase());
  await yellow.getByRole('button', { name: 'Join with code' }).click();
  await expect(seat(yellow, 'y')).toContainText('Yellow · You');
  const green = await roomPlayer(browser, invite);
  await expect(seat(green, 'g')).toContainText('Green · You');
  await expect(turns(red)).toContainText('Red to move');
  await expect(red.getByRole('textbox')).toHaveCount(0);

  await play(red, 'd2', 'd4');
  await expect(turns(blue)).toContainText('Blue to move');
  await expect(moves(green)).toHaveText(['d2d4']);
  await blue.close();
  await expect(seat(red, 'b')).toContainText('Disconnected');
  blue = await blueContext.newPage();
  await blue.goto(invite);
  await expect(seat(blue, 'b')).toContainText('Blue · You');
  await expect(moves(blue)).toHaveText(['d2d4']);
  await expect(turns(blue)).toContainText('Blue to move');
  await play(blue, 'b11', 'c11');
  await expect(turns(yellow)).toContainText('Yellow to move');
  await play(yellow, 'k13', 'k12');
  await expect(turns(green)).toContainText('Green to move');
  await play(green, 'm4', 'l4');
  await expect(moves(red)).toHaveText(['d2d4', 'b11c11', 'k13k12', 'm4l4']);
  await expect(turns(red)).toContainText('Red to move');

  const fifth = await roomPlayer(browser, invite);
  await expect(fifth.getByText('This room already has four seats.', { exact: true })).toBeVisible();
  await blueContext.close();
  await yellow.context().close();
  await green.context().close();
  await fifth.context().close();
});

test('reports a room that does not exist', async ({ page }) => {
  await page.goto('/?room=ABCDEF');
  await expect(page.getByText('Room not found.', { exact: true })).toBeVisible();
});
