import type { ProductConfig } from '@chaturanga/game-shell';

export const PRODUCT = {
  id: 'chu-shogi',
  locales: ['en'],
  defaultLocale: 'en',
  languageNames: { en: 'English' },
  ogLocales: { en: 'en_US' },
  fonts: ['Baskerville', 'Avenir Next', 'Georgia', 'sans-serif'],
  storagePrefix: 'chu-shogi.',
} as const satisfies ProductConfig<'en'>;
