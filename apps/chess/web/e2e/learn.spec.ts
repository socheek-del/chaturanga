import { expect, type Page, test } from '@playwright/test';
import { square } from './helpers';

const prompt = (page: Page) => page.getByTestId('lesson-prompt');
const feedback = (page: Page) => page.getByTestId('feedback');
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });

test('the lesson path lists all sixteen lessons, all open (ch-006)', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Learn', exact: true }).click();
  await expect(page).toHaveURL(/\/learn$/);
  await expect(page.locator('[data-lesson]')).toHaveCount(16);
  await expect(page.getByTestId('unit-banner')).toHaveCount(5);
  await expect(page.getByTestId('xp')).toHaveText('0 XP');
});

test('the knight lesson shows the moves first, then asks for them (ch-006)', async ({ page }) => {
  await page.goto('/learn');
  await page.locator('[data-lesson="knight"] a').click();

  // Step 1 teaches: the eight squares are lit before anything is asked.
  await expect(prompt(page)).toContainText('two squares in a line and one across');
  await expect(page.locator('[data-square][data-target]')).toHaveCount(8);
  await button(page, 'Continue').click();
  await expect(prompt(page)).toContainText('every square the piece on e5 can move to');

  // A neighbouring square is never a knight move.
  for (const name of ['d7', 'f7', 'c6', 'g6', 'c4', 'g4', 'd3', 'e4']) await square(page, name).click();
  await button(page, 'Check').click();
  await expect(feedback(page)).toHaveAttribute('data-result', 'wrong');
  await button(page, 'Try again').click();

  for (const name of ['d7', 'f7', 'c6', 'g6', 'c4', 'g4', 'd3', 'f3']) await square(page, name).click();
  await button(page, 'Check').click();
  await expect(feedback(page)).toHaveAttribute('data-result', 'correct');
  await button(page, 'Continue').click();
  await button(page, 'Continue').click();

  const complete = page.getByTestId('lesson-complete');
  await expect(complete).toBeVisible();
  await expect(complete).toContainText('+10 XP');
  await button(page, 'Continue').click();
  await expect(page).toHaveURL(/\/learn$/);
  await expect(page.locator('[data-lesson="knight"]')).toHaveAttribute('data-status', 'completed');
});

test('a hint is one press away, and points at the answer (ch-006)', async ({ page }) => {
  await page.goto('/learn/rook');
  await button(page, 'Continue').click();

  await expect(page.getByTestId('lesson-hint')).toHaveCount(0);
  await page.getByTestId('show-hint').click();
  await expect(page.getByTestId('lesson-hint')).toContainText('fourteen squares');
  await expect(page.locator('[data-square][data-hint]')).toHaveCount(14);

  for (const name of ['e1', 'e2', 'e3', 'e4', 'e6', 'e7', 'e8', 'a5', 'b5', 'c5', 'd5', 'f5', 'g5', 'h5']) {
    await square(page, name).click();
  }
  await button(page, 'Check').click();
  await expect(feedback(page)).toHaveAttribute('data-result', 'correct');
});

test('the castling lesson is played on the board (ch-006)', async ({ page }) => {
  await page.goto('/learn/castling');
  await expect(prompt(page)).toContainText('the two can move together');
  await button(page, 'Continue').click();

  await expect(prompt(page)).toContainText('Castle on the king side');
  await square(page, 'e1').click();
  await square(page, 'g1').click();
  await expect(feedback(page)).toHaveAttribute('data-result', 'correct');
  await button(page, 'Continue').click();
  await button(page, 'Continue').click();

  await expect(prompt(page)).toContainText('How many ways can this king castle?');
  await page.locator('[data-choice="2"]').click();
  await button(page, 'Check').click();
  await expect(feedback(page)).toHaveAttribute('data-result', 'correct');
  await button(page, 'Continue').click();

  const complete = page.getByTestId('lesson-complete');
  await expect(complete).toBeVisible();
  await expect(complete).toContainText('+15 XP');
});
