import { defineConfig, devices } from '@playwright/test';

const PORT = 5194;
const browserChannel = process.env.PLAYWRIGHT_CHANNEL;
const deployed = process.env.FOURCHESS_E2E_URL;

export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: { baseURL: deployed ?? `http://127.0.0.1:${PORT}`, trace: 'retain-on-failure' },
  webServer: deployed ? undefined : [
    {
      command: `npx vite --port ${PORT} --strictPort --host 127.0.0.1`,
      url: `http://127.0.0.1:${PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: 'mkdir -p ../web/dist && npx wrangler d1 migrations apply fourchess --local && npx wrangler dev --ip 127.0.0.1 --port 8794 --var AUTH_SECRET:fourchess-e2e',
      cwd: '../worker',
      url: 'http://127.0.0.1:8794/api/health',
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
      env: {
        WRANGLER_SEND_METRICS: 'false',
        WRANGLER_LOG_PATH: '/tmp/chaturanga-fourchess-playwright.log',
      },
    },
  ],
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], ...(browserChannel ? { channel: browserChannel } : {}) } }],
});
