import { type Browser, expect, type Page, test } from '@playwright/test';
import { play } from './helpers';

const plies = (page: Page) => page.getByTestId('move-list').locator('[data-ply]');

async function newPlayer(browser: Browser): Promise<Page> {
  const page = await (await browser.newContext()).newPage();
  await page.goto('/play/online');
  await expect(page.getByRole('button', { name: '创建房间' })).toBeEnabled();
  return page;
}

/** Every piece on the board, by point, as the page shows it. */
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

test('create a room, a friend joins by code, and both play 4 moves on the same board (xq-007)', async ({ browser }) => {
  const host = await newPlayer(browser);
  await host.locator('[data-time-control="5+0"]').click();
  await host.getByRole('radio', { name: '红方', exact: true }).click();
  await host.getByRole('button', { name: '创建房间' }).click();
  const code = (await host.getByTestId('room-code').textContent())!.trim();
  expect(code).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
  await expect(host.getByTestId('room-link')).toContainText(`/play/online/${code}`);

  const friend = await newPlayer(browser);
  await friend.getByLabel('房间号').fill(code.toLowerCase());
  await friend.getByRole('button', { name: '加入', exact: true }).click();

  await expect(host.getByRole('grid')).toHaveAttribute('data-orientation', 'w');
  await expect(friend.getByRole('grid')).toHaveAttribute('data-orientation', 'b');
  await expect(host.getByRole('grid')).toHaveAttribute('data-grid', 'points');

  await play(host, [['h3', 'e3']]);
  await expect(plies(friend)).toHaveCount(1);
  await play(friend, [['h10', 'g8']]);
  await expect(plies(host)).toHaveCount(2);
  await play(host, [['h1', 'g3']]);
  await expect(plies(friend)).toHaveCount(3);
  await play(friend, [['i10', 'h10']]);
  await expect(plies(host)).toHaveCount(4);

  const hostMoves = await plies(host).allTextContents();
  expect(await plies(friend).allTextContents()).toEqual(hostMoves);
  const hostBoard = await boardOf(host);
  expect(await boardOf(friend)).toEqual(hostBoard);
  expect(hostBoard).toMatchObject({ e3: 'wc', g3: 'wn', g8: 'bn', h10: 'br' });
  expect(Object.keys(hostBoard)).toHaveLength(32);

  // No chat of any kind.
  for (const page of [host, friend]) await expect(page.getByRole('textbox')).toHaveCount(0);
  await host.screenshot({ path: 'e2e-evidence/online-game.png' });
});

test('an unknown code shows an error (xq-007)', async ({ page }) => {
  await page.goto('/play/online');
  await page.getByLabel('房间号').fill('ZZZZZZ');
  await page.getByRole('button', { name: '加入', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('找不到这个房间');
});

test('the online lobby is in English too, and the seat token is Xiangqi-only (xq-007)', async ({ page }) => {
  await page.goto('/play/online?lang=en');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Play online');
  await expect(page.getByRole('button', { name: 'Create room' })).toBeEnabled();
  const keys = await page.evaluate(() => Object.keys(localStorage));
  expect(keys).toContain('xiangqi.identity');
  expect(keys.some((key) => key.startsWith('makruk.') || key.startsWith('sittuyin.'))).toBe(false);
});
