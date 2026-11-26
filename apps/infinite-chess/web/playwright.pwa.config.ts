import { defineConfig, devices } from '@playwright/test';

const PORT = 4230;
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './e2e-pwa',
  outputDir: './test-results-pwa',
  reporter: [['list']],
  timeout: 90_000,
  use: { baseURL, trace: 'retain-on-failure' },
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort --host 127.0.0.1`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
