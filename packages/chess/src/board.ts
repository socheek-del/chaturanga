/**
 * Numeric 8x8 board for chess.
 *
 * A square holds 0 (empty) or a piece code: type (1..6) | BLACK (8). Squares are 0..63 with a1 = 0.
 * Colour index: 0 = White, 1 = Black. The geometry tables come from `@chaturanga/rules-core`, which the
 * Makruk family shares; the piece codes are this package's own, because chess is the only game in the
 * family with a bishop and a queen.
 */
import { BISHOP_RAYS, KING_TARGETS, KNIGHT_TARGETS, PAWN_CAPTURES, ROOK_RAYS } from '@chaturanga/rules-core';
import type { Color, Square } from '@chaturanga/rules-core';
import type { Piece, PieceType } from './types';

export const PAWN = 1;
export const KNIGHT = 2;
export const BISHOP = 3;
export const ROOK = 4;
export const QUEEN = 5;
export const KING = 6;
export const BLACK = 8;
export const TYPE_MASK = 7;

export const FILES = 8;
export const RANKS = 8;

export type Board = Uint8Array;
export type ColorIndex = 0 | 1;

export { BISHOP_RAYS, KING_TARGETS, KNIGHT_TARGETS, PAWN_CAPTURES, ROOK_RAYS };
export { fileOf, parseSquare, rankOf, squareName } from '@chaturanga/rules-core';

/** Castling rights as bits, in FEN order KQkq. */
export const WHITE_KING_SIDE = 1;
export const WHITE_QUEEN_SIDE = 2;
export const BLACK_KING_SIDE = 4;
export const BLACK_QUEEN_SIDE = 8;

export const opposite = (c: ColorIndex): ColorIndex => (c === 0 ? 1 : 0);
export const colorBits = (c: ColorIndex): number => (c === 1 ? BLACK : 0);
export const colorIndexOf = (code: number): ColorIndex => (code & BLACK ? 1 : 0);
export const toColor = (c: ColorIndex): Color => (c === 1 ? 'b' : 'w');
export const toColorIndex = (c: Color): ColorIndex => (c === 'b' ? 1 : 0);
export const typeOf = (code: number): number => code & TYPE_MASK;

const LETTERS: Record<number, PieceType> = { [PAWN]: 'p', [KNIGHT]: 'n', [BISHOP]: 'b', [ROOK]: 'r', [QUEEN]: 'q', [KING]: 'k' };
const TYPES: Record<string, number> = { p: PAWN, n: KNIGHT, b: BISHOP, r: ROOK, q: QUEEN, k: KING };

/** The FEN letter of a piece code, in the case of its colour (`N`, `n`). */
export function fenChar(code: number): string {
  const letter = LETTERS[typeOf(code)]!;
  return code & BLACK ? letter : letter.toUpperCase();
}

/** The SAN letter of a piece code; a pawn has none. */
export function sanLetter(code: number): string {
  const type = typeOf(code);
  return type === PAWN ? '' : LETTERS[type]!.toUpperCase();
}

/** The piece type a FEN or move letter names, or 0 when it names none. */
export function typeFromChar(char: string): number {
  return TYPES[char.toLowerCase()] ?? 0;
}

/** The piece code a FEN letter names, or 0 when it names none. */
export function codeFromFenChar(char: string): number {
  const type = typeFromChar(char);
  if (!type) return 0;
  return type | (char === char.toLowerCase() ? BLACK : 0);
}

export function codeToPiece(code: number): Piece {
  return { color: toColor(colorIndexOf(code)), type: LETTERS[typeOf(code)]!, promoted: false };
}

/** The rank a pawn of this colour starts on, as a rank index (0-based). */
export const pawnStartRank = (c: ColorIndex): number => (c === 0 ? 1 : 6);
/** The rank a pawn of this colour promotes on, as a rank index (0-based). */
export const promotionRank = (c: ColorIndex): number => (c === 0 ? 7 : 0);
/** One step forward for this colour, in squares. */
export const forward = (c: ColorIndex): number => (c === 0 ? 8 : -8);

/** Piece types a pawn may promote to, in the order Fairy-Stockfish lists them. */
export const PROMOTION_TYPES: readonly number[] = [QUEEN, ROOK, BISHOP, KNIGHT];

/** Squares `sq` shares a file or rank with, as rays ordered outward. */
export const linearRaysOf = (sq: Square): Square[][] => ROOK_RAYS[sq]!;
/** Squares `sq` shares a diagonal with, as rays ordered outward. */
export const diagonalRaysOf = (sq: Square): Square[][] => BISHOP_RAYS[sq]!;
