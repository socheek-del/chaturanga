import { expect, test } from '@playwright/test';

test('installs and reloads the field guide offline', async ({ page, context }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Chess gets a second life.' })).toBeVisible();
  const manifest = await page.evaluate(async () => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (!link?.href) return null;
    return fetch(link.href).then((response) => response.json());
  });
  expect(manifest?.name).toBe('Crazyhouse');
  expect(manifest?.icons?.length).toBeGreaterThan(0);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Chess gets a second life.' })).toBeVisible();
  await page.getByRole('button', { name: 'Learn the rules' }).click();
  await expect(page.getByRole('heading', { name: 'Learn Crazyhouse' })).toBeVisible();
  await context.setOffline(false);
});
