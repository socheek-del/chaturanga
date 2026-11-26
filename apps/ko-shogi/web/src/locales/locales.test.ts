import { describeLocales } from '@chaturanga/game-shell/testing';
import { PRODUCT } from '../../product.config';
import en from './en.json';

const sources = import.meta.glob(['../**/*.{ts,tsx}', '!../**/*.test.{ts,tsx}'], {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>;

describeLocales(PRODUCT, { en }, sources);
