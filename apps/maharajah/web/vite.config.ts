import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';
import { familyLinks } from '../../../packages/family/src/sites';
import { SITE_URL } from './site.config';

const worker = 'http://127.0.0.1:8796';

export default defineConfig({
  define: { __FAMILY__: JSON.stringify(familyLinks('maharajah')) },
  plugins: [
    react(),
    tailwindcss(),
    { name: 'maharajah-site', transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', SITE_URL) },
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        id: '/',
        name: 'Maharajah and the Sepoys',
        short_name: 'Maharajah',
        description: 'Play a lone Maharajah against a full chess army.',
        lang: 'en',
        start_url: '/',
        display: 'standalone',
        background_color: '#17312e',
        theme_color: '#17312e',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: { navigateFallbackDenylist: [/^\/api\//, /^\/ws\//] },
    }),
  ],
  server: { port: 5196, proxy: { '/api': worker, '/ws': { target: worker, ws: true } } },
  test: { include: ['src/**/*.test.ts'] },
});
