import type { ProductConfig } from '@chaturanga/game-shell';

export const PRODUCT = {
  id: 'courier',
  locales: ['en'],
  defaultLocale: 'en',
  languageNames: { en: 'English' },
  ogLocales: { en: 'en_US' },
  fonts: ['Baskerville', 'Georgia'],
  storagePrefix: 'courier.',
} as const satisfies ProductConfig<'en'>;
