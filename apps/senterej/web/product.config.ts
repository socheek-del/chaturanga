import type { ProductConfig } from '@chaturanga/game-shell';

export const PRODUCT = {
  id: 'senterej',
  locales: ['en'],
  defaultLocale: 'en',
  languageNames: { en: 'English' },
  ogLocales: { en: 'en_US' },
  fonts: ['Georgia', 'Noto Sans'],
  storagePrefix: 'senterej.',
} as const satisfies ProductConfig<'en'>;
