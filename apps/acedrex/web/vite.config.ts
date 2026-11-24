import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';
import { GAMES } from '../../../packages/family/src/games';
import { SITES } from '../../../packages/family/src/sites';
import { SITE_URL } from './site.config';

const worker = 'http://127.0.0.1:8798';

export default defineConfig({
  define: { __FAMILY__: JSON.stringify(GAMES.filter((game) => String(game.id) !== 'acedrex').map((game) => ({ ...game, ...SITES[game.id] }))) },
  plugins: [
    react(),
    tailwindcss(),
    { name: 'acedrex-site', transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', SITE_URL) },
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        id: '/',
        name: 'Grande Acedrex',
        short_name: 'Acedrex',
        description: 'Play and learn the medieval twelve-by-twelve game.',
        lang: 'en',
        start_url: '/',
        display: 'standalone',
        background_color: '#29241f',
        theme_color: '#29241f',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: { navigateFallbackDenylist: [/^\/api\//, /^\/ws\//] },
    }),
  ],
  server: { port: 5198, proxy: { '/api': worker, '/ws': { target: worker, ws: true } } },
  test: { include: ['src/**/*.test.ts'] },
});
