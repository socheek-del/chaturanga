export function buildRobots(siteUrl: string): string {
  return `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`;
}

export function buildSitemap(siteUrl: string): string {
  const pages = ['', 'rules', 'tutorial'];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.map((page) => `<url><loc>${siteUrl}/${page}</loc></url>`).join('')}</urlset>`;
}
