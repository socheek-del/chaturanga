/**
 * Shogi (将棋, Japanese chess) rules engine. Pure TypeScript: no DOM, network, or timers.
 * Rules follow Fairy-Stockfish's `shogi` variant (RULES.md): drops, optional and forced promotion, nifu,
 * uchifuzume, checkmate, losing stalemate, and sennichite with its perpetual-check exception.
 */
export { FenError, parseFen, serializeFen, START_FEN } from './fen';
export { encodedToUci, Game, IllegalMoveError, moveToUci } from './game';
export { perft } from './perft';
export { shogi } from './variant';
export type { Color, GameStatus, Move, MoveRecord, Piece, PieceType, Square } from './types';
