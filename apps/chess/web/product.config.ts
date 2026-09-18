import type { ProductConfig } from '@chaturanga/game-shell';

export type Language = 'en';

/**
 * Chess's languages, fonts and browser storage identity (owner decisions D1, D2, D9). English only at
 * launch: chess has no single home language, and every language a product declares becomes a family
 * language that needs a name for every game in packages/family. A second language is ch-011.
 */
export const PRODUCT: ProductConfig<Language> = {
  id: 'chess',
  locales: ['en'],
  defaultLocale: 'en',
  languageNames: { en: 'English' },
  ogLocales: { en: 'en_US' },
  fonts: ['Noto Sans'],
  storagePrefix: 'chess.',
};
