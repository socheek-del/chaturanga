import type { ProductConfig } from '@chaturanga/game-shell';

export type Language = 'en';

/** Congo is English-only at launch; each other language can be added with a complete rules tutorial. */
export const PRODUCT: ProductConfig<Language> = {
  id: 'congo',
  locales: ['en'],
  defaultLocale: 'en',
  languageNames: { en: 'English' },
  ogLocales: { en: 'en_US' },
  fonts: ['Noto Sans'],
  storagePrefix: 'congo.',
};
