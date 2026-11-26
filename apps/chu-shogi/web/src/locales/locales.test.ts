import { describeLocales } from '@chaturanga/game-shell/testing';
import { describe, expect, it } from 'vitest';
import { PRODUCT } from '../../product.config';
import en from './en.json';

const sources = import.meta.glob(['../**/*.{ts,tsx}', '!../**/*.test.{ts,tsx}'], {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>;

describeLocales(PRODUCT, { en }, sources);

describe('Chu Shogi locale content', () => {
  it('names every effective rank in the movement atlas', () => {
    const ranks = en.atlas.ranks as Record<string, { name: string; movement: string }>;
    expect(Object.keys(ranks)).toHaveLength(29);
    for (const rank of Object.values(ranks)) {
      expect(rank.name.trim()).not.toBe('');
      expect(rank.movement.trim()).not.toBe('');
    }
  });
});
