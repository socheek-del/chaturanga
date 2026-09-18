/**
 * robots.txt and sitemap.xml, generated from the configured site address at build time (see site.config.ts)
 * in every language declared in product.config.ts. Imported by vite.config.ts, so it must not import
 * workspace packages at runtime.
 */
import { type Language, PRODUCT } from '../../../product.config';

/** Public, indexable pages; each is listed in every language (default language at the plain URL). */
export const INDEXED_PAGES: ReadonlyArray<{ path: string; priority: number }> = [
  { path: '/', priority: 1.0 },
  { path: '/play/computer', priority: 0.9 },
  { path: '/play/online', priority: 0.9 },
  { path: '/learn', priority: 0.8 },
  { path: '/play/local', priority: 0.7 },
  { path: '/about', priority: 0.5 },
];

export function buildRobots(siteUrl: string): string {
  return ['User-agent: *', 'Allow: /', 'Disallow: /api/', 'Disallow: /ws/', 'Disallow: /design', '', `Sitemap: ${siteUrl}/sitemap.xml`, ''].join('\n');
}

export function buildSitemap(siteUrl: string): string {
  const url = (path: string, lang: Language) => `${siteUrl}${path}${lang === PRODUCT.defaultLocale ? '' : `?lang=${lang}`}`;
  const entries = INDEXED_PAGES.flatMap(({ path, priority }) => {
    const alternates = [
      ...PRODUCT.locales.map((lang) => `    <xhtml:link rel="alternate" hreflang="${lang}" href="${url(path, lang)}" />`),
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${url(path, PRODUCT.defaultLocale)}" />`,
    ].join('\n');
    return PRODUCT.locales.map(
      (lang) => `  <url>
    <loc>${url(path, lang)}</loc>
${alternates}
    <priority>${priority.toFixed(1)}</priority>
  </url>`,
    );
  });
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>
`;
}
