import type { ProductConfig } from '@chaturanga/game-shell';

export const PRODUCT = {
  id: 'rithmomachia',
  locales: ['en'],
  defaultLocale: 'en',
  languageNames: { en: 'English' },
  ogLocales: { en: 'en_US' },
  fonts: ['Literata', 'IBM Plex Sans', 'Georgia', 'sans-serif'],
  storagePrefix: 'rithmomachia.',
} as const satisfies ProductConfig<'en'>;
