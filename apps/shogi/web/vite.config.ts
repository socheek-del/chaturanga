import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';
// Relative path on purpose: Vite bundles a config's relative imports, not workspace packages.
import { familyLinks } from '../../../packages/family/src/sites';
import { PRODUCT } from './product.config';
import { SITE_URL } from './site.config';
import { buildRobots, buildSitemap } from './src/features/seo/sitemap';

/**
 * sg-010: puts the configured site address and the product's languages and settings key into index.html,
 * and serves and emits robots.txt and sitemap.xml.
 */
function productHtml(): Plugin {
  const files: Record<string, { type: string; body: () => string }> = {
    '/robots.txt': { type: 'text/plain; charset=utf-8', body: () => buildRobots(SITE_URL) },
    '/sitemap.xml': { type: 'application/xml; charset=utf-8', body: () => buildSitemap(SITE_URL) },
  };
  // Must return nothing: Vite treats a function returned from configureServer as a post-middleware hook.
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
    name: 'product-html',
    transformIndexHtml: (html) =>
      html
        .replaceAll('%SITE_URL%', SITE_URL)
        .replaceAll('%DEFAULT_LOCALE%', PRODUCT.defaultLocale)
        .replaceAll('%LOCALES_JSON%', JSON.stringify(PRODUCT.locales))
        .replaceAll('%SETTINGS_KEY%', `${PRODUCT.storagePrefix}settings`),
    configureServer: serve,
    configurePreviewServer: serve,
    generateBundle() {
      for (const [path, file] of Object.entries(files)) {
        this.emitFile({ type: 'asset', fileName: path.slice(1), source: file.body() });
      }
    },
  };
}

/**
 * Local play, the computer and lessons work offline; online play (sg-007) needs the Worker. SEO (sg-010)
 * comes later.
 */
export default defineConfig({
  define: { __SITE_URL__: JSON.stringify(SITE_URL), __FAMILY__: JSON.stringify(familyLinks('shogi')) },
  plugins: [
    react(),
    tailwindcss(),
    productHtml(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        id: '/',
        name: '将棋 · Shogi',
        short_name: '将棋',
        description: '将棋 — Learn and play Shogi, Japanese chess',
        lang: PRODUCT.defaultLocale,
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f6efe1',
        theme_color: '#2a2419',
        categories: ['games', 'education'],
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/ws\//, /^\/robots\.txt$/, /^\/sitemap\.xml$/],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
  // Online play needs the Shogi Worker (wrangler dev on :8790; Makruk :8787, Sittuyin :8788, Xiangqi :8789).
  server: {
    port: 5177,
    proxy: { '/api': 'http://127.0.0.1:8790', '/ws': { target: 'ws://127.0.0.1:8790', ws: true } },
  },
  preview: {
    port: 4177,
    proxy: { '/api': 'http://127.0.0.1:8790', '/ws': { target: 'ws://127.0.0.1:8790', ws: true } },
  },
  test: { include: ['src/**/*.test.{ts,tsx}'] },
});
