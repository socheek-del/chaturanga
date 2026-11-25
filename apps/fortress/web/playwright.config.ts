import { defineConfig, devices } from '@playwright/test';

const PORT = 5194;
const WORKER_PORT = 8794;
const deployed = process.env.FORTRESS_E2E_URL;

export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  timeout: 90_000,
  expect: { timeout: 10_000 },
  use: { baseURL: deployed ?? `http://127.0.0.1:${PORT}`, trace: 'retain-on-failure' },
  webServer: deployed
    ? undefined
    : [
        {
          command: `npx vite --port ${PORT} --strictPort --host 127.0.0.1`,
          url: `http://127.0.0.1:${PORT}`,
          reuseExistingServer: !process.env.CI,
          timeout: 60_000,
        },
        {
          command: `mkdir -p ../web/dist && npx wrangler d1 migrations apply fortress --local && npx wrangler dev --ip 127.0.0.1 --port ${WORKER_PORT} --var AUTH_SECRET:fortress-e2e`,
          cwd: '../worker',
          url: `http://127.0.0.1:${WORKER_PORT}/api/health`,
          timeout: 120_000,
          reuseExistingServer: !process.env.CI,
          env: { WRANGLER_SEND_METRICS: 'false', XDG_CONFIG_HOME: '/private/tmp/fortress-wrangler-config' },
        },
      ],
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}),
      },
    },
  ],
});
