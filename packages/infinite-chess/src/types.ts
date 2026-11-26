import type { Color, Piece as CorePiece, VariantMoveRecord } from '@chaturanga/rules-core';

export type { Color };
export type Square = string;
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type Piece = CorePiece<PieceType, Color>;
export type MoveRecord = VariantMoveRecord<Color, Square>;
export type CastleRight = 'K' | 'Q' | 'k' | 'q';

export interface Point {
  x: bigint;
  y: bigint;
}

export interface Position {
  board: Map<Square, Piece>;
  turn: Color;
  castling: Set<CastleRight>;
  /** The square crossed by the previous double pawn push, if any. */
  enPassant: Square | null;
  halfmoveClock: number;
  fullmoveNumber: number;
}

export interface CoordinateMove {
  from: Square;
  to: Square;
  promotion: Exclude<PieceType, 'k' | 'p'> | null;
}
