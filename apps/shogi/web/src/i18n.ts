import { localeFromSearch } from '@chaturanga/game-shell';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { type Language, PRODUCT } from '../product.config';
import en from './locales/en.json';
import ja from './locales/ja.json';
import { useSettings } from './stores/settings';

/** One dictionary per language declared in product.config.ts. */
export const resources: Record<Language, { translation: object }> = {
  ja: { translation: ja },
  en: { translation: en },
};

// `?lang=en` (used by shared links) selects the language and remembers it.
const fromUrl = localeFromSearch(PRODUCT, window.location.search);
if (fromUrl && fromUrl !== useSettings.getState().language) useSettings.getState().update({ language: fromUrl });

const initial = useSettings.getState().language;

void i18n.use(initReactI18next).init({
  resources,
  lng: initial,
  fallbackLng: PRODUCT.defaultLocale,
  interpolation: { escapeValue: false },
});

document.documentElement.lang = initial;
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
});

// The settings store is the source of truth for the UI language.
useSettings.subscribe((state, previous) => {
  if (state.language !== previous.language) void i18n.changeLanguage(state.language);
});

export default i18n;
