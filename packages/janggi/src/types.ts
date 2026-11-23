import type { Color, GameStatus, Square } from '@chaturanga/rules-core';

export type { Color, GameStatus, Square };

/**
 * p = Soldier (卒/兵), n = Horse (馬), b = Elephant (象), a = Advisor (士), c = Cannon (包), r = Chariot (車),
 * k = General (楚/漢). Cho (green) is `w` and moves first; Han (red) is `b`. Janggi has no promotion.
 */
export type PieceType = 'p' | 'n' | 'b' | 'a' | 'c' | 'r' | 'k';

export interface Piece {
  color: Color;
  type: PieceType;
  /** Always false: Janggi has no promotion. Kept for the shared VariantGame Piece shape. */
  promoted: boolean;
}

/** A pass is a move of the general onto its own point, as Fairy-Stockfish writes it (`e2e2`). */
export interface Move {
  from: Square;
  to: Square;
}

export type MoveRecord = Move & {
  /** Coordinate notation as used by Fairy-Stockfish: `e3e4`, or `e2e2` for a pass. */
  uci: string;
  san: string;
  piece: Piece;
  captured: Piece | null;
  color: Color;
  fenAfter: string;
};
