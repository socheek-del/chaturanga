import { expect, type Page, test } from '@playwright/test';
import { square } from './helpers';

const prompt = (page: Page) => page.getByTestId('lesson-prompt');
const feedback = (page: Page) => page.getByTestId('feedback');
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });

test('the lesson path lists all fifteen lessons, all open (sg-006)', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: '学ぶ', exact: true }).click();
  await expect(page).toHaveURL(/\/learn$/);
  await expect(page.locator('[data-lesson]')).toHaveCount(15);
  await expect(page.getByTestId('unit-banner')).toHaveCount(4);
  await expect(page.getByTestId('xp')).toHaveText('0 XP');
});

test('the Gold lesson is completed in Japanese, with a wrong answer on the way (sg-006)', async ({ page }) => {
  await page.goto('/learn');
  await page.locator('[data-lesson="gold"] a').click();
  await expect(prompt(page)).toContainText('金将が動ける升');

  // d4 and f4 are diagonally behind the Gold, which is the one direction it cannot go.
  for (const name of ['d4', 'd5', 'd6', 'e4', 'e6', 'f5', 'f6']) await square(page, name).click();
  await button(page, '答え合わせ').click();
  await expect(feedback(page)).toHaveAttribute('data-result', 'wrong');
  await button(page, 'もう一度').click();

  for (const name of ['d5', 'd6', 'e4', 'e6', 'f5', 'f6']) await square(page, name).click();
  await button(page, '答え合わせ').click();
  await expect(feedback(page)).toHaveAttribute('data-result', 'correct');
  await button(page, 'つづける').click();
  await button(page, 'つづける').click();

  const complete = page.getByTestId('lesson-complete');
  await expect(complete).toBeVisible();
  await expect(complete).toContainText('+10 XP');
  await button(page, 'つづける').click();
  await expect(page).toHaveURL(/\/learn$/);
  await expect(page.locator('[data-lesson="gold"]')).toHaveAttribute('data-status', 'completed');
});

test('the drops lesson is completed in English (sg-006)', async ({ page }) => {
  await page.goto('/learn/drops?lang=en');
  await expect(prompt(page)).toContainText('A piece you capture becomes yours');
  await button(page, 'Continue').click();

  await expect(prompt(page)).toContainText('Drop the Gold from hand on c8');
  await page.locator('[data-hand="w"] [data-hand-piece="g"]').click();
  await square(page, 'c8').click();
  await expect(feedback(page)).toHaveAttribute('data-result', 'correct');
  await button(page, 'Continue').click();
  await button(page, 'Continue').click();

  const complete = page.getByTestId('lesson-complete');
  await expect(complete).toBeVisible();
  await expect(complete).toContainText('+20 XP');
});
