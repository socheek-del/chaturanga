import type { ProductConfig } from '@chaturanga/game-shell';

export const PRODUCT = {
  id: 'infinite-chess',
  locales: ['en'],
  defaultLocale: 'en',
  languageNames: { en: 'English' },
  ogLocales: { en: 'en_US' },
  fonts: ['Open Plane Serif', 'Open Plane Sans'],
  storagePrefix: 'infinite-chess.',
} as const satisfies ProductConfig<'en'>;
