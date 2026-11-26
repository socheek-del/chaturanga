/** Four-player Chaturaji with seeded dice and four historical corner armies. */
export { Game, IllegalMoveError, chaturaji, createSeededStartFen, diceForSeed, parseSquare, squareName } from './game';
export { FILES, RANKS, isOnBoard, squareAt } from './layout';
export { PIECE_TYPES, PLAYERS } from './types';
export type { ChaturajiStatus, Move, Piece, PieceType, Player } from './types';
