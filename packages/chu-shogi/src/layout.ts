import type { Color, Square } from '@chaturanga/rules-core';

export const FILES = 12;
export const RANKS = 12;
export const BOARD_SIZE = FILES * RANKS;
export const FILE_NAMES = 'abcdefghijkl';
export const BOARD_CELLS: readonly Square[] = Object.freeze(Array.from({ length: BOARD_SIZE }, (_, square) => square));

export const BASE_PIECE_TYPES = [
  'king', 'lion', 'free-king', 'drunk-elephant', 'kirin', 'phoenix', 'rook', 'bishop', 'dragon-king',
  'dragon-horse', 'vertical-mover', 'side-mover', 'reverse-chariot', 'lance', 'blind-tiger',
  'ferocious-leopard', 'gold-general', 'silver-general', 'copper-general', 'go-between', 'pawn',
] as const;

export type BasePieceType = (typeof BASE_PIECE_TYPES)[number];

export interface Coordinate {
  readonly file: number;
  readonly rank: number;
}

export interface SetupPiece {
  readonly square: Square;
  readonly color: Color;
  readonly type: BasePieceType;
}

export function onBoard(file: number, rank: number): boolean {
  return Number.isInteger(file) && Number.isInteger(rank) && file >= 0 && file < FILES && rank >= 1 && rank <= RANKS;
}

export function squareAt(file: number, rank: number): Square {
  if (!onBoard(file, rank)) throw new RangeError(`Invalid Chu Shogi coordinate: ${FILE_NAMES[file] ?? file}${rank}`);
  return (rank - 1) * FILES + file;
}

export function coordinateOf(square: Square): Coordinate {
  if (!Number.isInteger(square) || square < 0 || square >= BOARD_SIZE) throw new RangeError(`Invalid Chu Shogi square: ${square}`);
  return { file: square % FILES, rank: Math.floor(square / FILES) + 1 };
}

export function fileOf(square: Square): number {
  return coordinateOf(square).file;
}

export function rankOf(square: Square): number {
  return coordinateOf(square).rank;
}

export function squareName(square: Square): string {
  const { file, rank } = coordinateOf(square);
  return `${FILE_NAMES[file]}${rank}`;
}

const row = (rank: number, types: readonly (BasePieceType | null)[]): SetupPiece[] => {
  if (types.length !== FILES) throw new RangeError(`Chu Shogi setup rank ${rank} must have 12 files`);
  return types.flatMap((type, file) => type ? [{ square: squareAt(file, rank), color: 'w' as const, type }] : []);
};

const WHITE_SETUP: readonly SetupPiece[] = Object.freeze([
  ...row(1, [
    'lance', 'ferocious-leopard', 'copper-general', 'silver-general', 'gold-general', 'king',
    'drunk-elephant', 'gold-general', 'silver-general', 'copper-general', 'ferocious-leopard', 'lance',
  ]),
  ...row(2, [
    'reverse-chariot', null, 'bishop', null, 'blind-tiger', 'kirin', 'phoenix', 'blind-tiger', null,
    'bishop', null, 'reverse-chariot',
  ]),
  ...row(3, [
    'side-mover', 'vertical-mover', 'rook', 'dragon-horse', 'dragon-king', 'lion', 'free-king',
    'dragon-king', 'dragon-horse', 'rook', 'vertical-mover', 'side-mover',
  ]),
  ...row(4, Array.from({ length: FILES }, () => 'pawn' as const)),
  ...row(5, [null, null, null, 'go-between', null, null, null, null, 'go-between', null, null, null]),
]);

/** The published classical setup, with White at ranks 1–5 and Black facing it by 180° rotation. */
export const STARTING_PIECES: readonly SetupPiece[] = Object.freeze([
  ...WHITE_SETUP,
  ...WHITE_SETUP.map(({ square, type }) => {
    const { file, rank } = coordinateOf(square);
    return { square: squareAt(FILES - 1 - file, RANKS + 1 - rank), color: 'b' as const, type };
  }),
]);
