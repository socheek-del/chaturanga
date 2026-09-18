import { expect, test } from '@playwright/test';

const REPO = 'https://github.com/socheek-del/chaturanga';

test('the About page explains chess and links contributors to GitHub (ch-010)', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('navigation').getByRole('link', { name: 'About', exact: true }).click();

  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByRole('heading', { name: 'About', level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'What is chess?' })).toBeVisible();
  const contribute = page.getByTestId('contribute');
  await expect(contribute.getByRole('link', { name: 'View the source' })).toHaveAttribute('href', REPO);
  await expect(contribute.getByRole('link', { name: 'How to contribute' })).toHaveAttribute('href', `${REPO}/blob/main/CONTRIBUTING.md`);
  await expect(contribute.getByRole('link', { name: 'Report a bug or suggest an idea' })).toHaveAttribute('href', `${REPO}/issues/new`);
  await expect(contribute.getByRole('link').first()).toHaveAttribute('target', '_blank');
  await page.screenshot({ path: 'e2e-evidence/about.png', fullPage: true });

});
