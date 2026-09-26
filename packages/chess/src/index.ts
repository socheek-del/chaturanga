/**
 * Pure international chess rules: board, FEN, legal moves (castling, capture in passing, promotion to a
 * choice of four pieces) and how a game ends. The single source of truth for the chess web app, its bots
 * and its Worker. No DOM, no network, no timers, no randomness.
 */
export { encodedToUci, Game, IllegalMoveError, moveToUci } from './game';
export { deadPosition, FIFTY_MOVE_PLIES, insufficientMaterial, REPETITION_LIMIT } from './gameEnd';
export { parseSquare, squareName } from './board';
export { parseFen, serializeFen, START_FEN } from './fen';
export { type PgnGame, PgnError, parsePgn, resolveSan, toPgn } from './pgn';
export type { Color, GameStatus, Move, MoveRecord, Piece, PieceType, Square } from './types';
export { chess } from './variant';
export { FenError } from '@chaturanga/rules-core';
