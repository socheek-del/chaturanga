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

test('ships an installable manifest and a controlling service worker', async ({ page }) => {
  await readyForOffline(page);
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(href).toBeTruthy();
  const manifest = await (await page.request.get(href!)).json();
  expect(manifest).toMatchObject({ short_name: 'Open Plane', display: 'standalone', start_url: '/', lang: 'en' });
  expect(manifest.icons).toEqual(expect.arrayContaining([expect.objectContaining({ type: 'image/svg+xml', purpose: 'any maskable' })]));
  const client = await page.context().newCDPSession(page);
  const { installabilityErrors } = await client.send('Page.getInstallabilityErrors') as { installabilityErrors: Array<{ errorId: string }> };
  expect(installabilityErrors).toEqual([]);
});

test('interactive tutorial and offline local mode load without a network connection', async ({ page, context }) => {
  await readyForOffline(page);
  await context.setOffline(true);
  await page.reload();
  await page.getByRole('link', { name: 'Interactive tutorial' }).click();
  await expect(page.getByRole('heading', { name: 'Learn the open plane' })).toBeVisible();
  await page.getByRole('link', { name: /Coordinates and distance/ }).click();
  await expect(page.getByTestId('infinite-board')).toBeVisible();
  await page.goto('/play?mode=local');
  await page.getByRole('button', { name: 'Begin game' }).click();
  const board = page.getByTestId('infinite-board');
  await board.locator('[data-square="5,2"]').click();
  await board.locator('[data-square="5,4"]').click();
  await expect(page.locator('.move-record')).toHaveCount(1);
});
