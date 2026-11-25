/** Petrov-described Russian four-player Fortress Chess. */
export { Game, FortressIllegalMoveError, START_FEN, fortress } from './game';
export {
  diagonalTouchesWall, fileOf, forward, hasWallBetween, isPlayable, parseSquare, rankOf, rightFortress,
  sameTeam, squareName, teamOf,
} from './geometry';
export type { FortressStatus, Move, Piece, PieceType, Seat } from './types';
export { FenError } from '@chaturanga/rules-core';
