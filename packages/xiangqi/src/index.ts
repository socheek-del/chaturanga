/**
 * Xiangqi (象棋, Chinese chess) rules engine. Pure TypeScript: no DOM, network, or timers.
 * Rules follow Fairy-Stockfish's `xiangqi` variant. Game status is ongoing/checkmate only at this
 * step (xq-001); stalemate, perpetual check/chase and the 60-move rule land in xq-002.
 */
export { FenError, parseFen, serializeFen, START_FEN } from './fen';
export { Game, IllegalMoveError, moveToUci } from './game';
export { perft } from './perft';
export { xiangqi } from './variant';
export type { Color, GameStatus, Move, MoveRecord, Piece, PieceType, Square } from './types';
