import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';
import { familyLinks } from '../../../packages/family/src/sites';
import { PRODUCT } from './product.config';
import { SITE_URL } from './site.config';

function productHtml(): Plugin {
  const robots = `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`;
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${SITE_URL}/</loc></url></urlset>`;
  const files: Record<string, { type: string; body: string }> = {
    '/robots.txt': { type: 'text/plain; charset=utf-8', body: robots },
    '/sitemap.xml': { type: 'application/xml; charset=utf-8', body: sitemap },
  };
  const serve = (server: { middlewares: { use: (fn: (req: { url?: string }, res: import('node:http').ServerResponse, next: () => void) => void) => unknown } }): void => {
    server.middlewares.use((req, res, next) => {
      const file = files[(req.url ?? '').split('?')[0]!];
      if (!file) return next();
      res.setHeader('content-type', file.type);
      res.end(file.body);
    });
  };
  return {
    name: 'chaturaji-product-html',
    transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', SITE_URL).replaceAll('%DEFAULT_LOCALE%', PRODUCT.defaultLocale),
    configureServer: serve,
    configurePreviewServer: serve,
    generateBundle() {
      for (const [path, file] of Object.entries(files)) this.emitFile({ type: 'asset', fileName: path.slice(1), source: file.body });
    },
  };
}

export default defineConfig({
  define: { __SITE_URL__: JSON.stringify(SITE_URL), __FAMILY__: JSON.stringify(familyLinks('chaturaji')) },
  plugins: [
    react(),
    tailwindcss(),
    productHtml(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: true },
      includeAssets: ['favicon.svg', 'og-image.svg'],
      manifest: {
        id: '/', name: 'Chaturaji', short_name: 'Chaturaji',
        description: 'Learn and play a four-player dice reconstruction of Chaturaji.',
        lang: 'en', start_url: '/', scope: '/', display: 'standalone', orientation: 'portrait',
        background_color: '#f1e8d5', theme_color: '#17211f', categories: ['games', 'strategy'],
        icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/ws\//, /^\/robots\.txt$/, /^\/sitemap\.xml$/],
        maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
      },
    }),
  ],
  server: { port: 5195, proxy: { '/api': 'http://127.0.0.1:8795', '/ws': { target: 'http://127.0.0.1:8795', ws: true } } },
  preview: { port: 4195 },
  test: { include: ['src/**/*.test.{ts,tsx}'] },
});
