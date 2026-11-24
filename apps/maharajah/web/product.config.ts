import type { ProductConfig } from '@chaturanga/game-shell';

export const PRODUCT = {
  id: 'maharajah',
  locales: ['en'],
  defaultLocale: 'en',
  languageNames: { en: 'English' },
  ogLocales: { en: 'en_US' },
  fonts: ['Baskerville', 'Georgia'],
  storagePrefix: 'maharajah.',
} as const satisfies ProductConfig<'en'>;
