import type { Piece } from '@chaturanga/rules-core';

export type Player = 'w' | 'b' | 'r';
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type ThreePiece = Piece<PieceType, Player> & { moved: boolean };
export interface Move {
  from: number;
  to: number;
  promotion?: Exclude<PieceType, 'p' | 'k'>;
  special?: 'en-passant' | 'castle-kingside' | 'castle-queenside';
}
export type SeatStatus = 'playing' | 'check' | 'checkmate' | 'stalemate' | 'eliminated' | 'winner';
export type GameStatusName = 'playing' | 'check' | 'win' | 'draw';
