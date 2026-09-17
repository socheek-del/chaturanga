import { describe, expect, it } from 'vitest';
import en from './en.json';
import zhHans from './zh-Hans.json';

const keys = (value: unknown, prefix = ''): string[] =>
  value && typeof value === 'object'
    ? Object.entries(value).flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k))
    : [prefix];

describe('locales (xq-004)', () => {
  it('has the same keys in Simplified Chinese and English, none empty', () => {
    expect(keys(zhHans).sort()).toEqual(keys(en).sort());
    for (const dictionary of [zhHans, en]) {
      for (const key of keys(dictionary)) {
        const text = key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown>)[part], dictionary);
        expect(String(text).trim(), key).not.toBe('');
      }
    }
  });
});
