import { expect, test } from '@playwright/test';

const REPO = 'https://github.com/socheek-del/chaturanga';

test('the About page explains Janggi and links contributors to GitHub, in Korean and English (jg-010)', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('navigation').getByRole('link', { name: '소개', exact: true }).click();

  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByRole('heading', { name: '소개', level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: '장기란 무엇인가요?' })).toBeVisible();
  const contribute = page.getByTestId('contribute');
  await expect(contribute.getByRole('link', { name: '소스 코드 보기' })).toHaveAttribute('href', REPO);
  await expect(contribute.getByRole('link', { name: '참여 방법' })).toHaveAttribute('href', `${REPO}/blob/main/CONTRIBUTING.md`);
  await expect(contribute.getByRole('link', { name: '문제 제보 또는 제안' })).toHaveAttribute('href', `${REPO}/issues/new`);
  await expect(contribute.getByRole('link').first()).toHaveAttribute('target', '_blank');
  await page.screenshot({ path: 'e2e-evidence/about.png', fullPage: true });

  await page.goto('/about?lang=en');
  await expect(page.getByRole('heading', { name: 'About', level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'What is Janggi?' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'View the source' })).toHaveAttribute('href', REPO);
});
