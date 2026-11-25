import type { ProductConfig } from '@chaturanga/game-shell';

export const PRODUCT = {
  id: 'dameo',
  locales: ['en'],
  defaultLocale: 'en',
  languageNames: { en: 'English' },
  ogLocales: { en: 'en_US' },
  fonts: ['Noto Sans', 'Iowan Old Style', 'Palatino Linotype', 'Palatino', 'Georgia'],
  storagePrefix: 'dameo.',
} as const satisfies ProductConfig<'en'>;
