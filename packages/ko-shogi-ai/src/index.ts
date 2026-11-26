import { MATE, mulberry32, pickRootMove, search, type EngineMove } from '@chaturanga/ai-core';
import { Game } from '@chaturanga/ko-shogi';
import type { KoShogiBot } from './bots';
import { BOTS, botById } from './bots';
import { KoShogiSearch, positionKey } from './adapter';

export { BOTS, botById, type KoShogiBot } from './bots';
export { KoShogiSearch, positionKey } from './adapter';
export { evaluate, PIECE_VALUE } from './evaluate';
export { mulberry32, MATE };
export type { EngineMove };

export interface ChooseOptions {
  /** Inject a deterministic source for bot noise and blunders. */
  rng?: () => number;
  now?: () => number;
  ignoreTime?: boolean;
  history?: readonly string[];
  /** Optional live game supplies full repetition history and must match the position. */
  game?: Game;
}

function seededRandom(fen: string, level: number): () => number {
  let seed = 2_166_136_261 ^ level;
  for (const char of fen) seed = Math.imul(seed ^ char.charCodeAt(0), 16_777_619);
  return mulberry32(seed >>> 0);
}

function gameAt(fen: string, game?: Game): Game {
  if (game && game.fen() !== fen) throw new Error('options.game is not on the given position');
  return game ?? new Game(fen);
}

/** Picks a legal move for either color; returns null after the game ends. */
export function chooseMove(fen: string, level: KoShogiBot | number, options: ChooseOptions = {}): EngineMove | null {
  const persona = typeof level === 'number' ? botById(level) : level;
  const game = gameAt(fen, options.game);
  if (game.status().kind !== 'ongoing') return null;
  const adapter = new KoShogiSearch(game, persona.maxRootMoves, persona.maxMovesPerPiece);
  const legal = adapter.legalMoves();
  if (legal.length === 0) return null;
  const rng = options.rng ?? seededRandom(fen, persona.id);
  if (rng() < persona.blunderRate) {
    const code = legal[Math.floor(Math.min(0.999999999, Math.max(0, rng())) * legal.length)]!;
    return { uci: adapter.decode(code), score: 0, depth: 0, nodes: 0 };
  }
  const now = options.now ?? (() => Date.now());
  const history = options.history ?? game.moves().map(({ fenAfter }) => positionKey(fenAfter));
  const result = search(adapter, {
    maxDepth: persona.maxDepth,
    maxNodes: persona.maxNodes,
    deadline: options.ignoreTime ? undefined : now() + persona.timeMs,
    now,
    history,
    contempt: 20,
    exactRootScores: persona.noise > 0,
  });
  if (result.move < 0) return null;
  const picked = persona.noise > 0 ? pickRootMove(result, persona.noise, rng) : result.rootMoves[0]!;
  const selected = picked.score >= MATE - 100 ? result.move : picked.move;
  return { uci: adapter.decode(selected), score: picked.score, depth: result.depth, nodes: result.nodes };
}

/** Strongest configured bot choice within the same deterministic root-evaluation budget. */
export function bestMove(fen: string, options: ChooseOptions & { timeMs?: number; maxNodes?: number } = {}): EngineMove | null {
  const game = gameAt(fen, options.game);
  if (game.status().kind !== 'ongoing') return null;
  const adapter = new KoShogiSearch(game, BOTS.at(-1)!.maxRootMoves, BOTS.at(-1)!.maxMovesPerPiece);
  if (adapter.legalMoves().length === 0) return null;
  const now = options.now ?? (() => Date.now());
  const history = options.history ?? game.moves().map(({ fenAfter }) => positionKey(fenAfter));
  const result = search(adapter, {
    maxDepth: 1,
    maxNodes: options.maxNodes ?? BOTS.at(-1)!.maxNodes,
    deadline: options.ignoreTime ? undefined : (options.timeMs ?? BOTS.at(-1)!.timeMs) + now(),
    now,
    history,
    contempt: 20,
    exactRootScores: false,
  });
  return result.move < 0 ? null : { uci: adapter.decode(result.move), score: result.score, depth: result.depth, nodes: result.nodes };
}
