import { FEEDBACK_STRING_KEYS } from '@chaturanga/game-shell/ui';
import { describeLocales } from '@chaturanga/game-shell/testing';
import { describe, expect, it } from 'vitest';
import { PRODUCT } from '../../product.config';
import en from './en.json';

const sources = import.meta.glob(['../**/*.{ts,tsx}', '!../**/*.test.{ts,tsx}'], {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>;

describeLocales(PRODUCT, { en }, sources);

describe('Rithmomachia feedback locale', () => {
  it('supplies every string required by the feedback hub widget', () => {
    for (const key of FEEDBACK_STRING_KEYS) expect(en.feedback[key]).toBeTruthy();
  });
});
