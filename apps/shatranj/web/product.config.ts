import type { ProductConfig } from '@chaturanga/game-shell';

export const PRODUCT = {
  id: 'shatranj',
  locales: ['en'],
  defaultLocale: 'en',
  languageNames: { en: 'English' },
  ogLocales: { en: 'en_US' },
  fonts: ['Georgia'],
  storagePrefix: 'shatranj.',
} as const satisfies ProductConfig<'en'>;
