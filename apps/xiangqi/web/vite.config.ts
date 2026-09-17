import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';
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
 * xq-005: local play and the computer, offline. The site address, SEO (xq-010), family links (xq-009) and
 * online play (xq-007) come later.
 */
export default defineConfig({
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
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
  server: { port: 5176 },
  preview: { port: 4176 },
  test: { include: ['src/**/*.test.{ts,tsx}'] },
});
