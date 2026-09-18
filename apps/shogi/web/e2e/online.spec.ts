import { type Browser, expect, type Page, test } from '@playwright/test';
import { play } from './helpers';

const plies = (page: Page) => page.getByTestId('move-list').locator('[data-ply]');

async function newPlayer(browser: Browser): Promise<Page> {
  const page = await (await browser.newContext()).newPage();
  await page.goto('/play/online');
  await expect(page.getByRole('button', { name: '部屋を作る' })).toBeEnabled();
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

test('create a room, a friend joins by code, and both play 4 moves on the same board (sg-007)', async ({ browser }) => {
  const host = await newPlayer(browser);
  await host.locator('[data-time-control="5+0"]').click();
  await host.getByRole('radio', { name: '先手', exact: true }).click();
  await host.getByRole('button', { name: '部屋を作る' }).click();
  const code = (await host.getByTestId('room-code').textContent())!.trim();
  expect(code).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
  await expect(host.getByTestId('room-link')).toContainText(`/play/online/${code}`);

  const friend = await newPlayer(browser);
  await friend.getByLabel('合言葉').fill(code.toLowerCase());
  await friend.getByRole('button', { name: '入る', exact: true }).click();

  await expect(host.getByRole('grid')).toHaveAttribute('data-orientation', 'w');
  await expect(friend.getByRole('grid')).toHaveAttribute('data-orientation', 'b');

  await play(host, [['g3', 'g4']]);
  await expect(plies(friend)).toHaveCount(1);
  await play(friend, [['c7', 'c6']]);
  await expect(plies(host)).toHaveCount(2);
  await play(host, [['h2', 'g2']]);
  await expect(plies(friend)).toHaveCount(3);
  await play(friend, [['b8', 'c8']]);
  await expect(plies(host)).toHaveCount(4);

  const hostMoves = await plies(host).allTextContents();
  expect(await plies(friend).allTextContents()).toEqual(hostMoves);
  const hostBoard = await boardOf(host);
  expect(await boardOf(friend)).toEqual(hostBoard);
  expect(hostBoard).toMatchObject({ g4: 'wp', g2: 'wr', c6: 'bp', c8: 'br' });
  expect(Object.keys(hostBoard)).toHaveLength(40);

  // No chat of any kind.
  for (const page of [host, friend]) await expect(page.getByRole('textbox')).toHaveCount(0);
  await host.screenshot({ path: 'e2e-evidence/online-game.png' });
});

test('an unknown code shows an error (sg-007)', async ({ page }) => {
  await page.goto('/play/online');
  await page.getByLabel('合言葉').fill('ZZZZZZ');
  await page.getByRole('button', { name: '入る', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('部屋が見つかりません');
});

test('the online lobby is in English too, and the seat token is Shogi-only (sg-007)', async ({ page }) => {
  await page.goto('/play/online?lang=en');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Play online');
  await expect(page.getByRole('button', { name: 'Create room' })).toBeEnabled();
  const keys = await page.evaluate(() => Object.keys(localStorage));
  expect(keys).toContain('shogi.identity');
  expect(keys.some((key) => key.startsWith('makruk.') || key.startsWith('sittuyin.'))).toBe(false);
});
