import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';
import { familyLinks } from '../../../packages/family/src/sites';
import { SITE_URL } from './site.config';

const worker = 'http://127.0.0.1:8794';

export default defineConfig({
  define: { __FAMILY__: JSON.stringify(familyLinks('shatranj')) },
  plugins: [
    react(),
    tailwindcss(),
    { name: 'shatranj-site', transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', SITE_URL) },
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        id: '/',
        name: 'Shatranj',
        short_name: 'Shatranj',
        description: 'Play and learn the classical Persian and Arabic chess game.',
        lang: 'en',
        start_url: '/',
        display: 'standalone',
        background_color: '#192320',
        theme_color: '#192320',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: { navigateFallbackDenylist: [/^\/api\//, /^\/ws\//] },
    }),
  ],
  server: { port: 5194, proxy: { '/api': worker, '/ws': { target: worker, ws: true } } },
  test: { include: ['src/**/*.test.ts'] },
});
