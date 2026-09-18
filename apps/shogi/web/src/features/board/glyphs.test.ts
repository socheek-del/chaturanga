import { describe, expect, it } from 'vitest';
import { GOTE_KING_GLYPH, PIECE_GLYPHS } from './glyphs';

describe('piece glyphs (sg-004)', () => {
  it('draws the kanji of owner decision D4 for every piece and every promoted face', () => {
    const types = ['k', 'r', 'b', 'g', 's', 'n', 'l', 'p'] as const;
    expect(types.map((t) => PIECE_GLYPHS[t].plain.char).join('')).toBe('王飛角金銀桂香歩');
    expect(types.map((t) => PIECE_GLYPHS[t].promoted?.char ?? '').join('')).toBe('龍馬全圭杏と');
    expect(GOTE_KING_GLYPH.char).toBe('玉');
  });

  it('has an outline for every face, inside the 100x100 box', () => {
    const paths = [
      ...Object.values(PIECE_GLYPHS).flatMap((g) => [g.plain.d, g.promoted?.d]),
      GOTE_KING_GLYPH.d,
    ].filter(Boolean) as string[];
    expect(paths).toHaveLength(15);
    for (const d of paths) {
      expect(d).toMatch(/^M/);
      const numbers = d.match(/-?\d+(\.\d+)?/g)!.map(Number);
      expect(Math.min(...numbers)).toBeGreaterThanOrEqual(0);
      expect(Math.max(...numbers)).toBeLessThanOrEqual(100);
    }
  });
});
