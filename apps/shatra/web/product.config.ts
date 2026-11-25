import type { ProductConfig } from '@chaturanga/game-shell';

export const PRODUCT = {
  id: 'shatra',
  locales: ['en'],
  defaultLocale: 'en',
  languageNames: { en: 'English' },
  ogLocales: { en: 'en_US' },
  fonts: ['Georgia', 'Avenir Next'],
  storagePrefix: 'shatra.',
} as const satisfies ProductConfig<'en'>;
