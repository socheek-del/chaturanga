import { expect, type Page, test } from '@playwright/test';

const square = (page: Page, name: string) => page.locator(`[data-square="${name}"]`);

test('the home page is served (ch-008)', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page).toHaveTitle(/Chess/);
});

test('the Worker answers /api/health with its own service name (ch-008)', async ({ request }) => {
  const res = await request.get('/api/health');
  expect(res.status()).toBe(200);
  expect((await res.json()).service).toBe('chess');
});

test('a computer game runs (ch-008)', async ({ page }) => {
  await page.goto('/play/computer');
  await page.locator('[data-bot-level="1"]').click();
  await page.getByRole('radio', { name: 'White' }).click();
  await page.getByRole('button', { name: 'Start' }).click();
  await square(page, 'e2').click();
  await square(page, 'e4').click();
  await expect(page.getByTestId('turn-banner')).toHaveText('White to move', { timeout: 60_000 });
  await expect(page.locator('[data-ply]')).toHaveCount(2);
});

test('the lessons list loads (ch-008)', async ({ page }) => {
  await page.goto('/learn');
  await expect(page.getByRole('heading').first()).toBeVisible();
});

test('the About page loads (ch-008)', async ({ page }) => {
  await page.goto('/about');
  await expect(page.getByRole('heading').first()).toBeVisible();
});

test('the PWA manifest and its icons are served (ch-008)', async ({ request }) => {
  const manifest = await request.get('/manifest.webmanifest');
  expect(manifest.status()).toBe(200);
  const body = await manifest.json();
  expect(body.name).toContain('Chess');
  for (const icon of body.icons) expect((await request.get(icon.src)).status()).toBe(200);
});

test('a guest token is issued, so online play can start (ch-008)', async ({ request }) => {
  const res = await request.post('/api/guest', { data: {} });
  expect(res.status()).toBe(200);
  expect((await res.json()).token).toBeTruthy();
});
