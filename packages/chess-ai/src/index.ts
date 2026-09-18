/**
 * Chess computer opponent: ai-core alpha-beta search on the chess engine, with repetitions scored through
 * the search's own history. Runs in a Web Worker in the browser; pure and deterministic given `rng` and a
 * node budget.
 */
import { type EngineMove, pickRootMove, search } from '@chaturanga/ai-core';
import { encodedToUci, generateLegalMoves, normalizeEp, parseFen, type Position } from '@chaturanga/chess/core';
import { ChessSearch, fenKey, positionKey } from './adapter';
import { botById, type ChessBot } from './bots';
import { materialBalance } from './evaluate';

export { mulberry32 } from '@chaturanga/ai-core';
export { ChessSearch, fenKey, positionKey } from './adapter';
export { BOTS, botById, type ChessBot } from './bots';
export { evaluate, material, materialBalance, PIECE_VALUE } from './evaluate';
export type { EngineMove };

/** Bots treat repeating a position as slightly worse than a draw, so they keep trying to make progress. */
export const DEFAULT_CONTEMPT = 30;
/** Material lead (centipawns) at which a bot switches into conversion mode. */
export const CONVERSION_MARGIN = 600;
/** Extra search depth in conversion mode. */
export const CONVERSION_EXTRA_DEPTH = 2;

export interface ChooseOptions {
  rng?: () => number;
  now?: () => number;
  /** Use the node budget only (no wall clock), for reproducible games. */
  ignoreTime?: boolean;
  /** Earlier positions of the game as `fenKey` strings, for repetition avoidance. */
  history?: readonly string[];
}

function positionOf(fen: string): Position {
  const data = parseFen(fen);
  const pos: Position = { board: data.board, turn: data.turn, castling: data.castling, ep: data.ep };
  normalizeEp(pos);
  return pos;
}

/** A clearly winning bot plays without noise or blunders and searches deeper, so it finishes the game. */
export function inConversion(fen: string): boolean {
  const pos = positionOf(fen);
  return materialBalance(pos.board, pos.turn) >= CONVERSION_MARGIN;
}

/** Picks a move for a bot level. Returns null when there is no legal move. */
export function chooseMove(fen: string, level: ChessBot | number, options: ChooseOptions = {}): EngineMove | null {
  const persona = typeof level === 'number' ? botById(level) : level;
  const rng = options.rng ?? Math.random;
  const now = options.now ?? (() => Date.now());
  const pos = positionOf(fen);
  const legal = generateLegalMoves(pos);
  if (legal.length === 0) return null;

  const bot = inConversion(fen)
    ? { ...persona, noise: 0, blunderRate: 0, maxDepth: persona.maxDepth + CONVERSION_EXTRA_DEPTH }
    : persona;

  if (bot.blunderRate > 0 && rng() < bot.blunderRate) {
    const move = legal[Math.floor(rng() * legal.length)]!;
    return { uci: encodedToUci(move), score: 0, depth: 0, nodes: 0 };
  }

  const result = search(new ChessSearch(pos), {
    maxDepth: bot.maxDepth,
    maxNodes: bot.maxNodes,
    deadline: options.ignoreTime ? undefined : now() + bot.timeMs,
    now,
    history: options.history,
    contempt: DEFAULT_CONTEMPT,
    exactRootScores: bot.noise > 0,
  });
  if (result.move < 0) return null;
  const chosen = pickRootMove(result, bot.noise, rng);
  return { uci: encodedToUci(chosen.move), score: chosen.score, depth: result.depth, nodes: result.nodes };
}

/** Strongest move within a budget, for hints. */
export function bestMove(
  fen: string,
  options: { maxDepth?: number; maxNodes?: number; timeMs?: number; now?: () => number; history?: readonly string[] } = {},
): EngineMove | null {
  const now = options.now ?? (() => Date.now());
  const pos = positionOf(fen);
  if (generateLegalMoves(pos).length === 0) return null;
  const result = search(new ChessSearch(pos), {
    maxDepth: options.maxDepth ?? 6,
    maxNodes: options.maxNodes ?? 300_000,
    deadline: options.timeMs ? now() + options.timeMs : undefined,
    now,
    history: options.history,
    contempt: DEFAULT_CONTEMPT,
    exactRootScores: false,
  });
  if (result.move < 0) return null;
  return { uci: encodedToUci(result.move), score: result.score, depth: result.depth, nodes: result.nodes };
}

/** The key the search uses for a position given as a FEN, for callers keeping a history. */
export const keyOfFen = fenKey;
/** The key the search uses for a live position. */
export const keyOfPosition = positionKey;
