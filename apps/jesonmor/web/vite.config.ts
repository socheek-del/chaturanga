import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';
import { familyLinks } from '../../../packages/family/src/sites';
import { PRODUCT } from './product.config';
import { SITE_URL } from './site.config';

const robots = () => `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`;
const sitemap = () =>
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${SITE_URL}/</loc></url><url><loc>${SITE_URL}/learn</loc></url></urlset>`;

function productHtml(): Plugin {
  const files: Record<string, { type: string; body: () => string }> = {
    '/robots.txt': { type: 'text/plain; charset=utf-8', body: robots },
    '/sitemap.xml': { type: 'application/xml; charset=utf-8', body: sitemap },
  };
  const serve = (server: {
    middlewares: {
      use: (
        fn: (req: { url?: string }, res: import('node:http').ServerResponse, next: () => void) => void,
      ) => unknown;
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
    name: 'jesonmor-product-html',
    transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', SITE_URL),
    configureServer: serve,
    configurePreviewServer: serve,
    generateBundle() {
      for (const [path, file] of Object.entries(files))
        this.emitFile({ type: 'asset', fileName: path.slice(1), source: file.body() });
    },
  };
}

export default defineConfig({
  define: { __SITE_URL__: JSON.stringify(SITE_URL), __FAMILY__: JSON.stringify(familyLinks('jesonmor')) },
  plugins: [
    react(),
    tailwindcss(),
    productHtml(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'og-image.svg'],
      manifest: {
        id: '/',
        name: 'Jeson Mor',
        short_name: 'Jeson Mor',
        description: 'Race to the center, survive the reply, and play Jeson Mor.',
        lang: PRODUCT.defaultLocale,
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#e9e3d8',
        theme_color: '#263a3a',
        categories: ['games', 'education', 'strategy'],
        icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2,webmanifest}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/ws\//, /^\/robots\.txt$/, /^\/sitemap\.xml$/],
      },
    }),
  ],
  server: {
    port: 5199,
    proxy: { '/api': 'http://127.0.0.1:8800', '/ws': { target: 'ws://127.0.0.1:8800', ws: true } },
  },
  preview: {
    port: 4199,
    proxy: { '/api': 'http://127.0.0.1:8800', '/ws': { target: 'ws://127.0.0.1:8800', ws: true } },
  },
  test: { include: ['src/**/*.test.{ts,tsx}'] },
});
