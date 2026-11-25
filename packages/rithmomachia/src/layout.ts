import type { Color, Square } from '@chaturanga/rules-core';

export const FILES = 8;
export const RANKS = 16;
export const BOARD_SIZE = FILES * RANKS;
export const FILE_NAMES = 'abcdefgh';
export const BOARD_CELLS: readonly Square[] = Object.freeze(Array.from({ length: BOARD_SIZE }, (_, square) => square));

export type PieceShape = 'circle' | 'triangle' | 'square' | 'pyramid';
export type ComponentShape = Exclude<PieceShape, 'pyramid'>;

export interface PyramidComponent {
  readonly shape: ComponentShape;
  readonly value: number;
}

export interface SetupPiece {
  readonly square: Square;
  readonly color: Color;
  readonly shape: PieceShape;
  readonly value: number;
  readonly components?: readonly PyramidComponent[];
}

export interface Coordinate {
  readonly file: number;
  readonly rank: number;
}

export function coordinateOf(square: Square): Coordinate {
  if (!Number.isInteger(square) || square < 0 || square >= BOARD_SIZE) throw new RangeError(`Invalid Rithmomachia square: ${square}`);
  return { file: square % FILES, rank: Math.floor(square / FILES) + 1 };
}

export function squareAt(file: string, rank: number): Square {
  if (!Number.isInteger(rank) || rank < 1 || rank > RANKS || file.length !== 1 || !FILE_NAMES.includes(file))
    throw new RangeError(`Invalid Rithmomachia coordinate: ${file}${rank}`);
  return (rank - 1) * FILES + FILE_NAMES.indexOf(file);
}

export function squareName(square: Square): string {
  const { file, rank } = coordinateOf(square);
  return `${FILE_NAMES[file]}${rank}`;
}

const square = (file: string, rank: number) => squareAt(file, rank);
const piece = (color: Color, shape: PieceShape, value: number, file: string, rank: number, components?: readonly PyramidComponent[]): SetupPiece => ({
  square: square(file, rank), color, shape, value, ...(components ? { components } : {}),
});

const WHITE_PYRAMID: readonly PyramidComponent[] = Object.freeze([
  { shape: 'square', value: 36 }, { shape: 'square', value: 25 },
  { shape: 'triangle', value: 16 }, { shape: 'triangle', value: 9 },
  { shape: 'circle', value: 4 }, { shape: 'circle', value: 1 },
]);
const BLACK_PYRAMID: readonly PyramidComponent[] = Object.freeze([
  { shape: 'square', value: 64 }, { shape: 'square', value: 49 },
  { shape: 'triangle', value: 36 }, { shape: 'triangle', value: 25 },
  { shape: 'circle', value: 16 },
]);

/**
 * White's source-derived position, ranks 1–4. The number table and 8×16 arrangement are
 * transcribed independently from the University of Cape Town rules paper and checked against
 * the AMS number table; see the product research report for citations.
 */
export const WHITE_SETUP: readonly SetupPiece[] = Object.freeze([
  piece('w', 'circle', 2, 'c', 4), piece('w', 'circle', 4, 'd', 4),
  piece('w', 'circle', 6, 'e', 4), piece('w', 'circle', 8, 'f', 4),

  piece('w', 'triangle', 9, 'a', 3), piece('w', 'triangle', 25, 'b', 3),
  piece('w', 'circle', 4, 'c', 3), piece('w', 'circle', 16, 'd', 3),
  piece('w', 'circle', 36, 'e', 3), piece('w', 'circle', 64, 'f', 3),
  piece('w', 'triangle', 49, 'g', 3), piece('w', 'triangle', 81, 'h', 3),

  piece('w', 'square', 15, 'a', 2), piece('w', 'square', 45, 'b', 2),
  piece('w', 'triangle', 6, 'c', 2), piece('w', 'triangle', 20, 'd', 2),
  piece('w', 'triangle', 42, 'e', 2), piece('w', 'triangle', 72, 'f', 2),
  piece('w', 'pyramid', 91, 'g', 2, WHITE_PYRAMID), piece('w', 'square', 153, 'h', 2),

  piece('w', 'square', 25, 'a', 1), piece('w', 'square', 81, 'b', 1),
  piece('w', 'square', 169, 'g', 1), piece('w', 'square', 289, 'h', 1),
]);

/** Black's position faces White from ranks 13–16; values follow the odd number table. */
export const BLACK_SETUP: readonly SetupPiece[] = Object.freeze([
  piece('b', 'circle', 9, 'c', 13), piece('b', 'circle', 7, 'd', 13),
  piece('b', 'circle', 5, 'e', 13), piece('b', 'circle', 3, 'f', 13),

  piece('b', 'triangle', 100, 'a', 14), piece('b', 'triangle', 64, 'b', 14),
  piece('b', 'circle', 81, 'c', 14), piece('b', 'circle', 49, 'd', 14),
  piece('b', 'circle', 25, 'e', 14), piece('b', 'circle', 9, 'f', 14),
  piece('b', 'triangle', 36, 'g', 14), piece('b', 'triangle', 16, 'h', 14),

  piece('b', 'pyramid', 190, 'a', 15, BLACK_PYRAMID), piece('b', 'square', 120, 'b', 15),
  piece('b', 'triangle', 90, 'c', 15), piece('b', 'triangle', 56, 'd', 15),
  piece('b', 'triangle', 30, 'e', 15), piece('b', 'triangle', 12, 'f', 15),
  piece('b', 'square', 66, 'g', 15), piece('b', 'square', 28, 'h', 15),

  piece('b', 'square', 361, 'a', 16), piece('b', 'square', 225, 'b', 16),
  piece('b', 'square', 121, 'g', 16), piece('b', 'square', 49, 'h', 16),
]);

export const STARTING_PIECES: readonly SetupPiece[] = Object.freeze([...WHITE_SETUP, ...BLACK_SETUP]);
