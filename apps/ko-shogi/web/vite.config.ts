import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';
import { PRODUCT } from './product.config';

const worker = 'http://127.0.0.1:8794';

export default defineConfig({
  define: { __SITE_URL__: JSON.stringify(process.env.KO_SHOGI_SITE_URL ?? '') },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'fonts/*.woff2'],
      manifest: {
        id: '/',
        name: 'Ko Shogi · Field Atlas',
        short_name: 'Ko Shogi',
        description: 'Learn the reconstructed Ko Shogi rules and play on a nineteen by nineteen board.',
        lang: PRODUCT.defaultLocale,
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#ede6d8',
        theme_color: '#ede6d8',
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
  server: { port: 5231, proxy: { '/api': worker, '/ws': { target: worker, ws: true } } },
  preview: { port: 4231, proxy: { '/api': worker, '/ws': { target: worker, ws: true } } },
  test: { include: ['src/**/*.test.{ts,tsx}'], environment: 'happy-dom' },
});
