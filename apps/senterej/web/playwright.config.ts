import { defineConfig, devices } from '@playwright/test';

const PORT = 5223;
const WORKER_PORT = 8823;
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  timeout: 60_000,
  use: { baseURL, trace: 'retain-on-failure' },
  webServer: process.env.PLAYWRIGHT_BASE_URL ? [] : [
    {
      command: `npx vite --port ${PORT} --strictPort --host 127.0.0.1`,
      url: `http://127.0.0.1:${PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: 'mkdir -p ../web/dist && npx wrangler d1 migrations apply senterej --local && npx wrangler dev --ip 127.0.0.1 --port 8823 --var AUTH_SECRET:senterej-e2e',
      cwd: '../worker',
      url: `http://127.0.0.1:${WORKER_PORT}/api/health`,
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
      env: { WRANGLER_SEND_METRICS: 'false', WRANGLER_LOG_PATH: '/tmp/chaturanga-senterej-playwright.log' },
    },
  ],
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
