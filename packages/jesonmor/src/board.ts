import type { Color, Piece as CorePiece, Square } from '@chaturanga/rules-core';

export const FILES = 9;
export const RANKS = 9;
export const SIZE = FILES * RANKS;
export const CENTER = 4 * FILES + 4;

export const KNIGHT = 1;
export const BLACK = 8;
export type Board = Uint8Array;

export const colorOf = (code: number): Color => (code & BLACK ? 'b' : 'w');
export const colorBits = (color: Color): number => (color === 'b' ? BLACK : 0);
export const fileOf = (square: Square): number => square % FILES;
export const rankOf = (square: Square): number => Math.floor(square / FILES);
export const squareAt = (file: number, rank: number): Square => rank * FILES + file;
export const inBounds = (file: number, rank: number): boolean => file >= 0 && file < FILES && rank >= 0 && rank < RANKS;

export const codeToPiece = (code: number): CorePiece<'n'> => ({ color: colorOf(code), type: 'n', promoted: false });
export const codeToChar = (code: number): string => (colorOf(code) === 'w' ? 'N' : 'n');
export function codeFromChar(char: string): number {
  if (char === 'N') return KNIGHT;
  if (char === 'n') return KNIGHT | BLACK;
  return 0;
}

const DELTAS = [
  [1, 2], [2, 1], [2, -1], [1, -2],
  [-1, -2], [-2, -1], [-2, 1], [-1, 2],
] as const;

/** Every geometrical knight landing square, regardless of occupancy. */
export function knightTargets(square: Square): Square[] {
  const file = fileOf(square);
  const rank = rankOf(square);
  const out: Square[] = [];
  for (const [df, dr] of DELTAS) if (inBounds(file + df, rank + dr)) out.push(squareAt(file + df, rank + dr));
  return out;
}

export const opposite = (color: Color): Color => (color === 'w' ? 'b' : 'w');
