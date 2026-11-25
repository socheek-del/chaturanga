import { defineConfig, devices } from '@playwright/test';

const PORT = 4194;

export default defineConfig({
  testDir: './e2e-pwa',
  outputDir: './test-results-pwa',
  reporter: [['list']],
  timeout: 90_000,
  use: { baseURL: `http://127.0.0.1:${PORT}`, trace: 'retain-on-failure' },
  webServer: {
    command: `npx vite build && npx vite preview --port ${PORT} --strictPort --host 127.0.0.1`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: false,
    timeout: 180_000,
    env: { XDG_CONFIG_HOME: '/private/tmp/fortress-vite-config' },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
