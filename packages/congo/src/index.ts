/** Pure rules for Demian Freeling's two-player 7×7 Congo chess variant. */
export { Game, congo, congoVariant } from './game';
export { FILES, RANKS, RIVER_RANK, PIECE_TYPES, START_FEN, parseFen, square, squareName } from './position';
export type { Piece, PieceType } from './position';
export { FenError, IllegalMoveError } from '@chaturanga/rules-core';
