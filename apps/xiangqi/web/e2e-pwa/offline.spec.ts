import { expect, type Page, test } from '@playwright/test';

async function waitForServiceWorker(page: Page) {
  await page.goto('/');
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) => navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true }));
    }
    return registration.active?.state;
  });
  // A reload makes sure every navigation from now on is served by the service worker.
  await page.reload();
}

test('the app is installable (manifest, icons, service worker) (xq-005)', async ({ page }) => {
  await waitForServiceWorker(page);
  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(manifestHref).toBeTruthy();
  const manifest = await (await page.request.get(manifestHref!)).json();
  expect(manifest).toMatchObject({ short_name: '象棋', display: 'standalone', start_url: '/', lang: 'zh-Hans' });
  expect(manifest.icons.map((i: { sizes: string }) => i.sizes)).toEqual(expect.arrayContaining(['192x192', '512x512']));

  const client = await page.context().newCDPSession(page);
  const { installabilityErrors } = (await client.send('Page.getInstallabilityErrors')) as {
    installabilityErrors: Array<{ errorId: string }>;
  };
  expect(installabilityErrors).toEqual([]);
});

test('offline: play the computer and play locally (xq-005)', async ({ page, context }) => {
  await waitForServiceWorker(page);
  await context.setOffline(true);

  await page.goto('/play/computer');
  await page.locator('[data-bot-level="1"]').click();
  await page.getByRole('radio', { name: '红方' }).click();
  await page.getByRole('button', { name: '开始' }).click();
  await page.locator('[data-square="h3"]').click();
  await page.locator('[data-square="e3"]').click();
  await expect(page.getByTestId('turn-banner')).toHaveText('轮到红方', { timeout: 30_000 });

  await page.goto('/play/local');
  await page.getByRole('button', { name: '开始' }).click();
  await expect(page.locator('[data-square] [data-piece]')).toHaveCount(32);
});
