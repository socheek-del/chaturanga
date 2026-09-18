import { defineConfig, devices } from '@playwright/test';

import { SITE_URL } from './site.config';

/**
 * Smoke test of the live site (xq-008). It starts no server: it drives the deployed Worker and assets at
 * the product's own address. Point it elsewhere with `XIANGQI_SITE_URL=https://staging.example npm run
 * smoke:prod -w apps/xiangqi/web`.
 */
export default defineConfig({
  testDir: './e2e-prod',
  outputDir: './test-results-prod',
  fullyParallel: false,
  reporter: [['list']],
  timeout: 90_000,
  use: { baseURL: SITE_URL, trace: 'off' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
