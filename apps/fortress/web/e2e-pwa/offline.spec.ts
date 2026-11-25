import { expect, type Page, test } from '@playwright/test';

async function readyForOffline(page: Page) {
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) =>
        navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true }),
      );
    }
  });
  await page.reload();
}

test('PWA manifest, icon and service worker are installable', async ({ page }) => {
  await readyForOffline(page);
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(href).toBeTruthy();
  const manifest = await (await page.request.get(href!)).json();
  expect(manifest).toMatchObject({
    short_name: 'Fortress Chess',
    display: 'standalone',
    start_url: '/',
    lang: 'en',
  });
  expect(manifest.icons).toEqual(
    expect.arrayContaining([expect.objectContaining({ type: 'image/svg+xml', purpose: 'any maskable' })]),
  );
  const client = await page.context().newCDPSession(page);
  const { installabilityErrors } = (await client.send('Page.getInstallabilityErrors')) as {
    installabilityErrors: Array<{ errorId: string }>;
  };
  expect(installabilityErrors).toEqual([]);
});

test('offline reload supports the tutorial and pass-and-play', async ({ page, context }) => {
  await readyForOffline(page);
  await context.setOffline(true);
  await page.reload();
  await page.locator('.hero-tabs button').filter({ hasText: 'Learn the rules' }).click();
  await expect(page.locator('[data-step="welcome"]')).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.locator('[data-step="board"]')).toBeVisible();
  await page.goto('/');
  await page.getByRole('button', { name: 'Pass and play' }).click();
  await page.locator('.reserve-token').filter({ hasText: 'bishop' }).click();
  await page.getByTestId('square-a13').click();
  await expect(page.locator('.move-record li')).toHaveCount(1);
});
