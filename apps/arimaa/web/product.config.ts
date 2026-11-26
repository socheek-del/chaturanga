import type { ProductConfig } from '@chaturanga/game-shell';

export const PRODUCT = {
  id: 'arimaa',
  locales: ['en'],
  defaultLocale: 'en',
  languageNames: { en: 'English' },
  ogLocales: { en: 'en_US' },
  fonts: ['Georgia', 'IBM Plex Sans', 'sans-serif'],
  storagePrefix: 'arimaa.',
} as const satisfies ProductConfig<'en'>;
