import type { Piece, Square } from '@chaturanga/rules-core';

export const PLAYERS = ['r', 'b', 'y', 'g'] as const;
export type Player = (typeof PLAYERS)[number];
export type PieceType = 'k' | 'q' | 'r' | 'b' | 'n' | 'p';
export type FourPiece = Piece<PieceType, Player> & { moved: boolean };
export type CastleWing = 'left' | 'right';

export interface Move {
  from: Square;
  to: Square;
  promotion?: 'q';
  enPassant?: Square;
  castle?: CastleWing;
}

export type EndCause = 'elimination' | 'repetition' | 'insufficient-material' | 'fifty-move' | 'resignation';
