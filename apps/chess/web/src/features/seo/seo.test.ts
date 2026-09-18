// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import en from '../../locales/en.json';
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
    expect(pageSeo('/learn/queen')).toEqual({ page: 'learn', path: '/learn', index: false });
    expect(pageSeo('/learn')).toEqual({ page: 'learn', path: '/learn', index: true });
    expect(pageSeo('/settings').index).toBe(false);
  });

  it('builds plain URLs for the default language and reads ?lang', () => {
    expect(localizedUrl('/learn', 'en')).toBe(`${SITE_URL}/learn`);
    expect(languageFromSearch('?lang=en')).toBe('en');
    expect(languageFromSearch('?lang=fr')).toBeNull();
  });

  it('every page has a title and description that name chess', () => {
    const pages: SeoPage[] = ['home', 'computer', 'online', 'room', 'local', 'learn', 'about', 'settings'];
    for (const page of pages) {
      expect(en.seo[page].title).toMatch(/Chess/);
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
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(`${SITE_URL}/play/online`);
    expect(document.head.querySelector('link[hreflang="en"]')?.getAttribute('href')).toBe(`${SITE_URL}/play/online`);
    applySeo(pageSeo('/'), 'en', 'T2', 'D2');
    expect(document.head.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
    expect(document.head.querySelector('meta[property="og:locale"]')?.getAttribute('content')).toBe('en_US');
  });

  it('generates robots.txt and a bilingual sitemap for any domain', () => {
    const site = 'https://example.org';
    expect(buildRobots(site)).toContain('Sitemap: https://example.org/sitemap.xml');
    const xml = buildSitemap(site);
    expect(xml.match(/<url>/g)).toHaveLength(INDEXED_PAGES.length);
    expect(xml).toContain('<loc>https://example.org/learn</loc>');
    expect(xml).toContain('hreflang="en" href="https://example.org/about"');
    expect(xml).not.toContain('beanroti');
  });
});
