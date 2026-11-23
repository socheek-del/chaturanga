import type { ProductConfig } from '@chaturanga/game-shell';

export type Language = 'ko' | 'en';

/**
 * Janggi's languages, fonts and browser storage identity. Korean is the default language; English is at
 * `?lang=en`. Korean text uses the system font, so no Korean font file is ever downloaded; Noto Sans is
 * self-hosted for Latin text.
 */
export const PRODUCT: ProductConfig<Language> = {
  id: 'janggi',
  locales: ['ko', 'en'],
  defaultLocale: 'ko',
  languageNames: { ko: '한국어', en: 'English' },
  ogLocales: { ko: 'ko_KR', en: 'en_US' },
  fonts: ['Noto Sans'],
  storagePrefix: 'janggi.',
};
