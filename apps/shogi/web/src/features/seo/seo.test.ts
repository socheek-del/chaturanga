// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import en from '../../locales/en.json';
import ja from '../../locales/ja.json';
import { SITE_URL as CONFIGURED } from '../../../site.config';
import { applySeo, languageFromSearch, localizedUrl, pageSeo, SITE_URL, type SeoPage } from './seo';
import { buildRobots, buildSitemap, INDEXED_PAGES } from './sitemap';

describe('seo', () => {
  it('takes the site address from site.config.ts', () => {
    expect(SITE_URL).toBe(CONFIGURED);
    expect(SITE_URL).toMatch(/^https:\/\/[^/]+$/);
  });

  it('maps routes to pages, canonical paths and indexing', () => {
    expect(pageSeo('/')).toEqual({ page: 'home', path: '/', index: true });
    expect(pageSeo('/play/computer/')).toEqual({ page: 'computer', path: '/play/computer', index: true });
    expect(pageSeo('/play/online/ABC234')).toEqual({ page: 'room', path: '/play/online', index: false });
    expect(pageSeo('/learn/gold')).toEqual({ page: 'learn', path: '/learn', index: false });
    expect(pageSeo('/learn')).toEqual({ page: 'learn', path: '/learn', index: true });
    expect(pageSeo('/settings').index).toBe(false);
  });

  it('builds Japanese URLs without a query and English URLs with ?lang=en', () => {
    expect(localizedUrl('/learn', 'ja')).toBe(`${SITE_URL}/learn`);
    expect(localizedUrl('/learn', 'en')).toBe(`${SITE_URL}/learn?lang=en`);
    expect(languageFromSearch('?lang=en')).toBe('en');
    expect(languageFromSearch('?lang=fr')).toBeNull();
  });

  it('every page has a title and description in both languages that name Shogi', () => {
    const pages: SeoPage[] = ['home', 'computer', 'online', 'room', 'local', 'learn', 'about', 'settings'];
    for (const page of pages) {
      expect(ja.seo[page].title).toMatch(/将棋/);
      expect(en.seo[page].title).toMatch(/Shogi|Japanese Chess/);
      expect(ja.seo[page].description.length).toBeGreaterThan(10);
      expect(en.seo[page].description.length).toBeGreaterThan(20);
    }
    expect(en.seo.home.title.length).toBeLessThanOrEqual(70);
    expect(en.seo.home.description.length).toBeLessThanOrEqual(170);
  });

  it('writes title, description, canonical, alternates and robots into the document head', () => {
    applySeo(pageSeo('/play/online/ABC234'), 'en', 'T', 'D');
    expect(document.title).toBe('T');
    expect(document.head.querySelector('meta[name="description"]')?.getAttribute('content')).toBe('D');
    expect(document.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex, follow');
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(`${SITE_URL}/play/online?lang=en`);
    expect(document.head.querySelector('link[hreflang="ja"]')?.getAttribute('href')).toBe(`${SITE_URL}/play/online`);
    applySeo(pageSeo('/'), 'ja', 'T2', 'D2');
    expect(document.head.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
    expect(document.head.querySelector('meta[property="og:locale"]')?.getAttribute('content')).toBe('ja_JP');
  });

  it('generates robots.txt and a bilingual sitemap for any domain', () => {
    const site = 'https://example.org';
    expect(buildRobots(site)).toContain('Sitemap: https://example.org/sitemap.xml');
    const xml = buildSitemap(site);
    expect(xml.match(/<url>/g)).toHaveLength(INDEXED_PAGES.length * 2);
    expect(xml).toContain('<loc>https://example.org/learn?lang=en</loc>');
    expect(xml).toContain('hreflang="ja" href="https://example.org/about"');
    expect(xml).not.toContain('beanroti');
  });
});
