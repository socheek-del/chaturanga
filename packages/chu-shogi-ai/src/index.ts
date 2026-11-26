import { MATE, mulberry32, pickRootMove, search, type EngineMove } from '@chaturanga/ai-core';
import { Game, generateMoves, parseFen } from '@chaturanga/chu-shogi';
import type { ChuBot } from './bots';
import { botById } from './bots';
import { ChuSearch, positionKey, searchPosition } from './adapter';

export { mulberry32 };
export { BOTS, botById, type ChuBot } from './bots';
export { ChuSearch, encodeMove, positionKey, searchPosition } from './adapter';
export { evaluate, PIECE_VALUE } from './evaluate';
export type { EngineMove };

export interface ChooseOptions {
  /** Inject a seeded random source for reproducible noise and blunders. */
  rng?: () => number;
  now?: () => number;
  ignoreTime?: boolean;
  history?: readonly string[];
  game?: Game;
}

function matchingGame(fen: string, game?: Game): Game {
  if (game && game.fen() !== fen) throw new Error('options.game is not on the given position');
  return game ?? new Game(fen);
}

/** Picks a complete route or promotion move for either color. Returns null after the game has ended. */
export function chooseMove(fen: string, level: ChuBot | number, options: ChooseOptions = {}): EngineMove | null {
  const persona = typeof level === 'number' ? botById(level) : level;
  const rng = options.rng ?? mulberry32(1);
  const now = options.now ?? (() => Date.now());
  const game = matchingGame(fen, options.game);
  if (game.status().kind !== 'ongoing') return null;
  const position = searchPosition(parseFen(fen));
  const adapter = new ChuSearch(position, game);
  const legal = adapter.legalMoves();
  if (legal.length === 0) return null;

  if (rng() < persona.blunderRate) {
    const code = legal[Math.floor(rng() * legal.length)]!;
    return { uci: adapter.moveUci(code), score: 0, depth: 0, nodes: 0 };
  }

  const result = search(adapter, {
    maxDepth: persona.maxDepth,
    maxNodes: persona.maxNodes,
    deadline: options.ignoreTime ? undefined : now() + persona.timeMs,
    now,
    history: options.history ?? [positionKey(fen)],
    contempt: 24,
    exactRootScores: persona.noise > 0,
  });
  if (result.move < 0) return null;
  const picked = persona.noise > 0 ? pickRootMove(result, persona.noise, rng) : result.rootMoves[0]!;
  if (picked.score >= MATE - 64) return { uci: adapter.moveUci(result.move), score: picked.score, depth: result.depth, nodes: result.nodes };
  return { uci: adapter.moveUci(picked.move), score: picked.score, depth: result.depth, nodes: result.nodes };
}

export function bestMove(
  fen: string,
  options: { maxDepth?: number; maxNodes?: number; timeMs?: number; now?: () => number; history?: readonly string[]; game?: Game } = {},
): EngineMove | null {
  const now = options.now ?? (() => Date.now());
  const game = matchingGame(fen, options.game);
  if (game.status().kind !== 'ongoing') return null;
  const adapter = new ChuSearch(searchPosition(parseFen(fen)), game);
  if (adapter.legalMoves().length === 0) return null;
  const result = search(adapter, {
    maxDepth: options.maxDepth ?? 3,
    maxNodes: options.maxNodes ?? 35_000,
    deadline: options.timeMs ? now() + options.timeMs : undefined,
    now,
    history: options.history ?? [positionKey(fen)],
    contempt: 24,
    exactRootScores: false,
  });
  return result.move < 0
    ? null
    : { uci: adapter.moveUci(result.move), score: result.score, depth: result.depth, nodes: result.nodes };
}

export function legalRouteCount(fen: string): number {
  return generateMoves(parseFen(fen)).length;
}
