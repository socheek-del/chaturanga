import { type EngineMove, mulberry32, pickRootMove, search } from '@chaturanga/ai-core';
import { Game } from '@chaturanga/congo';
import { CongoSearch, evaluate, keyOfFen, PIECE_VALUE } from './adapter';
import { botById, type CongoBot } from './bots';

export { CongoSearch, evaluate, keyOfFen, PIECE_VALUE };
export { BOTS, botById, type CongoBot } from './bots';
export { mulberry32, type EngineMove };

const DEFAULT_CONTEMPT = 20;

export interface ChooseOptions {
  rng?: () => number;
  now?: () => number;
  ignoreTime?: boolean;
  history?: readonly string[];
}

export function chooseMove(fen: string, level: CongoBot | number, options: ChooseOptions = {}): EngineMove | null {
  const persona = typeof level === 'number' ? botById(level) : level;
  const rng = options.rng ?? mulberry32(0);
  const now = options.now ?? (() => Date.now());
  const game = new Game(fen);
  const adapter = new CongoSearch(game);
  const legal = adapter.legalMoves();
  if (legal.length === 0) return null;

  if (persona.blunderRate > 0 && rng() < persona.blunderRate) {
    const move = legal[Math.floor(rng() * legal.length)]!;
    return { uci: adapter.toUci(move), score: 0, depth: 0, nodes: 0 };
  }

  const result = search(adapter, {
    maxDepth: persona.maxDepth,
    maxNodes: persona.maxNodes,
    deadline: options.ignoreTime ? undefined : now() + persona.timeMs,
    now,
    history: options.history,
    contempt: DEFAULT_CONTEMPT,
    exactRootScores: persona.noise > 0,
  });
  if (result.move < 0) return null;
  const selected = pickRootMove(result, persona.noise, rng);
  return { uci: adapter.toUci(selected.move), score: selected.score, depth: result.depth, nodes: result.nodes };
}

export function bestMove(
  fen: string,
  options: { maxDepth?: number; maxNodes?: number; timeMs?: number; now?: () => number; history?: readonly string[] } = {},
): EngineMove | null {
  const now = options.now ?? (() => Date.now());
  const adapter = new CongoSearch(new Game(fen));
  if (adapter.legalMoves().length === 0) return null;
  const result = search(adapter, {
    maxDepth: options.maxDepth ?? 5,
    maxNodes: options.maxNodes ?? 60_000,
    deadline: options.timeMs ? now() + options.timeMs : undefined,
    now,
    history: options.history,
    contempt: DEFAULT_CONTEMPT,
    exactRootScores: false,
  });
  if (result.move < 0) return null;
  return { uci: adapter.toUci(result.move), score: result.score, depth: result.depth, nodes: result.nodes };
}
