import { defineConfig, devices } from '@playwright/test';

const PORT = 4177;

/** sg-005: service workers only exist in production builds, so these tests run against `vite preview`. */
export default defineConfig({
  testDir: './e2e-pwa',
  outputDir: './test-results-pwa',
  reporter: [['list']],
  use: { baseURL: `http://127.0.0.1:${PORT}`, trace: 'retain-on-failure' },
  webServer: {
    command: `npx vite build && npx vite preview --port ${PORT} --strictPort --host 127.0.0.1`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
