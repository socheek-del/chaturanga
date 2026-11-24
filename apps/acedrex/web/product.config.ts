import type { ProductConfig } from '@chaturanga/game-shell';

export const PRODUCT = {
  id: 'acedrex',
  locales: ['en'],
  defaultLocale: 'en',
  languageNames: { en: 'English' },
  ogLocales: { en: 'en_US' },
  fonts: ['Baskerville', 'Georgia'],
  storagePrefix: 'acedrex.',
} as const satisfies ProductConfig<'en'>;
