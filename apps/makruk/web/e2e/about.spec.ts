import { expect, test } from '@playwright/test';

const REPO = 'https://github.com/socheek-del/chaturanga';

test('about page explains the project and links to GitHub for contributors; there is no account area', async ({ page }) => {
  await page.goto('/');
  const nav = page.getByRole('navigation');
  await expect(nav.getByRole('link')).toHaveText(['หมากรุกไทย', 'เล่น', 'เรียน', 'ประวัติ', 'เกี่ยวกับ', 'ตั้งค่า']);
  await nav.getByRole('link', { name: 'เกี่ยวกับ', exact: true }).click();

  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByRole('heading', { name: 'เกี่ยวกับ', level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'หมากรุกไทยคืออะไร' })).toBeVisible();
  const contribute = page.getByTestId('contribute');
  await expect(contribute.getByRole('link', { name: 'ดูโค้ดบน GitHub' })).toHaveAttribute('href', REPO);
  await expect(contribute.getByRole('link', { name: 'วิธีร่วมพัฒนา' })).toHaveAttribute('href', `${REPO}/blob/main/CONTRIBUTING.md`);
  await expect(contribute.getByRole('link', { name: 'รายงานบั๊กหรือเสนอไอเดีย' })).toHaveAttribute('href', `${REPO}/issues/new`);
  await expect(contribute.getByRole('link', { name: 'ดูโค้ดบน GitHub' })).toHaveAttribute('target', '_blank');
  await page.screenshot({ path: 'e2e-evidence/about.png', fullPage: true });

  await page.goto('/settings');
  await page.getByRole('radio', { name: 'English' }).click();
  await page.goto('/about');
  await expect(page.getByRole('heading', { name: 'About', level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: 'View on GitHub' })).toHaveAttribute('href', REPO);

  // Accounts are removed for now: the old routes fall back to the home page.
  await page.goto('/account');
  await expect(page).toHaveURL(/\/$/);
});
