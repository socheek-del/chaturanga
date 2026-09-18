import { chess } from '@chaturanga/chess';
import { describe, expect, it } from 'vitest';
import { DEFAULT_PIECE_SET, isPieceSet, PIECE_SETS, TRADITIONAL_PIECES } from './pieceSets';
import { DEFAULT_SETTINGS } from '../../stores/settings';

describe('piece sets (ch-012)', () => {
  it('offers the traditional set and the site\u2019s own, with the traditional one as the default', () => {
    expect(PIECE_SETS).toEqual(['traditional', 'marble']);
    expect(DEFAULT_PIECE_SET).toBe('traditional');
    expect(DEFAULT_SETTINGS.pieceSet).toBe('traditional');
  });

  it('has traditional art for every piece type of both colours', () => {
    for (const color of ['w', 'b'] as const) {
      for (const type of chess.pieceTypes) {
        const art = TRADITIONAL_PIECES[color][type as keyof (typeof TRADITIONAL_PIECES)['w']];
        expect(art, `${color}${type}`).toBeTruthy();
      }
    }
  });

  it('draws each colour from its own file, so nothing is recoloured at render time', () => {
    for (const type of chess.pieceTypes) {
      const key = type as keyof (typeof TRADITIONAL_PIECES)['w'];
      expect(TRADITIONAL_PIECES.w[key]).not.toBe(TRADITIONAL_PIECES.b[key]);
    }
  });

  it('rejects a saved set that is not one of ours', () => {
    expect(isPieceSet('traditional')).toBe(true);
    expect(isPieceSet('staunton')).toBe(false);
    expect(isPieceSet(undefined)).toBe(false);
  });
});
