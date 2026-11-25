import { describe, expect, it } from 'vitest';
import {
  BASE_PIECE_TYPES,
  BOARD_CELLS,
  BOARD_SIZE,
  FILES,
  RANKS,
  STARTING_PIECES,
  coordinateOf,
  squareAt,
  squareName,
} from './layout';

describe('Chu Shogi layout', () => {
  it('uses all 144 coordinates on a 12×12 board', () => {
    expect(FILES).toBe(12);
    expect(RANKS).toBe(12);
    expect(BOARD_SIZE).toBe(144);
    expect(BOARD_CELLS).toEqual(Array.from({ length: 144 }, (_, square) => square));
    expect(squareAt(0, 1)).toBe(0);
    expect(squareName(squareAt(11, 12))).toBe('l12');
    expect(coordinateOf(squareAt(8, 10))).toEqual({ file: 8, rank: 10 });
  });

  it('sets up 46 pieces per side in the published mirrored formation', () => {
    const white = STARTING_PIECES.filter((piece) => piece.color === 'w');
    const black = STARTING_PIECES.filter((piece) => piece.color === 'b');
    expect(white).toHaveLength(46);
    expect(black).toHaveLength(46);
    expect(new Set(STARTING_PIECES.map(({ square }) => square)).size).toBe(92);

    const expected = new Map(white.map(({ square, type }) => [square, type]));
    const actualBlack = new Map(black.map(({ square, type }) => [square, type]));
    for (const [square, type] of expected) {
      const { file, rank } = coordinateOf(square);
      expect(actualBlack.get(squareAt(FILES - 1 - file, RANKS + 1 - rank))).toBe(type);
    }

    for (const rank of [6, 7]) {
      for (let file = 0; file < FILES; file++) {
        expect(STARTING_PIECES.some((piece) => piece.square === squareAt(file, rank))).toBe(false);
      }
    }
  });

  it('places twelve Pawns and two Go-Betweens for each side', () => {
    for (const color of ['w', 'b'] as const) {
      const pieces = STARTING_PIECES.filter((piece) => piece.color === color);
      expect(pieces.filter((piece) => piece.type === 'pawn')).toHaveLength(12);
      expect(pieces.filter((piece) => piece.type === 'go-between')).toHaveLength(2);
    }
    expect(STARTING_PIECES).toHaveLength(92);
    expect(BASE_PIECE_TYPES).toHaveLength(21);
  });

  it('rejects coordinates outside the board', () => {
    expect(() => squareAt(-1, 1)).toThrow(RangeError);
    expect(() => squareAt(12, 1)).toThrow(RangeError);
    expect(() => squareAt(0, 0)).toThrow(RangeError);
    expect(() => coordinateOf(-1)).toThrow(RangeError);
    expect(() => coordinateOf(BOARD_SIZE)).toThrow(RangeError);
  });
});
