import type { ProductConfig } from '@chaturanga/game-shell';

export type Language = 'en';

/** Suffragetto is English-only at launch; each added language must include the full rules tutorial. */
export const PRODUCT: ProductConfig<Language> = {
  id: 'suffragetto',
  locales: ['en'],
  defaultLocale: 'en',
  languageNames: { en: 'English' },
  ogLocales: { en: 'en_US' },
  fonts: ['Noto Sans'],
  storagePrefix: 'suffragetto.',
};
