import { defineConfig } from 'vitest/config';
import { cloudflareTest } from '@cloudflare/vitest-plugin';

export default defineConfig({
  plugins: [cloudflareTest(() => ({
    wrangler: { configPath: './wrangler.jsonc' },
    miniflare: { bindings: { AUTH_SECRET: 'test-infinite-chess-secret', RECONNECT_GRACE_MS: '200' } },
  }))],
});
