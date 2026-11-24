import { defineConfig, devices } from '@playwright/test';

const web = 'http://127.0.0.1:5207';
const worker = 'http://127.0.0.1:8807';
const deployed = process.env.TAMERLANE_E2E_URL;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  use: { baseURL: deployed ?? web, trace: 'retain-on-failure' },
  webServer: deployed ? undefined : [
    { command: 'npm run dev -- --host 127.0.0.1 --strictPort', url: web, reuseExistingServer: !process.env.CI },
    {
      command: 'mkdir -p ../web/dist && npx wrangler d1 migrations apply tamerlane --local && npx wrangler dev --ip 127.0.0.1 --port 8807 --var AUTH_SECRET:tamerlane-e2e',
      cwd: '../worker',
      url: `${worker}/api/health`,
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
      env: { WRANGLER_SEND_METRICS: 'false' },
    },
  ],
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
