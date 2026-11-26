import type { ProductConfig } from '@chaturanga/game-shell';

export const PRODUCT = {
  id: 'ko-shogi',
  locales: ['en'],
  defaultLocale: 'en',
  languageNames: { en: 'English' },
  ogLocales: { en: 'en_US' },
  fonts: ['Literata', 'IBM Plex Sans', 'Georgia', 'sans-serif'],
  storagePrefix: 'ko-shogi.',
} as const satisfies ProductConfig<'en'>;
