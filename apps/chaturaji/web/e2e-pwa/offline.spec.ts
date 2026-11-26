import { expect, type Page, test } from '@playwright/test';

async function readyForOffline(page: Page) {
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) => navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true }));
    }
  });
  await page.reload();
}

test('has an installable manifest and controls a service worker', async ({ page }) => {
  await readyForOffline(page);
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(href).toBeTruthy();
  const manifest = await (await page.request.get(href!)).json();
  expect(manifest).toMatchObject({ short_name: 'Chaturaji', display: 'standalone', start_url: '/', lang: 'en' });
  expect(manifest.icons).toEqual(expect.arrayContaining([expect.objectContaining({ type: 'image/svg+xml', purpose: 'any maskable' })]));
  const client = await page.context().newCDPSession(page);
  const { installabilityErrors } = await client.send('Page.getInstallabilityErrors') as { installabilityErrors: Array<{ errorId: string }> };
  expect(installabilityErrors).toEqual([]);
});

test('loads the tutorial and pass-and-play after going offline', async ({ page, context }) => {
  await readyForOffline(page);
  await context.setOffline(true);
  await page.reload();
  await page.getByRole('button', { name: 'Learn the rules' }).click();
  await expect(page.getByRole('heading', { name: 'Learn at the board' })).toBeVisible();
  await page.getByRole('button', { name: 'Exit tutorial' }).click();
  await page.getByRole('button', { name: 'Play together' }).click();
  await page.getByRole('button', { name: 'Pass this action' }).click();
  await expect(page.locator('.move-history li')).toHaveCount(1);
  await page.goto('/');
  await page.getByRole('button', { name: 'Play against computers' }).click();
  await page.getByLabel('Computer level').selectOption('1');
  await page.getByRole('button', { name: 'Play as Red' }).click();
  await page.getByRole('button', { name: 'Pass this action' }).click();
  await page.getByRole('button', { name: 'Pass this action' }).click();
  await expect.poll(() => page.locator('.move-history li').count(), { timeout: 20_000 }).toBeGreaterThanOrEqual(4);
});
