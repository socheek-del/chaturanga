import { describe, expect, it } from 'vitest';
import { PIECE_GLYPHS, RIVER_GLYPHS } from './glyphs';

describe('piece glyphs (xq-004)', () => {
  it('draws the traditional characters of owner decision D4 for every type and colour', () => {
    const chars = (color: 'w' | 'b') => (['k', 'a', 'b', 'n', 'r', 'c', 'p'] as const).map((t) => PIECE_GLYPHS[color][t].char).join('');
    expect(chars('w')).toBe('帥仕相傌俥炮兵');
    expect(chars('b')).toBe('將士象馬車砲卒');
  });

  it('has an outline for every piece and every river character, inside the 100x100 box', () => {
    const paths = [
      ...Object.values(PIECE_GLYPHS.w).map((g) => g.d),
      ...Object.values(PIECE_GLYPHS.b).map((g) => g.d),
      ...Object.values(RIVER_GLYPHS),
    ];
    expect(Object.keys(RIVER_GLYPHS).join('')).toBe('楚河漢界');
    for (const d of paths) {
      expect(d).toMatch(/^M/);
      const numbers = d.match(/-?\d+(\.\d+)?/g)!.map(Number);
      expect(Math.min(...numbers)).toBeGreaterThanOrEqual(0);
      expect(Math.max(...numbers)).toBeLessThanOrEqual(100);
    }
  });
});
