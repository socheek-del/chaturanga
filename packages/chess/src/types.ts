import type { Color, GameStatus, Square } from '@chaturanga/rules-core';

export type { Color, GameStatus, Square };

/** p = pawn, n = knight, b = bishop, r = rook, q = queen, k = king. */
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

export interface Piece {
  color: Color;
  type: PieceType;
  /** Always false: a promoted chess piece is an ordinary piece of its new type. */
  promoted: boolean;
}

/** A move from one square to another, promoting to `promotion` when a pawn reaches the last rank. */
export interface Move {
  from: Square;
  to: Square;
  promotion: PieceType | null;
}

export interface MoveRecord {
  /** Coordinate notation as used by Fairy-Stockfish: `e2e4`, `e1g1` (castling), `e7e8q`. */
  uci: string;
  san: string;
  color: Color;
  /** The piece that moved, as it was before any promotion. */
  piece: Piece;
  captured: Piece | null;
  to: Square;
  from: Square;
  promotion: PieceType | null;
  fenAfter: string;
}
