import { expect, test } from '@playwright/test';

test('installs and reloads the Suffragetto field guide offline', async ({ page, context }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /A contest in six places/ })).toBeVisible();
  const manifest = await page.evaluate(async () => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    return link?.href ? fetch(link.href).then((response) => response.json()) : null;
  });
  expect(manifest?.name).toBe('Suffragetto');
  expect(manifest?.icons?.length).toBeGreaterThan(0);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: /A contest in six places/ })).toBeVisible();
  await page.getByRole('button', { name: 'Learn the rules', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Learn Suffragetto' })).toBeVisible();
  await context.setOffline(false);
});
