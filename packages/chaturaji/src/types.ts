import type { GameStatus, Piece as RulesPiece, Square } from '@chaturanga/rules-core';

export type Player = 'r' | 'g' | 'y' | 'b';
export type PieceType = 'p' | 'b' | 'h' | 'e' | 'k';
export type Piece = RulesPiece<PieceType, Player>;
export type ChaturajiStatus = GameStatus<Player>;

export const PLAYERS: readonly Player[] = ['r', 'g', 'y', 'b'];
export const PIECE_TYPES: readonly PieceType[] = ['p', 'b', 'h', 'e', 'k'];

export interface Move {
  from: Square;
  to: Square;
}
