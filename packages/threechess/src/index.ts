/** Three-seat chess on hexagonal cells. */
export { Game, IllegalMoveError, parseSquare, squareName, threechess } from './game';
export type { GameStatusName, Move, PieceType, Player, SeatStatus } from './types';
export { hexAt, hexOf, RADIUS, SIZE } from './hex';
