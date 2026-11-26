import { defineConfig, devices } from '@playwright/test';

const PORT = 5195;
const WORKER_PORT = 8795;

export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  timeout: 60_000,
  use: { baseURL: `http://127.0.0.1:${PORT}`, trace: 'retain-on-failure' },
  webServer: [
    {
      command: `npx vite --port ${PORT} --strictPort --host 127.0.0.1`,
      url: `http://127.0.0.1:${PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: 'mkdir -p ../web/dist && npx wrangler d1 migrations apply chaturaji --local && npx wrangler dev --ip 127.0.0.1 --port 8795 --var AUTH_SECRET:chaturaji-e2e',
      cwd: '../worker',
      url: `http://127.0.0.1:${WORKER_PORT}/api/health`,
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
      env: { WRANGLER_SEND_METRICS: 'false', WRANGLER_LOG_PATH: '/tmp/chaturanga-chaturaji-playwright.log' },
    },
  ],
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
