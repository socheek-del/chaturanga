import { expect, test, type Page } from '@playwright/test';

const seat = (page: Page, color: string) => page.locator(`[data-online-seat="${color}"]`);
const turns = (page: Page) => page.locator('.turn-pill');
const moves = (page: Page) => page.getByRole('list', { name: 'Moves' }).getByRole('listitem');
const play = async (page: Page, from: string, to: string) => {
  await page.getByTestId(`cell-${from}`).click();
  await page.getByTestId(`cell-${to}`).click();
};

test('shares a three-seat room, synchronizes turns and reconnects to the same seat', async ({ browser, page: white }) => {
  const blackContext = await browser.newContext();
  let black = await blackContext.newPage();
  const red = await browser.newPage();
  await white.goto('/');
  await white.getByRole('button', { name: 'Play online' }).click();
  await white.getByRole('button', { name: 'Create room' }).click();
  await expect(seat(white, 'w')).toContainText('White · You');
  await expect(turns(white)).toContainText('Waiting for all three players');
  const invite = await white.getByLabel('Invite link').inputValue();
  const code = new URL(invite).searchParams.get('room')!;

  await black.goto(invite);
  await expect(seat(black, 'b')).toContainText('Black · You');
  await red.goto('/');
  await red.getByRole('button', { name: 'Play online' }).click();
  await red.getByLabel('Room code').fill(code.toLowerCase());
  await red.getByRole('button', { name: 'Join room' }).click();
  await expect(seat(red, 'r')).toContainText('Red · You');
  await expect(turns(red)).toContainText('White to move');
  await expect(red.getByTestId('cell-d4')).toBeDisabled();

  await play(white, 'd10', 'd9');
  await expect(turns(black)).toContainText('Black to move');
  await expect(moves(red)).toHaveText(['d10d9']);
  await black.close();
  await expect(seat(white, 'b')).toContainText('Disconnected');
  black = await blackContext.newPage();
  await black.goto(invite);
  await expect(seat(black, 'b')).toContainText('Black · You');
  await expect(moves(black)).toHaveText(['d10d9']);
  await play(black, 'j4', 'i5');
  await expect(turns(red)).toContainText('Red to move');
  await play(red, 'd4', 'e4');
  await expect(moves(white)).toHaveText(['d10d9', 'j4i5', 'd4e4']);
  await expect(turns(white)).toContainText('White to move');

  const fourth = await browser.newPage();
  await fourth.goto(invite);
  await expect(fourth.getByText('This room already has three players.')).toBeVisible();
  await blackContext.close();
  await red.close();
  await fourth.close();
});

test('reports a room that does not exist', async ({ page }) => {
  await page.goto('/?room=ABCDEF');
  await expect(page.getByText('Room not found.', { exact: true })).toBeVisible();
});
