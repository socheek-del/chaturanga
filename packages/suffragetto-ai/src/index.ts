import { mulberry32, MATE, pickRootMove, search, type EngineMove } from '@chaturanga/ai-core';
import { Game } from '@chaturanga/suffragetto';
import { botById, type SuffragettoBot } from './bots';
import { positionKey, SuffragettoSearch } from './adapter';

export { BOTS, botById, type SuffragettoBot } from './bots';
export { positionKey, SuffragettoSearch } from './adapter';
export { mulberry32, MATE };
export type { EngineMove };

export interface ChooseOptions {
  rng?: () => number;
  now?: () => number;
  ignoreTime?: boolean;
  maxDepth?: number;
  maxNodes?: number;
  history?: readonly string[];
  /** Optional live game supplies real repetition history and must match `fen`. */
  game?: Game;
}

function seededRandom(fen: string): () => number {
  let seed = 2_166_136_261;
  for (const char of fen) seed = Math.imul(seed ^ char.charCodeAt(0), 16_777_619);
  return mulberry32(seed >>> 0);
}

function assertGameMatches(fen: string, game?: Game): Game | undefined {
  if (game && positionKey(game.fen()) !== positionKey(fen)) throw new Error('options.game is not on the given position');
  return game;
}

function choose(fen: string, bot: SuffragettoBot, options: ChooseOptions): EngineMove | null {
  const game = assertGameMatches(fen, options.game) ?? new Game(fen);
  if (game.isGameOver()) return null;
  const legal = game.legalUci();
  if (!legal.length) return null;

  const rng = options.rng ?? seededRandom(fen);
  if (rng() < bot.blunderRate) {
    const index = Math.floor(Math.max(0, Math.min(0.999999999, rng())) * legal.length);
    return { uci: legal[index]!, score: 0, depth: 0, nodes: 0 };
  }

  const adapter = new SuffragettoSearch(game);
  const result = search(adapter, {
    maxDepth: options.maxDepth ?? bot.maxDepth,
    maxNodes: options.maxNodes ?? bot.maxNodes,
    deadline: options.ignoreTime ? undefined : (options.now ?? Date.now)() + bot.timeMs,
    now: options.now,
    history: options.history,
    contempt: 20,
    exactRootScores: bot.noise > 0,
  });
  if (result.move < 0) return null;
  const selected = pickRootMove(result, bot.noise, rng);
  return {
    uci: adapter.decode(selected.move), score: selected.score,
    depth: result.depth, nodes: result.nodes,
  };
}

/** Picks a legal move for a bot level. Returns null when the game is over. */
export function chooseMove(fen: string, level: SuffragettoBot | number, options: ChooseOptions = {}): EngineMove | null {
  return choose(fen, typeof level === 'number' ? botById(level) : level, options);
}

/** Strongest move within a deterministic search budget, for hints and analysis. */
export function bestMove(
  fen: string,
  options: ChooseOptions & { timeMs?: number } = {},
): EngineMove | null {
  const game = assertGameMatches(fen, options.game) ?? new Game(fen);
  if (game.isGameOver()) return null;
  const adapter = new SuffragettoSearch(game);
  const now = options.now ?? Date.now;
  const result = search(adapter, {
    maxDepth: options.maxDepth ?? 4,
    maxNodes: options.maxNodes ?? 60_000,
    deadline: options.timeMs ? now() + options.timeMs : undefined,
    now,
    history: options.history,
    contempt: 20,
    exactRootScores: false,
  });
  return result.move < 0 ? null : {
    uci: adapter.decode(result.move), score: result.score, depth: result.depth, nodes: result.nodes,
  };
}
