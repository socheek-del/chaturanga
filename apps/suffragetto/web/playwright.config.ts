import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:5201', trace: 'retain-on-failure', ...devices['Desktop Chrome'] },
  webServer: [
    {
      command: 'npm run dev -- --host 127.0.0.1',
      url: 'http://127.0.0.1:5201',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command:
        'mkdir -p ../web/dist && npx wrangler d1 migrations apply suffragetto --local && ' +
        'npx wrangler dev --port 8811 --ip 127.0.0.1 --var RECONNECT_GRACE_MS:3000 --var AUTH_SECRET:e2e-secret',
      cwd: '../worker',
      url: 'http://127.0.0.1:8811/api/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: { WRANGLER_SEND_METRICS: 'false' },
    },
  ],
});
