import type { Color, Piece, Square } from '@chaturanga/rules-core';

export const FILES = 8;
export const RANKS = 8;
export const SIZE = FILES * RANKS;
export const BLACK = 8;
export const TYPE_MASK = 7;

export const PIECE_TYPES = ['e', 'm', 'h', 'd', 'c', 'r'] as const;
export type PieceType = (typeof PIECE_TYPES)[number];
export type Board = Uint8Array;

export const HAND_ORDER: readonly PieceType[] = ['e', 'm', 'h', 'd', 'c', 'r'];
export const INVENTORY: Readonly<Record<PieceType, number>> = {
  e: 1,
  m: 1,
  h: 2,
  d: 2,
  c: 2,
  r: 8,
};
export const STRENGTH: Readonly<Record<PieceType, number>> = {
  e: 6,
  m: 5,
  h: 4,
  d: 3,
  c: 2,
  r: 1,
};

export const TRAPS: readonly Square[] = [18, 21, 42, 45];
const TYPE_CODE: Readonly<Record<PieceType, number>> = {
  e: 1,
  m: 2,
  h: 3,
  d: 4,
  c: 5,
  r: 6,
};
const CODE_TYPE = new Map(Object.entries(TYPE_CODE).map(([type, code]) => [code, type as PieceType]));

export function pieceCode(type: PieceType, color: Color): number {
  return TYPE_CODE[type] | (color === 'b' ? BLACK : 0);
}

export function pieceType(code: number): PieceType {
  const type = CODE_TYPE.get(code & TYPE_MASK);
  if (!type) throw new RangeError(`Unknown Arimaa piece code: ${code}`);
  return type;
}

export function codeToPiece(code: number): Piece<PieceType, Color> {
  return {
    color: code & BLACK ? 'b' : 'w',
    type: pieceType(code),
    promoted: false,
  };
}

export function codeToChar(code: number): string {
  const type = pieceType(code);
  return code & BLACK ? type : type.toUpperCase();
}

export function charToCode(char: string): number | null {
  if (char.length !== 1) return null;
  const type = char.toLowerCase() as PieceType;
  if (!PIECE_TYPES.includes(type)) return null;
  return pieceCode(type, char === char.toLowerCase() ? 'b' : 'w');
}

export function opposite(color: Color): Color {
  return color === 'w' ? 'b' : 'w';
}

export function squareName(square: Square): string {
  return String.fromCharCode(97 + (square % FILES)) + String(Math.floor(square / FILES) + 1);
}

export function isTrap(square: Square): boolean {
  return TRAPS.includes(square);
}
