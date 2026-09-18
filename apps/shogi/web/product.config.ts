import type { ProductConfig } from '@chaturanga/game-shell';

export type Language = 'ja' | 'en';

/**
 * Shogi's languages, fonts and browser storage identity (owner decisions D1, D2, D9). Japanese is the
 * default language; English is at `?lang=en`. Japanese text uses the system font stack, so no Japanese font
 * file is ever downloaded; Noto Sans is self-hosted for Latin text, and the piece kanji are SVG paths.
 */
export const PRODUCT: ProductConfig<Language> = {
  id: 'shogi',
  locales: ['ja', 'en'],
  defaultLocale: 'ja',
  languageNames: { ja: '日本語', en: 'English' },
  ogLocales: { ja: 'ja_JP', en: 'en_US' },
  fonts: ['Noto Sans'],
  storagePrefix: 'shogi.',
};
