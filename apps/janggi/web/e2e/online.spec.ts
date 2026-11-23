import { type Browser, expect, type Page, test } from '@playwright/test';
import { play } from './helpers';

const plies = (page: Page) => page.getByTestId('move-list').locator('[data-ply]');

async function newPlayer(browser: Browser): Promise<Page> {
  const page = await (await browser.newContext()).newPage();
  await page.goto('/play/online');
  await expect(page.getByRole('button', { name: '방 만들기' })).toBeEnabled();
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

test('create a room, a friend joins by code, and both play 4 moves on the same board (jg-007)', async ({ browser }) => {
  const host = await newPlayer(browser);
  await host.locator('[data-time-control="5+0"]').click();
  await host.getByRole('radio', { name: '초 (선수)', exact: true }).click();
  await host.getByRole('button', { name: '방 만들기' }).click();
  const code = (await host.getByTestId('room-code').textContent())!.trim();
  expect(code).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
  await expect(host.getByTestId('room-link')).toContainText(`/play/online/${code}`);

  const friend = await newPlayer(browser);
  await friend.getByLabel('방 코드').fill(code.toLowerCase());
  await friend.getByRole('button', { name: '참가', exact: true }).click();

  await expect(host.getByRole('grid')).toHaveAttribute('data-orientation', 'w');
  await expect(friend.getByRole('grid')).toHaveAttribute('data-orientation', 'b');
  await expect(host.getByRole('grid')).toHaveAttribute('data-grid', 'points');

  await play(host, [['a4', 'b4']]);
  await expect(plies(friend)).toHaveCount(1);
  await play(friend, [['i7', 'h7']]);
  await expect(plies(host)).toHaveCount(2);
  await play(host, [['h1', 'g3']]);
  await expect(plies(friend)).toHaveCount(3);
  await play(friend, [['b10', 'c8']]);
  await expect(plies(host)).toHaveCount(4);

  const hostMoves = await plies(host).allTextContents();
  expect(await plies(friend).allTextContents()).toEqual(hostMoves);
  const hostBoard = await boardOf(host);
  expect(await boardOf(friend)).toEqual(hostBoard);
  expect(hostBoard).toMatchObject({ b4: 'wp', g3: 'wn', h7: 'bp', c8: 'bn' });
  expect(Object.keys(hostBoard)).toHaveLength(32);

  // No chat of any kind.
  for (const page of [host, friend]) await expect(page.getByRole('textbox')).toHaveCount(0);
  await host.screenshot({ path: 'e2e-evidence/online-game.png' });
});

test('a private room starts from the arrangements its creator chose, and a pass travels (jg-007)', async ({ browser }) => {
  const host = await newPlayer(browser);
  await host.getByRole('radio', { name: '초 (선수)', exact: true }).click();
  await host.locator('[data-setup="w-outer"]').click();
  await host.locator('[data-setup="b-left"]').click();
  await host.getByRole('button', { name: '방 만들기' }).click();
  const code = (await host.getByTestId('room-code').textContent())!.trim();
  const friend = await newPlayer(browser);
  await friend.getByLabel('방 코드').fill(code);
  await friend.getByRole('button', { name: '참가', exact: true }).click();
  await expect(friend.getByRole('grid')).toBeVisible();
  expect(await boardOf(friend)).toMatchObject({ b1: 'wb', c1: 'wn', g1: 'wn', h1: 'wb', i10: 'br', h10: 'bb', g10: 'bn', c10: 'bb', b10: 'bn' });

  await expect(friend.getByTestId('pass')).toBeDisabled();
  await host.getByTestId('pass').click();
  await expect(plies(friend)).toHaveCount(1);
  await friend.getByTestId('pass').click();
  await friend.getByTestId('confirm-pass').click();
  for (const page of [host, friend]) await expect(page.getByTestId('result-reason')).toHaveText('양쪽 모두 한수쉼, 점수 판정');
});

test('an unknown code shows an error (jg-007)', async ({ page }) => {
  await page.goto('/play/online');
  await page.getByLabel('방 코드').fill('ZZZZZZ');
  await page.getByRole('button', { name: '참가', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('방을 찾을 수 없습니다');
});

test('the online lobby is in English too, and the seat token is Janggi-only (jg-007)', async ({ page }) => {
  await page.goto('/play/online?lang=en');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Play online');
  await expect(page.getByRole('button', { name: 'Create room' })).toBeEnabled();
  const keys = await page.evaluate(() => Object.keys(localStorage));
  expect(keys).toContain('janggi.identity');
  expect(keys.some((key) => key.startsWith('makruk.') || key.startsWith('sittuyin.'))).toBe(false);
});
