import type { ProductConfig } from '@chaturanga/game-shell';

export const PRODUCT = {
  id: 'hiashatar',
  locales: ['en'],
  defaultLocale: 'en',
  languageNames: { en: 'English' },
  ogLocales: { en: 'en_US' },
  fonts: ['Palatino Linotype', 'Palatino', 'Georgia'],
  storagePrefix: 'hiashatar.',
} as const satisfies ProductConfig<'en'>;
