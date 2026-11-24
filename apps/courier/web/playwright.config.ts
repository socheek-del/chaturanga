import { defineConfig, devices } from '@playwright/test';

const web = 'http://127.0.0.1:5197';
const worker = 'http://127.0.0.1:8797';
const deployed = process.env.COURIER_E2E_URL;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  use: { baseURL: deployed ?? web, trace: 'retain-on-failure' },
  webServer: deployed ? undefined : [
    { command: 'npm run dev -- --host 127.0.0.1 --strictPort', url: web, reuseExistingServer: !process.env.CI },
    {
      command: 'mkdir -p ../web/dist && npx wrangler d1 migrations apply courier --local && npx wrangler dev --ip 127.0.0.1 --port 8797 --var AUTH_SECRET:courier-e2e',
      cwd: '../worker',
      url: `${worker}/api/health`,
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
      env: { WRANGLER_SEND_METRICS: 'false' },
    },
  ],
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
