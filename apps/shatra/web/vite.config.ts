import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';
import { GAMES } from '../../../packages/family/src/games';
import { SITES } from '../../../packages/family/src/sites';
import { SITE_URL } from './site.config';

const worker = 'http://127.0.0.1:8810';

export default defineConfig({
  define: { __FAMILY__: JSON.stringify(GAMES.filter((game) => String(game.id) !== 'shatra').map((game) => ({ ...game, ...SITES[game.id] }))) },
  plugins: [
    react(),
    tailwindcss(),
    { name: 'shatra-site', transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', SITE_URL) },
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png', 'icon.svg'],
      manifest: {
        id: '/',
        name: 'Altai Shatra',
        short_name: 'Shatra',
        description: 'Learn and play the 62-field Altai tournament game.',
        lang: 'en',
        start_url: '/',
        display: 'standalone',
        background_color: '#e8dfcc',
        theme_color: '#263b3d',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: { navigateFallbackDenylist: [/^\/api\//, /^\/ws\//] },
    }),
  ],
  server: { port: 5210, proxy: { '/api': worker, '/ws': { target: worker, ws: true } } },
  test: { include: ['src/**/*.test.ts'] },
});
