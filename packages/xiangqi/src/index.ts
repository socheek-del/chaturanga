/**
 * Xiangqi (象棋, Chinese chess) rules engine. Pure TypeScript: no DOM, network, or timers.
 * Rules follow Fairy-Stockfish's `xiangqi` variant (RULES.md): checkmate, losing stalemate, idle
 * repetition, perpetual check and perpetual chase, the 50-move rule and insufficient material.
 */
export { FenError, parseFen, serializeFen, START_FEN } from './fen';
export { Game, IllegalMoveError, moveToUci } from './game';
export { perft } from './perft';
export { xiangqi } from './variant';
export type { Color, GameStatus, Move, MoveRecord, Piece, PieceType, Square } from './types';
