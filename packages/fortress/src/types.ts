import type { GameStatus, Piece as RulesPiece, Square } from '@chaturanga/rules-core';

export type Seat = 'r' | 'b' | 'w' | 'k';
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type Piece = RulesPiece<PieceType, Seat>;
export type FortressStatus = GameStatus<Seat>;

export interface Move {
  from: Square;
  to: Square;
  promotion: PieceType | null;
  castle: boolean;
  enPassant: boolean;
}
