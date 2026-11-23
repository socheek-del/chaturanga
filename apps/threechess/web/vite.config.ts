import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';
import { familyLinks } from '../../../packages/family/src/sites';
import { PRODUCT } from './product.config';
import { SITE_URL } from './site.config';
import { buildRobots, buildSitemap } from './src/features/seo/sitemap';

function productHtml(): Plugin {
  const files: Record<string, { type: string; body: () => string }> = {
    '/robots.txt': { type: 'text/plain; charset=utf-8', body: () => buildRobots(SITE_URL) },
    '/sitemap.xml': { type: 'application/xml; charset=utf-8', body: () => buildSitemap(SITE_URL) },
  };
  const serve = (server: {
    middlewares: { use: (fn: (req: { url?: string }, res: import('node:http').ServerResponse, next: () => void) => void) => unknown };
  }): void => {
    server.middlewares.use((req, res, next) => {
      const file = files[(req.url ?? '').split('?')[0]!];
      if (!file) return next();
      res.setHeader('content-type', file.type);
      res.end(file.body());
    });
  };
  return {
    name: 'threechess-product-html',
    transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', SITE_URL).replaceAll('%DEFAULT_LOCALE%', PRODUCT.defaultLocale),
    configureServer: serve,
    configurePreviewServer: serve,
    generateBundle() {
      for (const [path, file] of Object.entries(files)) this.emitFile({ type: 'asset', fileName: path.slice(1), source: file.body() });
    },
  };
}

export default defineConfig({
  define: { __SITE_URL__: JSON.stringify(SITE_URL), __FAMILY__: JSON.stringify(familyLinks('threechess')) },
  plugins: [
    react(),
    tailwindcss(),
    productHtml(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'og-image.svg'],
      manifest: {
        id: '/',
        name: 'Three-player chess',
        short_name: 'Three chess',
        description: 'Three armies on one shared ring. Play with friends on one screen.',
        lang: 'en',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#111b25',
        theme_color: '#111b25',
        categories: ['games', 'strategy'],
        icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/robots\.txt$/, /^\/sitemap\.xml$/],
        maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
      },
    }),
  ],
  server: { port: 5193, proxy: { '/api': 'http://127.0.0.1:8793' } },
  preview: { port: 4193 },
  test: { include: ['src/**/*.test.{ts,tsx}'] },
});
