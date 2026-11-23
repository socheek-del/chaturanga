/**
 * Janggi (장기, Korean chess) rules engine. Pure TypeScript: no DOM, network, or timers.
 * Rules follow Fairy-Stockfish's `janggi` variant (RULES.md): checkmate, bikjang, passing, repetition,
 * perpetual check and the 50-move rule, with undecided games settled by points.
 */
export { FenError, parseFen, serializeFen, SETUP_IDS, setupFen, type SetupId, SETUPS, START_FEN, START_FENS } from './fen';
export { Game, IllegalMoveError, moveToUci, PASS_SAN } from './game';
export { perft } from './perft';
export { janggi } from './variant';
export type { Color, GameStatus, Move, MoveRecord, Piece, PieceType, Square } from './types';
