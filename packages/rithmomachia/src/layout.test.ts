import { describe, expect, it } from 'vitest';
import {
  BLACK_SETUP,
  BOARD_CELLS,
  BOARD_SIZE,
  FILES,
  RANKS,
  STARTING_PIECES,
  WHITE_SETUP,
  coordinateOf,
  squareAt,
  squareName,
} from './layout';

function listing(pieces: typeof STARTING_PIECES): string[] {
  return pieces.map(({ square, color, shape, value }) => `${color}:${squareName(square)}:${shape}:${value}`).sort();
}

describe('Rithmomachia 8×16 board and source-derived setup', () => {
  it('names every cell reversibly, including two-digit ranks', () => {
    expect(FILES).toBe(8);
    expect(RANKS).toBe(16);
    expect(BOARD_SIZE).toBe(128);
    expect(BOARD_CELLS).toHaveLength(128);
    expect(squareName(squareAt('a', 1))).toBe('a1');
    expect(squareName(squareAt('h', 16))).toBe('h16');
    for (const target of BOARD_CELLS) {
      const { file, rank } = coordinateOf(target);
      expect(squareAt('abcdefgh'[file]!, rank)).toBe(target);
    }
  });

  it('records 24 cells per side with eight circles, eight triangles, seven squares and one pyramid', () => {
    expect(WHITE_SETUP).toHaveLength(24);
    expect(BLACK_SETUP).toHaveLength(24);
    for (const setup of [WHITE_SETUP, BLACK_SETUP]) {
      expect(setup.filter(({ shape }) => shape === 'circle')).toHaveLength(8);
      expect(setup.filter(({ shape }) => shape === 'triangle')).toHaveLength(8);
      expect(setup.filter(({ shape }) => shape === 'square')).toHaveLength(7);
      expect(setup.filter(({ shape }) => shape === 'pyramid')).toHaveLength(1);
    }
    expect(new Set(STARTING_PIECES.map(({ square }) => square)).size).toBe(48);
  });

  it('matches the even and odd number families and composite pyramid totals', () => {
    const whiteValues = (shape: string) => WHITE_SETUP.filter((piece) => piece.shape === shape).map(({ value }) => value).sort((a, b) => a - b);
    const blackValues = (shape: string) => BLACK_SETUP.filter((piece) => piece.shape === shape).map(({ value }) => value).sort((a, b) => a - b);
    expect(whiteValues('circle')).toEqual([2, 4, 4, 6, 8, 16, 36, 64]);
    expect(whiteValues('triangle')).toEqual([6, 9, 20, 25, 42, 49, 72, 81]);
    expect(whiteValues('square')).toEqual([15, 25, 45, 81, 153, 169, 289]);
    expect(blackValues('circle')).toEqual([3, 5, 7, 9, 9, 25, 49, 81]);
    expect(blackValues('triangle')).toEqual([12, 16, 30, 36, 56, 64, 90, 100]);
    expect(blackValues('square')).toEqual([28, 49, 66, 120, 121, 225, 361]);

    const whitePyramid = WHITE_SETUP.find(({ shape }) => shape === 'pyramid')!;
    const blackPyramid = BLACK_SETUP.find(({ shape }) => shape === 'pyramid')!;
    expect(whitePyramid.components?.map(({ value }) => value).reduce((a, b) => a + b, 0)).toBe(91);
    expect(blackPyramid.components?.map(({ value }) => value).reduce((a, b) => a + b, 0)).toBe(190);
  });

  it('matches the published occupied rows and asymmetric pyramid squares', () => {
    const white = listing(WHITE_SETUP);
    const black = listing(BLACK_SETUP);
    expect(white).toEqual([
      'w:a1:square:25', 'w:a2:square:15', 'w:a3:triangle:9',
      'w:b1:square:81', 'w:b2:square:45', 'w:b3:triangle:25',
      'w:c2:triangle:6', 'w:c3:circle:4', 'w:c4:circle:2',
      'w:d2:triangle:20', 'w:d3:circle:16', 'w:d4:circle:4',
      'w:e2:triangle:42', 'w:e3:circle:36', 'w:e4:circle:6',
      'w:f2:triangle:72', 'w:f3:circle:64', 'w:f4:circle:8',
      'w:g1:square:169', 'w:g2:pyramid:91', 'w:g3:triangle:49',
      'w:h1:square:289', 'w:h2:square:153', 'w:h3:triangle:81',
    ].sort());
    expect(black).toContain('b:a15:pyramid:190');
    expect(black).toContain('b:h15:square:28');
    expect(black).toContain('b:a16:square:361');
    expect(black).toContain('b:h16:square:49');
    expect(BLACK_SETUP.every(({ square }) => coordinateOf(square).rank >= 13)).toBe(true);
    expect(WHITE_SETUP.every(({ square }) => coordinateOf(square).rank <= 4)).toBe(true);
  });

  it('rejects coordinates outside the board', () => {
    expect(() => squareAt('i', 1)).toThrow(RangeError);
    expect(() => squareAt('a', 0)).toThrow(RangeError);
    expect(() => squareAt('h', 17)).toThrow(RangeError);
    expect(() => squareName(-1)).toThrow(RangeError);
    expect(() => squareName(128)).toThrow(RangeError);
  });
});
