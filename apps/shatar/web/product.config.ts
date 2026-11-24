import type { ProductConfig } from '@chaturanga/game-shell';

export const PRODUCT = {
  id: 'shatar',
  locales: ['en'],
  defaultLocale: 'en',
  languageNames: { en: 'English' },
  ogLocales: { en: 'en_US' },
  fonts: ['Baskerville', 'Georgia'],
  storagePrefix: 'shatar.',
} as const satisfies ProductConfig<'en'>;
