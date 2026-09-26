import { expect, type Page, test } from '@playwright/test';
import { pieceOn, play, square } from './helpers';

async function startComputer(page: Page, { level = 1, side = 'ขาว' }: { level?: number; side?: string } = {}) {
  await page.goto('/play/computer');
  await page.locator(`[data-bot-level="${level}"]`).click();
  await page.getByRole('radio', { name: side, exact: true }).click();
  await page.getByRole('button', { name: 'เริ่มเกม' }).click();
  await expect(page.getByRole('grid')).toBeVisible();
}

const plies = (page: Page) => page.getByTestId('move-list').locator('[data-ply]');

test('home card opens bot selection with six levels; choice is remembered (ai-002)', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /เล่นกับคอมพิวเตอร์/ }).click();
  await expect(page.locator('[data-bot-level]')).toHaveCount(6);
  await page.locator('[data-bot-level="4"]').click();
  await page.reload();
  await expect(page.locator('[data-bot-level="4"]')).toHaveAttribute('aria-checked', 'true');
  await page.screenshot({ path: 'e2e-evidence/computer-setup.png', fullPage: true });
});

test('the computer replies with a legal move (ai-001)', async ({ page }) => {
  await startComputer(page, { level: 3 });
  await play(page, [['e3', 'e4']]);
  await expect(plies(page)).toHaveCount(2, { timeout: 15_000 });
  await expect(page.getByTestId('turn-banner')).toHaveText('ตาเดินของฝ่ายขาว');
  await expect(page.locator('[data-square] [data-piece]')).toHaveCount(32);
});

test('the UI keeps animating while the strongest bot thinks (ai-001)', async ({ page }) => {
  await startComputer(page, { level: 6, side: 'ดำ' });
  await expect(page.getByTestId('thinking')).toBeVisible();
  const frames = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        let count = 0;
        const start = performance.now();
        const loop = () => {
          count++;
          if (performance.now() - start < 1000) requestAnimationFrame(loop);
          else resolve(count);
        };
        requestAnimationFrame(loop);
      }),
  );
  expect(frames).toBeGreaterThan(30);
  await expect(plies(page)).toHaveCount(1, { timeout: 15_000 });
  await expect(page.getByTestId('thinking')).toBeHidden();
});

test('hint highlights a legal move for the player (ai-003)', async ({ page }) => {
  await startComputer(page, { level: 1 });
  await page.getByRole('button', { name: 'คำใบ้' }).click();
  const hinted = page.locator('[data-hint]');
  await expect(hinted).toHaveCount(2, { timeout: 10_000 });
  const from = hinted.filter({ has: page.locator('[data-piece^="w"]') });
  await expect(from).toHaveCount(1);
  const fromName = await from.getAttribute('data-square');
  const names = await hinted.evaluateAll((els) => els.map((el) => el.getAttribute('data-square')!));
  const toName = names.find((n) => n !== fromName)!;
  await square(page, fromName!).click();
  await square(page, toName).click();
  await expect(pieceOn(page, toName)).toHaveAttribute('data-piece', /^w/);
  await expect(plies(page)).toHaveCount(2, { timeout: 15_000 });
});

test('a refresh continues the same game against the same bot, even while it is thinking', async ({ page }) => {
  await startComputer(page, { level: 6 });
  await play(page, [['e3', 'e4']]);
  await page.reload();
  // The strongest bot was still thinking: after the reload it picks the search up again and replies.
  await expect(pieceOn(page, 'e4')).toHaveAttribute('data-piece', 'wp');
  await expect(plies(page)).toHaveCount(2, { timeout: 15_000 });
  await expect(page.locator('[data-bot-level]')).toHaveCount(0);
  await page.reload();
  await expect(plies(page)).toHaveCount(2);
  await expect(page.getByTestId('turn-banner')).toHaveText('ตาเดินของฝ่ายขาว');
  await expect(page.getByTestId('player-b')).toContainText('ขุนพลใหญ่');
});

test('takeback restores the position before your last move (ai-003)', async ({ page }) => {
  await startComputer(page, { level: 1 });
  await play(page, [['e3', 'e4']]);
  await expect(plies(page)).toHaveCount(2, { timeout: 15_000 });
  await page.getByRole('button', { name: 'ถอนตา' }).click();
  await expect(page.getByText('ยังไม่มีการเดิน')).toBeVisible();
  await expect(pieceOn(page, 'e3')).toHaveAttribute('data-piece', 'wp');
  await expect(page.getByTestId('turn-banner')).toHaveText('ตาเดินของฝ่ายขาว');
});
