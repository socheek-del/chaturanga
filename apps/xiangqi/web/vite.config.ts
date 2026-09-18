import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';
// Relative path on purpose: Vite bundles a config's relative imports, not workspace packages.
import { familyLinks } from '../../../packages/family/src/sites';
import { PRODUCT } from './product.config';

/** Puts the product's languages and settings key into index.html (the pre-paint theme and language script). */
function productHtml(): Plugin {
  return {
    name: 'product-html',
    transformIndexHtml: (html) =>
      html
        .replaceAll('%DEFAULT_LOCALE%', PRODUCT.defaultLocale)
        .replaceAll('%LOCALES_JSON%', JSON.stringify(PRODUCT.locales))
        .replaceAll('%SETTINGS_KEY%', `${PRODUCT.storagePrefix}settings`),
  };
}

/**
 * Local play, the computer and lessons work offline; online play (xq-007) needs the Worker. SEO (xq-010)
 * comes later.
 */
export default defineConfig({
  define: { __FAMILY__: JSON.stringify(familyLinks('xiangqi')) },
  plugins: [
    react(),
    tailwindcss(),
    productHtml(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        id: '/',
        name: '象棋 · Xiangqi',
        short_name: '象棋',
        description: '象棋 — Learn and play Xiangqi, Chinese chess',
        lang: PRODUCT.defaultLocale,
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f5f0e6',
        theme_color: '#2a2622',
        categories: ['games', 'education'],
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/ws\//],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
  // Online play needs the Xiangqi Worker (wrangler dev on :8789; Makruk uses :8787, Sittuyin :8788).
  server: {
    port: 5176,
    proxy: { '/api': 'http://127.0.0.1:8789', '/ws': { target: 'ws://127.0.0.1:8789', ws: true } },
  },
  preview: {
    port: 4176,
    proxy: { '/api': 'http://127.0.0.1:8789', '/ws': { target: 'ws://127.0.0.1:8789', ws: true } },
  },
  test: { include: ['src/**/*.test.{ts,tsx}'] },
});
