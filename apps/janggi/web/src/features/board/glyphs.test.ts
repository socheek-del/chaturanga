import { describe, expect, it } from 'vitest';
import { HANGUL_GLYPHS, PIECE_GLYPHS } from './glyphs';

const TYPES = ['k', 'a', 'b', 'n', 'r', 'c', 'p'] as const;

describe('piece glyphs (jg-004)', () => {
  it('draws the characters of a real set, and their Hangul, for every type and colour', () => {
    const chars = (set: typeof PIECE_GLYPHS | typeof HANGUL_GLYPHS, color: 'w' | 'b') => TYPES.map((t) => set[color][t].char).join('');
    expect(chars(PIECE_GLYPHS, 'w')).toBe('楚士象馬車包卒');
    expect(chars(PIECE_GLYPHS, 'b')).toBe('漢士象馬車包兵');
    expect(chars(HANGUL_GLYPHS, 'w')).toBe('초사상마차포졸');
    expect(chars(HANGUL_GLYPHS, 'b')).toBe('한사상마차포병');
  });

  it('has an outline for every piece inside the 100x100 box', () => {
    for (const set of [PIECE_GLYPHS, HANGUL_GLYPHS]) {
      for (const color of ['w', 'b'] as const) {
        for (const { d } of Object.values(set[color])) {
          expect(d).toMatch(/^M/);
          const numbers = d.match(/-?\d+(\.\d+)?/g)!.map(Number);
          expect(Math.min(...numbers)).toBeGreaterThanOrEqual(0);
          expect(Math.max(...numbers)).toBeLessThanOrEqual(100);
        }
      }
    }
  });
});
