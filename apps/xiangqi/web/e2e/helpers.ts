import { expect, type Page } from '@playwright/test';

export const point = (page: Page, name: string) => page.locator(`[data-square="${name}"]`);
export const pieceOn = (page: Page, name: string) => point(page, name).locator('[data-piece]');

/**
 * Writes a saved pass-and-play game so the next navigation opens at `fen`, through the same localStorage
 * shape the session store persists (the refresh-restore path).
 */
export async function seedSavedGame(page: Page, fen: string): Promise<void> {
  await page.addInitScript((startFen) => {
    const saved = {
      state: { phase: 'playing', startFen, moves: [], timeControl: null, clock: null, result: null, flipped: false },
      version: 1,
    };
    localStorage.setItem('xiangqi.session.local', JSON.stringify(saved));
  }, fen);
}

/** Opens pass-and-play and starts an untimed game from the start position. */
export async function startLocalGame(page: Page): Promise<void> {
  await page.goto('/play/local');
  await page.getByRole('button', { name: '开始' }).click();
  await expect(page.getByRole('grid')).toBeVisible();
}

export async function play(page: Page, moves: ReadonlyArray<readonly [string, string]>): Promise<void> {
  for (const [from, to] of moves) {
    await point(page, from).click();
    await point(page, to).click();
    await expect(pieceOn(page, to)).toBeVisible();
  }
}

/** Target points currently offered on the board. */
export async function targets(page: Page): Promise<string[]> {
  return page.locator('[data-square][data-target]').evaluateAll((els) => els.map((el) => el.getAttribute('data-square')!).sort());
}
