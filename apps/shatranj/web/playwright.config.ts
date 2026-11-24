import { defineConfig, devices } from '@playwright/test';

const web = 'http://127.0.0.1:5194';
const worker = 'http://127.0.0.1:8794';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  use: { baseURL: web, trace: 'retain-on-failure' },
  webServer: [
    { command: 'npm run dev -- --host 127.0.0.1 --strictPort', url: web, reuseExistingServer: !process.env.CI },
    {
      command: 'mkdir -p ../web/dist && npx wrangler d1 migrations apply shatranj --local && npx wrangler dev --ip 127.0.0.1 --port 8794 --var AUTH_SECRET:shatranj-e2e',
      cwd: '../worker',
      url: `${worker}/api/health`,
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
      env: { WRANGLER_SEND_METRICS: 'false' },
    },
  ],
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
