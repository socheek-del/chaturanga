import type { Color, GameStatus, Square } from '@chaturanga/rules-core';

export type { Color, GameStatus, Square };

/**
 * p = Soldier (兵/卒), n = Horse (傌/馬), b = Elephant (相/象), a = Advisor (仕/士), c = Cannon (炮/砲),
 * r = Chariot (俥/車), k = General (帥/將). Xiangqi has no promotion.
 */
export type PieceType = 'p' | 'n' | 'b' | 'a' | 'c' | 'r' | 'k';

export interface Piece {
  color: Color;
  type: PieceType;
  /** Always false: Xiangqi has no promotion. Kept for the shared VariantGame Piece shape. */
  promoted: boolean;
}

export interface Move {
  from: Square;
  to: Square;
}

export type MoveRecord = Move & {
  /** Coordinate notation as used by Fairy-Stockfish: `e3e4`. */
  uci: string;
  san: string;
  piece: Piece;
  captured: Piece | null;
  color: Color;
  fenAfter: string;
};
