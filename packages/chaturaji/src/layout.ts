import type { Piece, Player, PieceType } from './types';

export const FILES = 8;
export const RANKS = 8;
export const squareAt = (file: number, rank: number): number => rank * FILES + file;
export const fileOf = (square: number): number => square % FILES;
export const rankOf = (square: number): number => Math.floor(square / FILES);
export const isOnBoard = (file: number, rank: number): boolean => file >= 0 && file < FILES && rank >= 0 && rank < RANKS;

export function parseSquare(name: string): number | null {
  const match = /^([a-h])([1-8])$/.exec(name);
  return match ? squareAt(match[1]!.charCodeAt(0) - 97, Number(match[2]) - 1) : null;
}

export function squareName(square: number): string {
  return `${String.fromCharCode(97 + fileOf(square))}${rankOf(square) + 1}`;
}

export const FORWARD: Readonly<Record<Player, readonly [number, number]>> = {
  r: [-1, 0],
  g: [0, 1],
  y: [1, 0],
  b: [0, -1],
};

export const KING_HOME: Readonly<Record<Player, number>> = {
  r: squareAt(7, 4),
  g: squareAt(4, 0),
  y: squareAt(0, 3),
  b: squareAt(3, 7),
};

export const ALLY: Readonly<Record<Player, Player>> = { r: 'y', y: 'r', g: 'b', b: 'g' };

export function initialBoard(): Array<Piece | null> {
  const board: Array<Piece | null> = Array(FILES * RANKS).fill(null);
  const put = (color: Player, type: PieceType, file: number, rank: number): void => {
    board[squareAt(file, rank)] = { color, type, promoted: false };
  };
  // Red: east corner.
  put('r', 'b', 7, 7); put('r', 'h', 7, 6); put('r', 'e', 7, 5); put('r', 'k', 7, 4);
  for (let rank = 4; rank <= 7; rank++) put('r', 'p', 6, rank);
  // Green: south corner.
  put('g', 'k', 4, 0); put('g', 'e', 5, 0); put('g', 'h', 6, 0); put('g', 'b', 7, 0);
  for (let file = 4; file <= 7; file++) put('g', 'p', file, 1);
  // Yellow: west corner.
  put('y', 'k', 0, 3); put('y', 'e', 0, 2); put('y', 'h', 0, 1); put('y', 'b', 0, 0);
  for (let rank = 0; rank <= 3; rank++) put('y', 'p', 1, rank);
  // Black: north corner.
  put('b', 'b', 0, 7); put('b', 'h', 1, 7); put('b', 'e', 2, 7); put('b', 'k', 3, 7);
  for (let file = 0; file <= 3; file++) put('b', 'p', file, 6);
  return board;
}
