import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e-pwa',
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:4196', trace: 'retain-on-failure', ...devices['Desktop Chrome'] },
  webServer: {
    command: 'npm run build && npm run preview -- --host 127.0.0.1',
    url: 'http://127.0.0.1:4196',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
