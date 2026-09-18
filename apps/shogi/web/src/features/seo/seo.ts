/**
 * sg-010: per-page title, description, canonical URL and language alternates for the Shogi site. The
 * head-tag writing and language URLs are shared (@chaturanga/game-shell); pages and languages are Shogi's.
 */
import {
  applySeo as applyProductSeo,
  localeFromSearch,
  localizedUrl as productUrl,
  type SeoTarget,
} from '@chaturanga/game-shell';
import { type Language, PRODUCT } from '../../../product.config';

/** From site.config.ts (injected by Vite) — never hardcode the domain elsewhere. */
export const SITE_URL: string = __SITE_URL__;

export type SeoPage = 'home' | 'computer' | 'online' | 'room' | 'local' | 'learn' | 'about' | 'settings';

export interface PageSeo extends SeoTarget {
  page: SeoPage;
}

export function pageSeo(pathname: string): PageSeo {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/') return { page: 'home', path, index: true };
  if (path === '/play/computer') return { page: 'computer', path, index: true };
  if (path === '/play/online') return { page: 'online', path, index: true };
  if (path.startsWith('/play/online/')) return { page: 'room', path: '/play/online', index: false };
  if (path === '/play/local') return { page: 'local', path, index: true };
  if (path === '/learn' || path.startsWith('/learn/') || path === '/play/guided') return { page: 'learn', path: '/learn', index: path === '/learn' };
  if (path === '/about') return { page: 'about', path, index: true };
  if (path === '/settings') return { page: 'settings', path, index: false };
  return { page: 'home', path: '/', index: false };
}

/** Japanese pages live at the plain URL (the default language); English at `?lang=en`. */
export function localizedUrl(path: string, language: Language): string {
  return productUrl(PRODUCT, SITE_URL, path, language);
}

/** Reads `?lang=ja|en` from a URL search string. */
export function languageFromSearch(search: string): Language | null {
  return localeFromSearch(PRODUCT, search);
}

export function applySeo(seo: PageSeo, language: Language, title: string, description: string): void {
  applyProductSeo(PRODUCT, SITE_URL, seo, language, title, description);
}
