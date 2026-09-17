import { localeFromSearch } from '@chaturanga/game-shell';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { type Language, PRODUCT } from '../product.config';
import en from './locales/en.json';
import zhHans from './locales/zh-Hans.json';

/** One dictionary per language declared in product.config.ts. */
export const resources: Record<Language, { translation: object }> = { 'zh-Hans': { translation: zhHans }, en: { translation: en } };

// The showcase has no settings yet (xq-005): `?lang=en` picks English, otherwise the default language.
const initial = localeFromSearch(PRODUCT, window.location.search) ?? PRODUCT.defaultLocale;

void i18n.use(initReactI18next).init({
  resources,
  lng: initial,
  fallbackLng: PRODUCT.defaultLocale,
  interpolation: { escapeValue: false },
});
document.documentElement.lang = initial;

export default i18n;
