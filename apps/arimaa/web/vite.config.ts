import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';
import { PRODUCT } from './product.config';
import { SITE_URL } from './site.config';

const robots = () => `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`;
const sitemap = () => `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${SITE_URL}/</loc></url><url><loc>${SITE_URL}/learn</loc></url></urlset>`;

function productHtml(): Plugin {
  const files: Record<string, { type: string; body: () => string }> = {
    '/robots.txt': { type: 'text/plain; charset=utf-8', body: robots },
    '/sitemap.xml': { type: 'application/xml; charset=utf-8', body: sitemap },
  };
  const serve = (server: {
    middlewares: {
      use: (fn: (req: { url?: string }, res: import('node:http').ServerResponse, next: () => void) => void) => unknown;
    };
  }): void => {
    server.middlewares.use((req, res, next) => {
      const file = files[(req.url ?? '').split('?')[0]!];
      if (!file) return next();
      res.setHeader('content-type', file.type);
      res.end(file.body());
    });
  };
  return {
    name: 'arimaa-product-html',
    transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', SITE_URL),
    configureServer: serve,
    configurePreviewServer: serve,
    generateBundle() {
      for (const [path, file] of Object.entries(files)) this.emitFile({ type: 'asset', fileName: path.slice(1), source: file.body() });
    },
  };
}

export default defineConfig({
  define: { __SITE_URL__: JSON.stringify(SITE_URL) },
  plugins: [
    react(),
    tailwindcss(),
    productHtml(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'og-image.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'fonts/ibm-plex-sans-latin.woff2'],
      manifest: {
        id: '/',
        name: 'Arimaa · The Field Manual',
        short_name: 'Arimaa',
        description: 'Learn standard Arimaa and play a bot or another person.',
        lang: PRODUCT.defaultLocale,
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f1ede3',
        theme_color: '#a9472f',
        categories: ['games', 'education', 'strategy'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest,woff,woff2,txt}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/ws\//, /^\/robots\.txt$/, /^\/sitemap\.xml$/],
      },
    }),
  ],
  server: {
    port: 5207,
    proxy: {
      '/api': { target: 'http://127.0.0.1:8817' },
      '/ws': { target: 'http://127.0.0.1:8817', ws: true },
    },
  },
  preview: { port: 4207 },
  test: { include: ['src/**/*.test.{ts,tsx}'] },
});
