import { expect, type Page, test } from '@playwright/test';

const point = (page: Page, name: string) => page.locator(`[data-square="${name}"]`);

test('the home page is served in Chinese (xq-008)', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-Hans');
  await expect(page).toHaveTitle(/象棋/);
});

test('English is served at ?lang=en (xq-008)', async ({ page }) => {
  await page.goto('/?lang=en');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('the Worker answers /api/health with its own service name (xq-008)', async ({ request }) => {
  const res = await request.get('/api/health');
  expect(res.status()).toBe(200);
  expect((await res.json()).service).toBe('xiangqi');
});

test('a computer game runs (xq-008)', async ({ page }) => {
  await page.goto('/play/computer');
  await page.locator('[data-bot-level="1"]').click();
  await page.getByRole('radio', { name: '红方' }).click();
  await page.getByRole('button', { name: '开始' }).click();
  await point(page, 'h3').click();
  await point(page, 'e3').click();
  await expect(page.getByTestId('turn-banner')).toHaveText('轮到红方', { timeout: 60_000 });
  await expect(page.locator('[data-ply]')).toHaveCount(2);
});

test('the lessons list loads (xq-008)', async ({ page }) => {
  await page.goto('/learn');
  await expect(page.getByRole('heading').first()).toBeVisible();
});

test('the About page loads (xq-008)', async ({ page }) => {
  await page.goto('/about');
  await expect(page.getByRole('heading').first()).toBeVisible();
});

test('the PWA manifest and its icons are served (xq-008)', async ({ request }) => {
  const manifest = await request.get('/manifest.webmanifest');
  expect(manifest.status()).toBe(200);
  const body = await manifest.json();
  expect(body.name).toContain('象棋');
  for (const icon of body.icons) expect((await request.get(icon.src)).status()).toBe(200);
});

test('a guest token is issued, so online play can start (xq-008)', async ({ request }) => {
  const res = await request.post('/api/guest', { data: {} });
  expect(res.status()).toBe(200);
  expect((await res.json()).token).toBeTruthy();
});
