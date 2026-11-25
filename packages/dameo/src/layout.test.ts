import { describe, expect, it } from 'vitest';
import {
  BLACK_SETUP,
  BOARD_CELLS,
  BOARD_SIZE,
  FILES,
  RANKS,
  WHITE_SETUP,
  squareAt,
  squareName,
} from './layout';

describe('Dameo standard 8×8 setup', () => {
  it('covers all 64 coordinates with reversible names', () => {
    expect(FILES).toBe(8);
    expect(RANKS).toBe(8);
    expect(BOARD_SIZE).toBe(64);
    expect(BOARD_CELLS).toHaveLength(64);
    expect(BOARD_CELLS.map(squareName)).toEqual(expect.arrayContaining(['a1', 'h1', 'a8', 'h8']));
    for (const square of BOARD_CELLS) expect(squareAt(squareName(square)[0]!, Number(squareName(square).slice(1)))).toBe(square);
  });

  it('places eighteen men per side in the 8+6+4 trapezoid', () => {
    expect(WHITE_SETUP.map(squareName)).toEqual([
      'a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1',
      'b2', 'c2', 'd2', 'e2', 'f2', 'g2',
      'c3', 'd3', 'e3', 'f3',
    ]);
    expect(BLACK_SETUP.map(squareName)).toEqual([
      'a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8',
      'b7', 'c7', 'd7', 'e7', 'f7', 'g7',
      'c6', 'd6', 'e6', 'f6',
    ]);
    expect(WHITE_SETUP).toHaveLength(18);
    expect(BLACK_SETUP).toHaveLength(18);
  });

  it('keeps the sides disjoint and vertically mirrored', () => {
    expect(WHITE_SETUP.some((square) => BLACK_SETUP.includes(square))).toBe(false);
    expect(WHITE_SETUP.map((sq) => squareName(sq)).map((name) => {
      const file = name[0]!;
      const rank = Number(name.slice(1));
      return squareName(squareAt(file, RANKS + 1 - rank));
    }).sort()).toEqual(BLACK_SETUP.map(squareName).sort());
  });

  it('leaves two full rows between the setups', () => {
    expect(WHITE_SETUP.every((square) => square < 3 * FILES)).toBe(true);
    expect(BLACK_SETUP.every((square) => square >= 5 * FILES)).toBe(true);
    expect(BOARD_CELLS.filter((square) => square >= 3 * FILES && square < 5 * FILES)).toHaveLength(16);
  });

  it('rejects invalid coordinates', () => {
    expect(() => squareAt('i', 1)).toThrow(RangeError);
    expect(() => squareAt('a', 0)).toThrow(RangeError);
    expect(() => squareAt('h', 9)).toThrow(RangeError);
    expect(() => squareName(-1)).toThrow(RangeError);
    expect(() => squareName(64)).toThrow(RangeError);
  });
});
