import { expect, type Page, test } from '@playwright/test';

const square = (page: Page, name: string) => page.locator(`[data-square="${name}"]`);

test('the home page is served in Japanese (sg-008)', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
  await expect(page).toHaveTitle(/将棋/);
});

test('English is served at ?lang=en (sg-008)', async ({ page }) => {
  await page.goto('/?lang=en');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('the Worker answers /api/health with its own service name (sg-008)', async ({ request }) => {
  const res = await request.get('/api/health');
  expect(res.status()).toBe(200);
  expect((await res.json()).service).toBe('shogi');
});

test('a computer game runs (sg-008)', async ({ page }) => {
  await page.goto('/play/computer');
  await page.locator('[data-bot-level="1"]').click();
  await page.getByRole('radio', { name: '先手' }).click();
  await page.getByRole('button', { name: '開始' }).click();
  await square(page, 'g3').click();
  await square(page, 'g4').click();
  await expect(page.getByTestId('turn-banner')).toHaveText('先手の番', { timeout: 60_000 });
  await expect(page.locator('[data-ply]')).toHaveCount(2);
});

test('the lessons list loads (sg-008)', async ({ page }) => {
  await page.goto('/learn');
  await expect(page.getByRole('heading').first()).toBeVisible();
});

test('the About page loads (sg-008)', async ({ page }) => {
  await page.goto('/about');
  await expect(page.getByRole('heading').first()).toBeVisible();
});

test('the PWA manifest and its icons are served (sg-008)', async ({ request }) => {
  const manifest = await request.get('/manifest.webmanifest');
  expect(manifest.status()).toBe(200);
  const body = await manifest.json();
  expect(body.name).toContain('将棋');
  for (const icon of body.icons) expect((await request.get(icon.src)).status()).toBe(200);
});

test('a guest token is issued, so online play can start (sg-008)', async ({ request }) => {
  const res = await request.post('/api/guest', { data: {} });
  expect(res.status()).toBe(200);
  expect((await res.json()).token).toBeTruthy();
});
