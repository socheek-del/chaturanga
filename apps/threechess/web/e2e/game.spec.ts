import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('plays White, Black and Red in order on 91 hexagonal cells', async ({ page }) => {
  await page.getByRole('button', { name: 'Set the board' }).click();
  await expect(page.getByRole('gridcell')).toHaveCount(91);

  await page.getByTestId('cell-d10').click();
  await expect(page.getByTestId('cell-d9')).toHaveAttribute('data-legal', 'true');
  await page.getByTestId('cell-d9').click();
  await expect(page.locator('.turn-pill')).toContainText('Black to move');

  await page.getByTestId('cell-j4').click();
  await expect(page.getByTestId('cell-i5')).toHaveAttribute('data-legal', 'true');
  await page.getByTestId('cell-i5').click();
  await expect(page.locator('.turn-pill')).toContainText('Red to move');
});

test('saves a position across reloads and can take back the last move', async ({ page }) => {
  await page.getByRole('button', { name: 'Set the board' }).click();
  await page.getByTestId('cell-d10').click();
  await page.getByTestId('cell-d9').click();
  await page.reload();
  await page.getByRole('button', { name: 'Set the board' }).click();
  await expect(page.locator('.turn-pill')).toContainText('Black to move');

  await page.getByTestId('cell-j4').click();
  await page.getByTestId('cell-i5').click();
  await expect(page.locator('.turn-pill')).toContainText('Red to move');
  await page.getByRole('button', { name: 'Take back' }).click();
  await expect(page.locator('.turn-pill')).toContainText('Black to move');
  await expect(page.locator('.move-list')).toContainText('d10d9');
});

test('keeps the board inside a phone viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Set the board' }).click();
  const board = page.locator('.board-grid');
  await expect(board).toBeVisible();
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    board: document.querySelector('.board-grid')!.getBoundingClientRect().width,
  }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
  expect(dimensions.board).toBeLessThanOrEqual(dimensions.viewport);
});

for (const width of [390, 1280]) {
  test(`teaches the complete guided tutorial at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.getByRole('button', { name: 'Start tutorial' }).click();
    const next = () => page.getByRole('button', { name: 'Continue', exact: true }).click();
    await next();
    for (const [from, to] of [['d10', 'd9'], ['j4', 'i5'], ['d4', 'e4']]) {
      await expect(page.getByTestId(`cell-${from}`).locator('.lesson-coordinate')).toHaveText(from);
      await expect(page.getByTestId(`cell-${to}`).locator('.lesson-coordinate')).toHaveText(to);
      await page.getByTestId(`cell-${from}`).click();
      await page.getByTestId(`cell-${to}`).click();
      await expect(page.getByRole('status')).toHaveAttribute('data-result', 'correct');
      await next();
    }
    await next();
    const promotion = async (piece: string) => {
      await page.getByTestId('cell-f2').click();
      await page.getByTestId('cell-f1').click();
      await page.getByRole('button', { name: `Promote to ${piece}` }).click();
    };
    await promotion('queen');
    await expect(page.getByRole('status')).toHaveAttribute('data-result', 'wrong');
    await promotion('knight');
    await expect(page.getByRole('status')).toHaveAttribute('data-result', 'correct');
    await next();
    await page.getByTestId('cell-i1').click();
    await page.getByTestId('cell-g2').click();
    await expect(page.getByRole('status')).toHaveAttribute('data-result', 'correct');
    await next();
    await page.getByRole('button', { name: 'Their turn passes' }).click();
    await page.getByRole('button', { name: 'Check answer' }).click();
    await next();
    await expect(page.getByRole('heading', { name: 'Tutorial complete' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  });
}

for (const [seat, key, prior] of [['White', 'w', 0], ['Black', 'b', 1], ['Red', 'r', 2]] as const) {
  test(`plays two computer opponents as ${seat} and restores its own save`, async ({ page }) => {
    const enter = async () => {
      await page.getByRole('button', { name: 'Play two bots' }).click();
      await page.getByRole('button', { name: seat, exact: true }).click();
    };
    await enter();
    await expect(page.getByText(`${seat} · You`, { exact: true })).toBeVisible();
    await expect(page.locator('.turn-pill')).toContainText(`${seat} to move`);
    await expect(page.locator('.move-entry')).toHaveCount(prior);

    const fen = await page.evaluate((seatKey) => {
      const value = localStorage.getItem(`threechess:hex:v1:bot:${seatKey}`);
      return value ? (JSON.parse(value) as { fen: string }).fen : null;
    }, key);
    const { Game } = await import('@chaturanga/threechess');
    const game = new Game(fen ?? undefined);
    const move = game.legalUci()[0]!;
    const [from, to] = move.match(/[a-k]\d{1,2}/g)!;
    await page.getByTestId(`cell-${from}`).click();
    await page.getByTestId(`cell-${to}`).click();
    await expect(page.locator('.move-entry')).toHaveCount(prior + 3);
    await expect(page.locator('.turn-pill')).toContainText(`${seat} to move`);
    await page.reload();
    await enter();
    await expect(page.locator('.move-entry')).toHaveCount(prior + 3);
    await page.getByRole('button', { name: 'Take back' }).click();
    await expect(page.locator('.move-entry')).toHaveCount(prior);
    await expect(page.locator('.turn-pill')).toContainText(`${seat} to move`);
    await page.getByRole('link', { name: 'Game home' }).click();
    await page.getByRole('button', { name: 'Set the board' }).click();
    await expect(page.locator('.move-entry')).toHaveCount(0);
  });
}

test('finishes a bot game by checkmate from every human seat', async ({ page }) => {
  const { hexAt, parseSquare, RADIUS, SIZE } = await import('@chaturanga/threechess');
  const players = [['w', 'White'], ['b', 'Black'], ['r', 'Red']] as const;
  for (const [index, [seat, name]] of players.entries()) {
    const victim = players[(index + 1) % players.length]![0];
    const eliminated = players[(index + 2) % players.length]![0];
    const board = Array.from({ length: SIZE * SIZE }, (_, square): string =>
      hexAt(square % SIZE - RADIUS, Math.floor(square / SIZE) - RADIUS) === null ? '.' : '-');
    board[parseSquare('f1')!] = victim + 'k';
    board[parseSquare('h1')!] = seat + 'k';
    board[parseSquare('i1')!] = seat + 'q';
    const position = Array.from({ length: SIZE }, (_, row) => board.slice(row * SIZE, (row + 1) * SIZE).join(',')).join('/');
    await page.evaluate(({ seat, fen }) => localStorage.setItem(`threechess:hex:v1:bot:${seat}`, fen),
      { seat, fen: `${position} ${seat} - ${eliminated} -` });
    await page.getByRole('button', { name: 'Play two bots' }).click();
    await page.getByRole('button', { name, exact: true }).click();
    await page.getByTestId('cell-i1').click();
    await page.getByTestId('cell-g2').click();
    await expect(page.locator('.result-card')).toContainText(`${name} wins`);
    await page.getByRole('link', { name: 'Game home' }).click();
  }
});
