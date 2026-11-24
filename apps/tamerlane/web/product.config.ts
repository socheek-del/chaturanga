import type { ProductConfig } from '@chaturanga/game-shell';

export const PRODUCT = {
  id: 'tamerlane',
  locales: ['en'],
  defaultLocale: 'en',
  languageNames: { en: 'English' },
  ogLocales: { en: 'en_US' },
  fonts: ['Baskerville', 'Georgia'],
  storagePrefix: 'tamerlane.',
} as const satisfies ProductConfig<'en'>;
