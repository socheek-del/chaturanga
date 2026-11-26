/** Four-seat Free-for-All chess on the 160-square cross board. */
export { Game, IllegalMoveError, fourchess, parseSquare, squareName } from './game';
export { FILES, RANKS, isPlayable, isPlayableSquare, homeLine, pawnLine } from './layout';
export { PLAYERS } from './types';
export type { CastleWing, EndCause, FourPiece, Move, PieceType, Player } from './types';
