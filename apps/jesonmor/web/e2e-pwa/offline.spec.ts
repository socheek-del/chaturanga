import { expect, test } from '@playwright/test';

test('installs and reloads the field guide offline', async ({ page, context }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /A race to the center/ })).toBeVisible();
  const manifest = await page.evaluate(async () => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (!link?.href) return null;
    return fetch(link.href).then((response) => response.json());
  });
  expect(manifest?.name).toBe('Jeson Mor');
  expect(manifest?.icons?.length).toBeGreaterThan(0);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: /A race to the center/ })).toBeVisible();
  await page.getByRole('button', { name: 'Learn the rules', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Learn Jeson Mor' })).toBeVisible();
  await context.setOffline(false);
});
