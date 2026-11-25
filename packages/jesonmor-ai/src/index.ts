import { mulberry32, MATE, pickRootMove, search, type EngineMove } from '@chaturanga/ai-core';
import { Game } from '@chaturanga/jesonmor';
import { botById, type JesonMorBot } from './bots';
import { decodeMove, JesonMorSearch, positionKey } from './adapter';

export { BOTS, botById, type JesonMorBot } from './bots';
export { JesonMorSearch, positionKey } from './adapter';

export interface ChooseOptions {
  rng?: () => number;
  now?: () => number;
  ignoreTime?: boolean;
  maxDepth?: number;
  maxNodes?: number;
  history?: readonly string[];
  /** Optional live game supplies actual repetition history and must match `fen`. */
  game?: Game;
}

function assertGameMatches(fen: string, game?: Game): Game | undefined {
  if (game && positionKey(game.fen()) !== positionKey(fen)) throw new Error('options.game is not on the given position');
  return game;
}

function choose(
  fen: string,
  bot: JesonMorBot,
  options: ChooseOptions = {},
): EngineMove | null {
  const now = options.now ?? (() => Date.now());
  const rng = options.rng ?? Math.random;
  const game = assertGameMatches(fen, options.game) ?? new Game(fen);
  if (game.isGameOver()) return null;
  const legal = game.legalUci();
  if (!legal.length) return null;
  if (rng() < bot.blunderRate) {
    const uci = legal[Math.floor(rng() * legal.length)]!;
    return { uci, score: 0, depth: 0, nodes: 0 };
  }
  const searchResult = search(new JesonMorSearch(game), {
    maxDepth: options.maxDepth ?? bot.maxDepth,
    maxNodes: options.maxNodes ?? bot.maxNodes,
    deadline: options.ignoreTime ? undefined : now() + bot.timeMs,
    now,
    history: options.history,
    contempt: 12,
    exactRootScores: bot.noise > 0,
  });
  const selected = pickRootMove(searchResult, bot.noise, rng);
  return selected.move < 0
    ? null
    : { uci: decodeMove(selected.move), score: selected.score, depth: searchResult.depth, nodes: searchResult.nodes };
}

export function chooseMove(fen: string, level: JesonMorBot | number, options: ChooseOptions = {}): EngineMove | null {
  return choose(fen, typeof level === 'number' ? botById(level) : level, options);
}

export function bestMove(
  fen: string,
  options: ChooseOptions & { timeMs?: number } = {},
): EngineMove | null {
  const persona: JesonMorBot = {
    id: 6,
    key: 'champion',
    maxDepth: options.maxDepth ?? 4,
    maxNodes: options.maxNodes ?? 50_000,
    timeMs: options.timeMs ?? 1_000,
    noise: 0,
    blunderRate: 0,
  };
  return choose(fen, persona, options);
}

export { MATE, mulberry32 };
