import { expect, test, type Page } from '@playwright/test';

const seat = (page: Page, color: string) => page.locator(`.room-seats > .seat-${color}`);
const turn = (page: Page) => page.locator('.turn-banner');
const moves = (page: Page) => page.locator('.online-move-list li');

async function place(page: Page, piece: string, square: string, count: number) {
  await page.locator('.online-reserve .reserve-token').filter({ hasText: piece }).click();
  await page.getByTestId(`square-${square}`).click();
  await expect(moves(page)).toHaveCount(count + 1);
}

async function playLegalMove(page: Page, color: string) {
  const pieces = page.locator(`[role="gridcell"][aria-label*="${color}"]`);
  for (let index = 0; index < (await pieces.count()); index++) {
    await pieces.nth(index).click();
    const destination = page.locator('[role="gridcell"][data-legal="true"]').first();
    if (await destination.count()) {
      await destination.click();
      return;
    }
  }
  throw new Error(`No legal ${color} move was available`);
}

test('synchronizes four seats, validates the setup and reconnects the same players', async ({
  browser,
  page: red,
}) => {
  const otherContexts = await Promise.all([browser.newContext(), browser.newContext(), browser.newContext()]);
  const blue = await otherContexts[0]!.newPage();
  const white = await otherContexts[1]!.newPage();
  const black = await otherContexts[2]!.newPage();
  try {
    await red.goto('/');
    await red.getByRole('button', { name: 'Invite friends' }).click();
    await red.getByRole('button', { name: 'Create a four-seat room' }).click();
    await expect(seat(red, 'r')).toContainText('Red · You');
    const invite = await red.getByLabel('Private invite link').inputValue();
    await blue.goto(invite);
    await expect(seat(blue, 'b')).toContainText('Blue · You');
    await white.goto(invite);
    await expect(seat(white, 'w')).toContainText('White · You');
    await black.goto(invite);
    await expect(seat(black, 'k')).toContainText('Black · You');
    await expect(turn(red)).toContainText('Your turn as Red');
    await expect(red.getByTestId('square-e13')).toBeEnabled();

    await place(red, 'bishop', 'a13', 0);
    await place(red, 'knight', 'b13', 1);
    await place(red, 'rook', 'c13', 2);
    await expect(turn(blue)).toContainText('Your turn as Blue');
    await place(blue, 'bishop', 'm13', 3);
    await place(blue, 'knight', 'n13', 4);
    await place(blue, 'rook', 'o13', 5);
    await place(white, 'bishop', 'm1', 6);
    await place(white, 'knight', 'n1', 7);
    await place(white, 'rook', 'o1', 8);
    await place(black, 'bishop', 'a1', 9);
    await place(black, 'knight', 'b1', 10);
    await place(black, 'rook', 'c1', 11);
    await expect(turn(red)).toContainText('Your turn as Red');

    await red.getByTestId('square-e13').click();
    await red.getByTestId('square-e11').click();
    await expect(moves(white)).toHaveCount(12);
    await expect(moves(white).last()).toContainText('e13e11');
    await expect(turn(blue)).toContainText('Your turn as Blue');
    await blue.close();
    await expect(seat(red, 'b')).toContainText('Disconnected');
    const rejoinedBlue = await otherContexts[0]!.newPage();
    await rejoinedBlue.goto(invite);
    await expect(seat(rejoinedBlue, 'b')).toContainText('Blue · You');
    await expect(moves(rejoinedBlue)).toHaveCount(12);
    await expect(moves(rejoinedBlue).last()).toContainText('e13e11');
    await playLegalMove(rejoinedBlue, 'Blue');
    await expect(moves(black)).toHaveCount(12);
    await expect(moves(black).last()).not.toContainText('e13e11');
    await expect(turn(white)).toContainText('Your turn as White');

    const fifth = await browser.newPage();
    await fifth.goto(invite);
    await expect(fifth.getByText('All four seats are taken.')).toBeVisible();
    await fifth.close();
  } finally {
    await Promise.all(otherContexts.map((context) => context.close()));
  }
});

test('reports a room that does not exist', async ({ page }) => {
  await page.goto('/?room=ABCDEF');
  await expect(page.getByText('Room not found.', { exact: true })).toBeVisible();
});
