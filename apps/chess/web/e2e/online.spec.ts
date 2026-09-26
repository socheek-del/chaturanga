import { type Browser, expect, type Page, test } from '@playwright/test';
import { play } from './helpers';

const plies = (page: Page) => page.getByTestId('move-list').locator('[data-ply]');

async function newPlayer(browser: Browser): Promise<Page> {
  const page = await (await browser.newContext()).newPage();
  await page.goto('/play/online');
  await expect(page.getByRole('button', { name: 'Create room' })).toBeEnabled();
  return page;
}

/** Every piece on the board, by square, as the page shows it. */
const boardOf = (page: Page) =>
  page
    .locator('[data-square]')
    .evaluateAll((cells) =>
      Object.fromEntries(
        cells.flatMap((cell) => {
          const piece = cell.querySelector('[data-piece]')?.getAttribute('data-piece');
          return piece ? [[cell.getAttribute('data-square'), piece]] : [];
        }),
      ),
    );

test('create a room, a friend joins by code, and both play 4 moves on the same board (ch-007)', async ({ browser }) => {
  const host = await newPlayer(browser);
  await host.locator('[data-time-control="5+0"]').click();
  await host.getByRole('radio', { name: 'White', exact: true }).click();
  await host.getByRole('button', { name: 'Create room' }).click();
  const code = (await host.getByTestId('room-code').textContent())!.trim();
  expect(code).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
  await expect(host.getByTestId('room-link')).toContainText(`/play/online/${code}`);

  const friend = await newPlayer(browser);
  await friend.getByLabel('Room code').fill(code.toLowerCase());
  await friend.getByRole('button', { name: 'Join', exact: true }).click();

  await expect(host.getByRole('grid')).toHaveAttribute('data-orientation', 'w');
  await expect(friend.getByRole('grid')).toHaveAttribute('data-orientation', 'b');

  await play(host, [['e2', 'e4']]);
  await expect(plies(friend)).toHaveCount(1);
  await play(friend, [['e7', 'e5']]);
  await expect(plies(host)).toHaveCount(2);
  await play(host, [['g1', 'f3']]);
  await expect(plies(friend)).toHaveCount(3);
  await play(friend, [['b8', 'c6']]);
  await expect(plies(host)).toHaveCount(4);

  const hostMoves = await plies(host).allTextContents();
  expect(await plies(friend).allTextContents()).toEqual(hostMoves);
  const hostBoard = await boardOf(host);
  expect(await boardOf(friend)).toEqual(hostBoard);
  expect(hostBoard).toMatchObject({ e4: 'wp', f3: 'wn', e5: 'bp', c6: 'bn' });
  expect(Object.keys(hostBoard)).toHaveLength(32);

  // No chat of any kind.
  for (const page of [host, friend]) await expect(page.getByRole('textbox')).toHaveCount(0);
  await host.screenshot({ path: 'e2e-evidence/online-game.png' });
});

test('an unknown code shows an error (ch-007)', async ({ page }) => {
  await page.goto('/play/online');
  await page.getByLabel('Room code').fill('ZZZZZZ');
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Room not found');
});

test('the seat token belongs to this site only (ch-007)', async ({ page }) => {
  await page.goto('/play/online');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Play online');
  await expect(page.getByRole('button', { name: 'Create room' })).toBeEnabled();
  const keys = await page.evaluate(() => Object.keys(localStorage));
  expect(keys).toContain('chess.identity');
  expect(keys.some((key) => key.startsWith('makruk.') || key.startsWith('sittuyin.') || key.startsWith('shogi.'))).toBe(false);
});

test('both players find the online game under Games, each from their own side (ch-014)', async ({ browser }) => {
  const host = await newPlayer(browser);
  await host.getByRole('radio', { name: 'White', exact: true }).click();
  await host.getByRole('button', { name: 'Create room' }).click();
  const code = (await host.getByTestId('room-code').textContent())!.trim();
  const friend = await newPlayer(browser);
  await friend.getByLabel('Room code').fill(code);
  await friend.getByRole('button', { name: 'Join', exact: true }).click();

  await play(host, [['e2', 'e4']]);
  await expect(plies(friend)).toHaveCount(1);
  await play(friend, [['e7', 'e5']]);
  await expect(plies(host)).toHaveCount(2);

  for (const [page, versus] of [
    [host, 'You vs Opponent'],
    [friend, 'Opponent vs You'],
  ] as const) {
    await page.goto('/games');
    const row = page.getByTestId('game-row');
    await expect(row).toHaveCount(1);
    await expect(row).toHaveAttribute('data-game-id', `online-${code}`);
    await expect(row).toContainText(versus);
    await expect(row).toContainText('Online');
  }
});
