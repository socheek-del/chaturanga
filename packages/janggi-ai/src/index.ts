/**
 * Janggi computer opponent: ai-core alpha-beta search on the Janggi engine, with repetitions judged by
 * the real rules when the game history is available (points decide, perpetual check loses). Runs in a Web Worker
 * in the browser; pure and deterministic given `rng`.
 */
import { type EngineMove, pickRootMove, search } from '@chaturanga/ai-core';
import type { Game } from '@chaturanga/janggi';
import { encodedToUci, generateLegalMoves, isPass, parseFen } from '@chaturanga/janggi/core';
import { positionKey, JanggiSearch } from './adapter';
import { botById, type JanggiBot } from './bots';
import { materialBalance } from './evaluate';

export { mulberry32 } from '@chaturanga/ai-core';
export { DECIDED_SCORE, positionKey, JanggiSearch } from './adapter';
export { BOTS, botById, type JanggiBot } from './bots';
export { evaluate, materialBalance, PIECE_VALUE } from './evaluate';
export type { EngineMove };

/** Bots treat repeating a position as slightly worse than a draw, so they keep trying to make progress. */
export const DEFAULT_CONTEMPT = 30;
/** Material lead (centipawns) at which a bot switches into conversion mode. */
export const CONVERSION_MARGIN = 900;
/** Extra search depth in conversion mode. */
export const CONVERSION_EXTRA_DEPTH = 2;

export interface ChooseOptions {
  rng?: () => number;
  now?: () => number;
  /** Use the node budget only (no wall clock), for reproducible tests. */
  ignoreTime?: boolean;
  /** Earlier positions of the game (positionKey), for repetition avoidance. */
  history?: readonly string[];
  /**
   * The game so far, standing on `fen`. When given, a move that repeats a position is judged by the Janggi
   * rules (points decide, a perpetual check loses). The game is left exactly as it was.
   */
  game?: Game;
}

/** A clearly winning bot plays without noise or blunders and searches deeper, so it finishes the game. */
export function inConversion(fen: string): boolean {
  const pos = parseFen(fen);
  return materialBalance(pos.board, pos.turn) >= CONVERSION_MARGIN;
}

function checkGame(fen: string, game: Game | undefined): Game | undefined {
  if (game && positionKey(game.fen()) !== positionKey(fen)) throw new Error('options.game is not on the given position');
  return game;
}

/** Picks a move for a bot level. Returns null when there is no legal move. */
export function chooseMove(fen: string, level: JanggiBot | number, options: ChooseOptions = {}): EngineMove | null {
  const persona = typeof level === 'number' ? botById(level) : level;
  const rng = options.rng ?? Math.random;
  const now = options.now ?? (() => Date.now());
  const game = checkGame(fen, options.game);
  const pos = parseFen(fen);
  const legal = generateLegalMoves(pos.board, pos.turn);
  if (legal.length === 0) return null;
  // A blunder is a bad move, not a pass.
  const moves = legal.length > 1 ? legal.filter((m) => !isPass(m)) : legal;

  const bot = inConversion(fen)
    ? { ...persona, noise: 0, blunderRate: 0, maxDepth: persona.maxDepth + CONVERSION_EXTRA_DEPTH }
    : persona;
  if (rng() < bot.blunderRate) {
    return { uci: encodedToUci(moves[Math.floor(rng() * moves.length)]!), score: 0, depth: 0, nodes: 0 };
  }

  const result = search(new JanggiSearch(pos.board, pos.turn, game), {
    maxDepth: bot.maxDepth,
    maxNodes: bot.maxNodes,
    deadline: options.ignoreTime ? undefined : now() + bot.timeMs,
    now,
    history: options.history,
    contempt: DEFAULT_CONTEMPT,
    // Only noisy bots choose among root moves by score; the rest search much deeper without exact scores.
    exactRootScores: bot.noise > 0,
  });
  const pick = pickRootMove(result, bot.noise, rng);
  return { uci: encodedToUci(pick.move), score: pick.score, depth: result.depth, nodes: result.nodes };
}

/** Strongest move within a budget, for hints. */
export function bestMove(
  fen: string,
  options: {
    maxDepth?: number;
    maxNodes?: number;
    timeMs?: number;
    now?: () => number;
    history?: readonly string[];
    game?: Game;
  } = {},
): EngineMove | null {
  const now = options.now ?? (() => Date.now());
  const game = checkGame(fen, options.game);
  const pos = parseFen(fen);
  if (generateLegalMoves(pos.board, pos.turn).length === 0) return null;
  const result = search(new JanggiSearch(pos.board, pos.turn, game), {
    maxDepth: options.maxDepth ?? 4,
    maxNodes: options.maxNodes ?? 300_000,
    deadline: options.timeMs ? now() + options.timeMs : undefined,
    now,
    history: options.history,
    contempt: DEFAULT_CONTEMPT,
    exactRootScores: false,
  });
  return { uci: encodedToUci(result.move), score: result.score, depth: result.depth, nodes: result.nodes };
}
