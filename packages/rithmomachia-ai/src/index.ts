import { mulberry32, MATE, pickRootMove, search, type EngineMove } from '@chaturanga/ai-core';
import { Game } from '@chaturanga/rithmomachia';
import { botById, type RithmomachiaBot } from './bots';
import { positionKey, RithmomachiaSearch } from './adapter';

export { BOTS, botById, type RithmomachiaBot } from './bots';
export { positionKey, RithmomachiaSearch } from './adapter';
export { mulberry32, MATE };
export type { EngineMove };

export interface ChooseOptions {
  rng?: () => number;
  now?: () => number;
  ignoreTime?: boolean;
  maxDepth?: number;
  maxNodes?: number;
  timeMs?: number;
  history?: readonly string[];
  /** Optional live game supplies exact repetition history and must match `fen`. */
  game?: Game;
}

function seededRandom(fen: string): () => number {
  let seed = 2_166_136_261;
  for (const char of fen) seed = Math.imul(seed ^ char.charCodeAt(0), 16_777_619);
  return mulberry32(seed >>> 0);
}

function gameAt(fen: string, game?: Game): Game {
  if (game && game.fen() !== fen) throw new Error('options.game is not on the given position');
  return game ?? new Game(fen);
}

function choose(fen: string, bot: RithmomachiaBot, options: ChooseOptions): EngineMove | null {
  const game = gameAt(fen, options.game);
  if (game.isGameOver()) return null;
  const legal = game.legalUci();
  if (legal.length === 0) return null;
  const rng = options.rng ?? seededRandom(fen);
  if (rng() < bot.blunderRate) {
    const index = Math.floor(Math.max(0, Math.min(0.999999999, rng())) * legal.length);
    return { uci: legal[index]!, score: 0, depth: 0, nodes: 0 };
  }

  const adapter = new RithmomachiaSearch(game);
  const history = options.history ?? options.game?.moves().map(({ fenAfter }) => positionKey(fenAfter));
  const now = options.now ?? Date.now;
  const result = search(adapter, {
    maxDepth: options.maxDepth ?? bot.maxDepth,
    maxNodes: options.maxNodes ?? bot.maxNodes,
    deadline: options.ignoreTime ? undefined : now() + bot.timeMs,
    now,
    history,
    contempt: 20,
    exactRootScores: bot.noise > 0,
  });
  if (result.move < 0) return null;
  const selected = pickRootMove(result, bot.noise, rng);
  return { uci: adapter.decode(selected.move), score: selected.score, depth: result.depth, nodes: result.nodes };
}

/** Picks a legal move for one of six deterministic bot levels, or null when the game has ended. */
export function chooseMove(fen: string, level: RithmomachiaBot | number, options: ChooseOptions = {}): EngineMove | null {
  return choose(fen, typeof level === 'number' ? botById(level) : level, options);
}

/** Strongest move within a deterministic search budget, used for hints and later review. */
export function bestMove(fen: string, options: ChooseOptions = {}): EngineMove | null {
  const game = gameAt(fen, options.game);
  if (game.isGameOver()) return null;
  const adapter = new RithmomachiaSearch(game);
  const now = options.now ?? Date.now;
  const history = options.history ?? options.game?.moves().map(({ fenAfter }) => positionKey(fenAfter));
  const result = search(adapter, {
    maxDepth: options.maxDepth ?? 4,
    maxNodes: options.maxNodes ?? 20_000,
    deadline: options.ignoreTime ? undefined : now() + (options.timeMs ?? 2_000),
    now,
    history,
    contempt: 20,
  });
  return result.move < 0 ? null : {
    uci: adapter.decode(result.move), score: result.score, depth: result.depth, nodes: result.nodes,
  };
}
