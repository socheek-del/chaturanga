import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';
import { GAMES } from '../../../packages/family/src/games';
import { SITES } from '../../../packages/family/src/sites';
import { SITE_URL } from './site.config';

const worker = 'http://127.0.0.1:8797';

export default defineConfig({
  define: { __FAMILY__: JSON.stringify(GAMES.filter((game) => String(game.id) !== 'courier').map((game) => ({ ...game, ...SITES[game.id] }))) },
  plugins: [
    react(),
    tailwindcss(),
    { name: 'courier-site', transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', SITE_URL) },
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        id: '/',
        name: 'Courier Chess',
        short_name: 'Courier',
        description: 'Play and learn the medieval twelve-file game.',
        lang: 'en',
        start_url: '/',
        display: 'standalone',
        background_color: '#20203b',
        theme_color: '#20203b',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: { navigateFallbackDenylist: [/^\/api\//, /^\/ws\//] },
    }),
  ],
  server: { port: 5197, proxy: { '/api': worker, '/ws': { target: worker, ws: true } } },
  test: { include: ['src/**/*.test.ts'] },
});
