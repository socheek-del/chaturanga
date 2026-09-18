import type { Color, GameStatus, Square } from '@chaturanga/rules-core';

export type { Color, GameStatus, Square };

/**
 * p = Pawn (歩), l = Lance (香), n = Knight (桂), s = Silver (銀), g = Gold (金), b = Bishop (角),
 * r = Rook (飛), k = King (王/玉). Pawn, lance, knight, silver, bishop and rook can promote; gold and
 * king cannot.
 */
export type PieceType = 'p' | 'l' | 'n' | 's' | 'g' | 'b' | 'r' | 'k';

export interface Piece {
  color: Color;
  type: PieceType;
  /** True for a promoted piece (+P, +L, +N, +S, +B, +R). */
  promoted: boolean;
}

export type Move =
  | { kind: 'move'; from: Square; to: Square; promotion: boolean }
  | { kind: 'drop'; type: PieceType; to: Square };

export type MoveRecord = {
  /** Coordinate notation as used by Fairy-Stockfish: `g8g9`, `g8g9+`, `S@a2`. */
  uci: string;
  san: string;
  color: Color;
  /** The piece that moved or was placed, as it was before any promotion. */
  piece: Piece;
  captured: Piece | null;
  /** Destination square; the placement square for a drop. */
  to: Square;
  /** Origin square, or null for a drop. */
  from: Square | null;
  promotion: boolean;
  fenAfter: string;
};
