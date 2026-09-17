import { expect, test } from '@playwright/test';

const REPO = 'https://github.com/socheek-del/chaturanga';

test('the About page explains Xiangqi and links contributors to GitHub, in Chinese and English (xq-010)', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('navigation').getByRole('link', { name: '关于', exact: true }).click();

  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByRole('heading', { name: '关于', level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: '什么是象棋？' })).toBeVisible();
  const contribute = page.getByTestId('contribute');
  await expect(contribute.getByRole('link', { name: '查看源代码' })).toHaveAttribute('href', REPO);
  await expect(contribute.getByRole('link', { name: '如何参与' })).toHaveAttribute('href', `${REPO}/blob/main/CONTRIBUTING.md`);
  await expect(contribute.getByRole('link', { name: '报告问题或提建议' })).toHaveAttribute('href', `${REPO}/issues/new`);
  await expect(contribute.getByRole('link').first()).toHaveAttribute('target', '_blank');
  await page.screenshot({ path: 'e2e-evidence/about.png', fullPage: true });

  await page.goto('/about?lang=en');
  await expect(page.getByRole('heading', { name: 'About', level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'What is Xiangqi?' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'View the source' })).toHaveAttribute('href', REPO);
});
