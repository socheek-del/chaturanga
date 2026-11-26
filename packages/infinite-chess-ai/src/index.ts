import { mulberry32 } from '@chaturanga/ai-core';
import { Game } from '@chaturanga/infinite-chess';
import { boundedLegalMoves, parseFen, pointOf } from '@chaturanga/infinite-chess/core';

const VALUE = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 } as const;
const LEVELS = {
  beginner: { rayDistance: 2, noise: 150 },
  club: { rayDistance: 6, noise: 36 },
  strong: { rayDistance: 12, noise: 0 },
} as const;

export type BotLevel = keyof typeof LEVELS;

export interface ChooseMoveOptions {
  level?: BotLevel;
  /** Seed for reproducible tie-breaking and skill noise. Defaults to a fixed, deterministic seed. */
  seed?: number;
}

export interface BotChoice {
  uci: string;
  score: number;
  candidates: number;
}

function opponent(color: 'w' | 'b'): 'w' | 'b' {
  return color === 'w' ? 'b' : 'w';
}

function material(game: Game, color: 'w' | 'b'): number {
  let score = 0;
  for (const { piece } of game.pieces()) {
    score += piece.color === color ? VALUE[piece.type] : -VALUE[piece.type];
  }
  return score;
}

function proximity(game: Game, color: 'w' | 'b'): number {
  const ownKing = game.pieces().find(({ piece }) => piece.color === color && piece.type === 'k');
  const enemyKing = game.pieces().find(({ piece }) => piece.color !== color && piece.type === 'k');
  if (!ownKing || !enemyKing) return 0;
  const target = pointOf(enemyKing.square);
  let score = 0;
  for (const { square, piece } of game.pieces()) {
    if (piece.color !== color || piece.type === 'k') continue;
    const here = pointOf(square);
    const dx = here.x > target.x ? here.x - target.x : target.x - here.x;
    const dy = here.y > target.y ? here.y - target.y : target.y - here.y;
    const distance = dx > dy ? dx : dy;
    if (distance < 40n) score += Number(40n - distance) * (piece.type === 'p' ? 1 : 2);
  }
  return score;
}

function pawnProgress(game: Game, color: 'w' | 'b'): number {
  let score = 0;
  for (const { square, piece } of game.pieces()) {
    if (piece.color !== color || piece.type !== 'p') continue;
    const y = pointOf(square).y;
    const progress = color === 'w' ? y - 2n : 7n - y;
    if (progress > 0n && progress < 6n) score += Number(progress) * 7;
  }
  return score;
}

function evaluate(game: Game, perspective: 'w' | 'b'): number {
  const status = game.status();
  if (status.kind === 'checkmate') return status.winner === perspective ? 1_000_000 : -1_000_000;
  if (status.kind !== 'ongoing') return 0;
  const enemy = opponent(perspective);
  const checkBonus = game.inCheck() ? 45 : 0;
  const kingSquare = game.pieces().find(({ piece }) => piece.color === perspective && piece.type === 'k')?.square;
  const kingPenalty = kingSquare && game.isAttackedAt(enemy, kingSquare) ? 70 : 0;
  return material(game, perspective) + proximity(game, perspective) - proximity(game, enemy) +
    pawnProgress(game, perspective) - pawnProgress(game, enemy) + checkBonus - kingPenalty;
}

/**
 * Selects from a documented finite candidate set. Sliding pieces are considered through a bounded ray
 * distance, distant captures, and exact check-evasion squares; every returned move is still rule-validated.
 */
export function chooseMove(fen: string, options: ChooseMoveOptions = {}): BotChoice | null {
  const level = LEVELS[options.level ?? 'club'];
  const rng = mulberry32(options.seed ?? 0x1f1f1f);
  const root = new Game(fen);
  const perspective = root.turn;
  const candidates = boundedLegalMoves(parseFen(fen), level.rayDistance);
  if (candidates.length === 0) return null;

  let best: BotChoice | null = null;
  let bestNoisyScore = Number.NEGATIVE_INFINITY;
  for (const uci of candidates) {
    const next = new Game(fen);
    next.move(uci);
    const score = evaluate(next, perspective);
    const noisyScore = score + Math.round((rng() * 2 - 1) * level.noise);
    if (noisyScore > bestNoisyScore) {
      bestNoisyScore = noisyScore;
      best = { uci, score, candidates: candidates.length };
    }
  }
  return best;
}

export { LEVELS as BOT_LEVELS };
