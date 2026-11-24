import type { ProductConfig } from '@chaturanga/game-shell';

export const PRODUCT = {
  id: 'chaturanga',
  locales: ['en'],
  defaultLocale: 'en',
  languageNames: { en: 'English' },
  ogLocales: { en: 'en_US' },
  fonts: ['Baskerville', 'Georgia'],
  storagePrefix: 'chaturanga.',
} as const satisfies ProductConfig<'en'>;
