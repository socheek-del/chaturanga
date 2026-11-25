import { squareNameOf, squareOf, type Square } from '@chaturanga/rules-core';

export const FILES = 8;
export const RANKS = 8;
export const BOARD_SIZE = FILES * RANKS;
export const FILE_NAMES = 'abcdefgh';
export const BOARD_CELLS: readonly Square[] = Object.freeze(Array.from({ length: BOARD_SIZE }, (_, sq) => sq));

export function squareAt(file: string, rank: number): Square {
  if (!Number.isInteger(rank) || rank < 1 || rank > RANKS || file.length !== 1 || !FILE_NAMES.includes(file))
    throw new RangeError(`Invalid Dameo coordinate: ${file}${rank}`);
  return squareOf(`${file}${rank}`, FILES)!;
}

export function squareName(target: Square): string {
  if (!Number.isInteger(target) || target < 0 || target >= BOARD_SIZE)
    throw new RangeError(`Invalid Dameo square: ${target}`);
  return squareNameOf(target, FILES);
}

function row(rank: number, firstFile: string, lastFile: string): readonly Square[] {
  const first = FILE_NAMES.indexOf(firstFile);
  const last = FILE_NAMES.indexOf(lastFile);
  return Object.freeze(Array.from({ length: last - first + 1 }, (_, offset) => squareAt(FILE_NAMES[first + offset]!, rank)));
}

/** White's 8+6+4 trapezoid from the product's canonical bottom-left a1 origin. */
export const WHITE_SETUP: readonly Square[] = Object.freeze([
  ...row(1, 'a', 'h'),
  ...row(2, 'b', 'g'),
  ...row(3, 'c', 'f'),
]);

/** Black's vertical mirror of White's 8+6+4 trapezoid. */
export const BLACK_SETUP: readonly Square[] = Object.freeze([
  ...row(8, 'a', 'h'),
  ...row(7, 'b', 'g'),
  ...row(6, 'c', 'f'),
]);

export const STARTING_SQUARES = Object.freeze({ white: WHITE_SETUP, black: BLACK_SETUP });
