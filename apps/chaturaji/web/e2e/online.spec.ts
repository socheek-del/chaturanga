import { expect, test, type Browser, type Page } from '@playwright/test';

const seat = (page: Page, color: string) => page.locator(`[data-online-seat="${color}"]`);
const currentTurn = (page: Page) => page.locator('.online-turn');

async function openRoom(browser: Browser, url: string): Promise<Page> {
  const page = await (await browser.newContext()).newPage();
  await page.goto(url);
  return page;
}

async function makeAction(page: Page, player: string) {
  const face = (await page.locator('.die-tile.is-current strong').innerText()).toLowerCase();
  const types = face.includes('pawn') ? ['p', 'k'] : face.includes('boat') ? ['b'] : face.includes('horse') ? ['h'] : ['e'];
  for (const type of types) {
    const sources = page.locator(`[data-piece="${player}${type}"]`).locator('xpath=..');
    for (let index = 0; index < await sources.count(); index++) {
      await sources.nth(index).click();
      const target = page.locator('[data-target="true"]').first();
      if (await target.count()) { await target.click(); return; }
    }
  }
  await page.getByRole('button', { name: 'Pass this action' }).click();
}

async function finishTurn(page: Page, player: string) {
  await makeAction(page, player);
  await makeAction(page, player);
}

test('runs four server-validated seats, resumes a disconnected seat, and rotates turns', async ({ browser, page: red }) => {
  await red.goto('/');
  await red.getByRole('button', { name: 'Invite players' }).click();
  await red.getByRole('button', { name: 'Create a private room' }).click();
  await expect(seat(red, 'r')).toContainText('Red · You');
  await expect(currentTurn(red)).toContainText('Waiting for all four players');
  const invite = await red.evaluate(() => location.href);

  const green = await openRoom(browser, invite);
  const greenContext = green.context();
  await expect(seat(green, 'g')).toContainText('Green · You');
  const yellow = await openRoom(browser, invite);
  await expect(seat(yellow, 'y')).toContainText('Yellow · You');
  const black = await openRoom(browser, invite);
  await expect(seat(black, 'b')).toContainText('Black · You');
  await expect(currentTurn(red)).toContainText('Red acts for Red');

  await finishTurn(red, 'r');
  await expect(currentTurn(green)).toContainText('Green acts for Green');
  await green.close();
  await expect(seat(red, 'g')).toContainText('Disconnected');
  const reconnectedGreen = await greenContext.newPage();
  await reconnectedGreen.goto(invite);
  await expect(seat(reconnectedGreen, 'g')).toContainText('Green · You');
  await finishTurn(reconnectedGreen, 'g');
  await expect(currentTurn(yellow)).toContainText('Yellow acts for Yellow');
  await finishTurn(yellow, 'y');
  await expect(currentTurn(black)).toContainText('Black acts for Black');
  await finishTurn(black, 'b');
  await expect(currentTurn(red)).toContainText('Red acts for Red');
  await expect(red.locator('.move-history li')).toHaveCount(12);

  await greenContext.close();
  await yellow.context().close();
  await black.context().close();
});

test('rejects an unknown room code', async ({ page }) => {
  await page.goto('/?room=ABCDEF');
  await expect(page.getByText('Room not found.', { exact: true })).toBeVisible();
});
