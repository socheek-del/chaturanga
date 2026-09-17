import { expect, type Page, test } from '@playwright/test';
import { point } from './helpers';

const prompt = (page: Page) => page.getByTestId('lesson-prompt');
const feedback = (page: Page) => page.getByTestId('feedback');
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });

test('the lesson path lists all thirteen lessons, all open (xq-006)', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: '学习', exact: true }).click();
  await expect(page).toHaveURL(/\/learn$/);
  await expect(page.locator('[data-lesson]')).toHaveCount(13);
  await expect(page.getByTestId('unit-banner')).toHaveCount(4);
  await expect(page.getByTestId('xp')).toHaveText('0 XP');
});

test('the Advisor lesson is completed in Chinese, with a wrong answer on the way (xq-006)', async ({ page }) => {
  await page.goto('/learn');
  await page.locator('[data-lesson="advisor"] a').click();
  await expect(prompt(page)).toContainText('仕沿九宫的斜线走一步');

  // d1 holds Red's own General, so tapping it as well is wrong.
  for (const name of ['d1', 'd3', 'f1', 'f3']) await point(page, name).click();
  await button(page, '检查').click();
  await expect(feedback(page)).toHaveAttribute('data-result', 'wrong');
  await button(page, '再试一次').click();

  for (const name of ['d3', 'f1', 'f3']) await point(page, name).click();
  await button(page, '检查').click();
  await expect(feedback(page)).toHaveAttribute('data-result', 'correct');
  await button(page, '继续').click();

  const complete = page.getByTestId('lesson-complete');
  await expect(complete).toBeVisible();
  await expect(complete).toContainText('+10 XP');
  await button(page, '继续').click();
  await expect(page).toHaveURL(/\/learn$/);
  await expect(page.locator('[data-lesson="advisor"]')).toHaveAttribute('data-status', 'completed');
});

test('the Chariot lesson is completed in English (xq-006)', async ({ page }) => {
  await page.goto('/learn/chariot?lang=en');
  await expect(prompt(page)).toContainText('The Chariot moves any distance along a line');
  for (const name of ['a2', 'b1', 'c1']) await point(page, name).click();
  await button(page, 'Check').click();
  await expect(feedback(page)).toHaveAttribute('data-result', 'correct');
  await button(page, 'Continue').click();

  await expect(prompt(page)).toHaveText("Capture Black's Horse with the Chariot.");
  await point(page, 'e5').click();
  await point(page, 'b5').click();
  await expect(feedback(page)).toHaveAttribute('data-result', 'correct');
  await expect(feedback(page)).toContainText('the Chariot is the strongest piece');
  await button(page, 'Continue').click();

  const complete = page.getByTestId('lesson-complete');
  await expect(complete).toBeVisible();
  await expect(complete).toHaveAttribute('data-stars', '3');
  await expect(complete).toContainText('+10 XP');
});
