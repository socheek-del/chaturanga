import { expect, type Page, test } from '@playwright/test';

const point = (page: Page, name: string) => page.locator(`[data-square="${name}"]`);

test('the home page is served in Korean (jg-008)', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
  await expect(page).toHaveTitle(/장기/);
});

test('English is served at ?lang=en (jg-008)', async ({ page }) => {
  await page.goto('/?lang=en');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('the Worker answers /api/health with its own service name (jg-008)', async ({ request }) => {
  const res = await request.get('/api/health');
  expect(res.status()).toBe(200);
  expect((await res.json()).service).toBe('janggi');
});

test('a computer game runs (jg-008)', async ({ page }) => {
  await page.goto('/play/computer');
  await page.locator('[data-bot-level="1"]').click();
  await page.getByRole('radio', { name: '초 (선수)' }).click();
  await page.getByRole('button', { name: '시작' }).click();
  await point(page, 'a4').click();
  await point(page, 'b4').click();
  await expect(page.getByTestId('turn-banner')).toHaveText('초 차례', { timeout: 60_000 });
  await expect(page.locator('[data-ply]')).toHaveCount(2);
});

test('the lessons list loads (jg-008)', async ({ page }) => {
  await page.goto('/learn');
  await expect(page.getByRole('heading').first()).toBeVisible();
});

test('the About page loads (jg-008)', async ({ page }) => {
  await page.goto('/about');
  await expect(page.getByRole('heading').first()).toBeVisible();
});

test('the PWA manifest and its icons are served (jg-008)', async ({ request }) => {
  const manifest = await request.get('/manifest.webmanifest');
  expect(manifest.status()).toBe(200);
  const body = await manifest.json();
  expect(body.name).toContain('장기');
  for (const icon of body.icons) expect((await request.get(icon.src)).status()).toBe(200);
});

test('a guest token is issued, so online play can start (jg-008)', async ({ request }) => {
  const res = await request.post('/api/guest', { data: {} });
  expect(res.status()).toBe(200);
  expect((await res.json()).token).toBeTruthy();
});
