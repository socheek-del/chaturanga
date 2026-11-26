import { expect, test } from '@playwright/test';

test('loads the tutorial offline after the product shell has been cached', async ({ context, page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: /An open field.*A flying start/ })).toBeVisible();
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', /manifest\.webmanifest/);
  await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) throw new Error('service workers unavailable');
    await navigator.serviceWorker.ready;
  });
  await context.setOffline(true);
  await page.goto('/learn');
  await expect(page.getByRole('heading', { name: 'Learn Senterej' })).toBeVisible();
  await expect(page.locator('.lesson-card')).toHaveCount(8);
});
