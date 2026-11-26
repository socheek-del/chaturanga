import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';
import { familyLinks } from '../../../packages/family/src/sites';
import { SITE_URL } from './site.config';

const worker = 'http://127.0.0.1:8809';

export default defineConfig({
  define: { __FAMILY__: JSON.stringify(familyLinks('hiashatar')) },
  plugins: [
    react(),
    tailwindcss(),
    { name: 'hiashatar-site', transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', SITE_URL) },
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        id: '/',
        name: 'Hiashatar',
        short_name: 'Hiashatar',
        description: 'Learn and play Mongolian chess with bodyguards.',
        lang: 'en',
        start_url: '/',
        display: 'standalone',
        background_color: '#182c37',
        theme_color: '#182c37',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: { navigateFallbackDenylist: [/^\/api\//, /^\/ws\//] },
    }),
  ],
  server: { port: 5209, proxy: { '/api': worker, '/ws': { target: worker, ws: true } } },
  test: { include: ['src/**/*.test.ts'] },
});
