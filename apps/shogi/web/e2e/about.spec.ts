import { expect, test } from '@playwright/test';

const REPO = 'https://github.com/socheek-del/chaturanga';

test('the About page explains Shogi and links contributors to GitHub, in Japanese and English (sg-010)', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('navigation').getByRole('link', { name: 'このサイトについて', exact: true }).click();

  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByRole('heading', { name: 'このサイトについて', level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: '将棋とは' })).toBeVisible();
  const contribute = page.getByTestId('contribute');
  await expect(contribute.getByRole('link', { name: 'ソースを見る' })).toHaveAttribute('href', REPO);
  await expect(contribute.getByRole('link', { name: '参加のしかた' })).toHaveAttribute('href', `${REPO}/blob/main/CONTRIBUTING.md`);
  await expect(contribute.getByRole('link', { name: '不具合や要望を送る' })).toHaveAttribute('href', `${REPO}/issues/new`);
  await expect(contribute.getByRole('link').first()).toHaveAttribute('target', '_blank');
  await page.screenshot({ path: 'e2e-evidence/about.png', fullPage: true });

  await page.goto('/about?lang=en');
  await expect(page.getByRole('heading', { name: 'About', level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'What is Shogi?' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'View the source' })).toHaveAttribute('href', REPO);
});
