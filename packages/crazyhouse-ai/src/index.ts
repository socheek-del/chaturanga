import { type EngineMove, pickRootMove, search } from '@chaturanga/ai-core';
import { Game } from '@chaturanga/crazyhouse';
import { CrazyhouseSearch, fenKey } from './adapter';
import { botById, type CrazyhouseBot } from './bots';

export { CrazyhouseSearch, fenKey, positionKey } from './adapter';
export { BOTS, botById, type CrazyhouseBot } from './bots';
export { evaluate, materialBalance, PIECE_VALUE } from './evaluate';
export type { EngineMove };
export { mulberry32 } from '@chaturanga/ai-core';

const DEFAULT_CONTEMPT = 25;
const CONVERSION_MARGIN = 650;

export interface ChooseOptions {
  rng?: () => number;
  now?: () => number;
  ignoreTime?: boolean;
  history?: readonly string[];
}

export function inConversion(fen: string): boolean {
  const game = new Game(fen);
  const adapter = new CrazyhouseSearch(game.fen());
  return adapter.materialFor(adapter.turn()) >= CONVERSION_MARGIN;
}

export function chooseMove(fen: string, level: CrazyhouseBot | number, options: ChooseOptions = {}): EngineMove | null {
  const persona = typeof level === 'number' ? botById(level) : level;
  const rng = options.rng ?? Math.random;
  const now = options.now ?? (() => Date.now());
  const adapter = new CrazyhouseSearch(fen);
  const legal = adapter.legalMoves();
  if (legal.length === 0) return null;

  const bot = adapter.materialFor(adapter.turn()) >= CONVERSION_MARGIN
    ? { ...persona, noise: 0, blunderRate: 0, maxDepth: persona.maxDepth + 1 }
    : persona;
  if (bot.blunderRate > 0 && rng() < bot.blunderRate) {
    const move = legal[Math.floor(rng() * legal.length)]!;
    return { uci: adapter.toUci(move), score: 0, depth: 0, nodes: 0 };
  }

  const result = search(adapter, {
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
  return { uci: adapter.toUci(chosen.move), score: chosen.score, depth: result.depth, nodes: result.nodes };
}

export function bestMove(
  fen: string,
  options: { maxDepth?: number; maxNodes?: number; timeMs?: number; now?: () => number; history?: readonly string[] } = {},
): EngineMove | null {
  const now = options.now ?? (() => Date.now());
  const adapter = new CrazyhouseSearch(fen);
  if (adapter.legalMoves().length === 0) return null;
  const result = search(adapter, {
    maxDepth: options.maxDepth ?? 5,
    maxNodes: options.maxNodes ?? 80_000,
    deadline: options.timeMs ? now() + options.timeMs : undefined,
    now,
    history: options.history,
    contempt: DEFAULT_CONTEMPT,
    exactRootScores: false,
  });
  if (result.move < 0) return null;
  const chosen = result.rootMoves[0]!;
  return { uci: adapter.toUci(chosen.move), score: chosen.score, depth: result.depth, nodes: result.nodes };
}

export const keyOfFen = fenKey;
