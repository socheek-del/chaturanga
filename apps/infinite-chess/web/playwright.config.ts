import { defineConfig, devices } from '@playwright/test';

const PORT = 5230;
const WORKER_PORT = 8825;
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
      command: `mkdir -p ../web/dist && npx wrangler dev --ip 127.0.0.1 --port ${WORKER_PORT} --var AUTH_SECRET:infinite-chess-e2e`,
      cwd: '../worker',
      url: `http://127.0.0.1:${WORKER_PORT}/api/health`,
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
      env: { WRANGLER_SEND_METRICS: 'false' },
    },
  ],
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
