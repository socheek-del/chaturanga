import type { ProductConfig } from '@chaturanga/game-shell';

export type Language = 'zh-Hans' | 'en';

/**
 * Xiangqi's languages, fonts and browser storage identity (owner decisions D1, D2, D9). Simplified Chinese
 * is the default language; English is at `?lang=en`. Chinese text uses the system CJK font, so no CJK font
 * file is ever downloaded; Noto Sans is self-hosted for Latin text.
 */
export const PRODUCT: ProductConfig<Language> = {
  id: 'xiangqi',
  locales: ['zh-Hans', 'en'],
  defaultLocale: 'zh-Hans',
  languageNames: { 'zh-Hans': '简体中文', en: 'English' },
  ogLocales: { 'zh-Hans': 'zh_CN', en: 'en_US' },
  fonts: ['Noto Sans'],
  storagePrefix: 'xiangqi.',
};
