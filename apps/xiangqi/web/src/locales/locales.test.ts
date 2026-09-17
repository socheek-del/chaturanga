import { describeLocales } from '@chaturanga/game-shell/testing';
import { PRODUCT } from '../../product.config';
import en from './en.json';
import zhHans from './zh-Hans.json';

const sources = import.meta.glob(['../**/*.{ts,tsx}', '!../**/*.test.{ts,tsx}'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

// Every language Xiangqi declares is complete, and every literal t('key') in the source exists in both.
describeLocales(PRODUCT, { 'zh-Hans': zhHans, en }, sources);
