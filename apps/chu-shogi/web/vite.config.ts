import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';
import { PRODUCT } from './product.config';

export default defineConfig({
  define: { __SITE_URL__: JSON.stringify(process.env.CHU_SHOGI_SITE_URL ?? '') },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        id: '/',
        name: 'Chu Shogi · The Meridian Table',
        short_name: 'Chu Shogi',
        description: 'Learn Chu Shogi and play on a measured 12 by 12 board.',
        lang: PRODUCT.defaultLocale,
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#f4f0e7',
        theme_color: '#24565a',
        categories: ['games', 'education', 'strategy'],
        icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest,woff,woff2,txt}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/ws\//],
      },
    }),
  ],
  server: { port: 5207, proxy: { '/api': 'http://127.0.0.1:8819', '/ws': { target: 'ws://127.0.0.1:8819', ws: true } } },
  preview: { port: 4207, proxy: { '/api': 'http://127.0.0.1:8819', '/ws': { target: 'ws://127.0.0.1:8819', ws: true } } },
  test: { include: ['src/**/*.test.{ts,tsx}'] },
});
