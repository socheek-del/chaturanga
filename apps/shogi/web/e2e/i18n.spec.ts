import { expect, test } from '@playwright/test';

test('the site is Japanese by default (sg-005)', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('将棋');
});

test('?lang=en selects English, and it is remembered after a reload (sg-005)', async ({ page }) => {
  await page.goto('/?lang=en');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Shogi');

  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Shogi');
});

test('English chosen in settings persists after a reload (sg-005)', async ({ page }) => {
  await page.goto('/settings');
  await page.getByRole('radio', { name: 'English' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Settings');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Settings');

  await page.getByRole('radio', { name: '日本語' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
});
