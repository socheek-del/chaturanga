import type { Color, GameStatus } from './types';

/**
 * Every reason a game can end, across every variant and every way a game can end (a position the rules
 * engine reached, or a decision/event outside the position). The single source of truth: `protocol`'s
 * wire schema and `game-shell`'s UI-facing type both derive from this list, so they cannot drift from
 * each other or from `GameStatus` above.
 */
export const RESULT_REASONS = [
  'checkmate',
  'stalemate',
  'repetition',
  'counting',
  'fifty-move',
  'insufficient-material',
  'perpetual-check',
  'perpetual-chase',
  'timeout',
  'resign',
  'agreement',
  'abandon',
] as const;

export type ResultReason = (typeof RESULT_REASONS)[number];

export interface GameResult {
  /** null for a draw */
  winner: Color | null;
  reason: ResultReason;
}

/** The single implementation both `game-shell` and `server-kit` use, so they cannot drift. */
export function resultFromStatus(status: GameStatus): GameResult | null {
  switch (status.kind) {
    case 'ongoing':
      return null;
    case 'checkmate':
    case 'perpetual-check':
    case 'perpetual-chase':
      return { winner: status.winner, reason: status.kind };
    case 'stalemate':
      return { winner: status.winner ?? null, reason: 'stalemate' };
    default:
      return { winner: null, reason: status.kind };
  }
}

/** Endings a takeback cannot reverse: they are decisions or events outside the position. */
export const FINAL_REASONS: readonly ResultReason[] = ['timeout', 'resign', 'agreement', 'abandon'];

export function isUndoableResult(result: GameResult | null): boolean {
  return !result || !FINAL_REASONS.includes(result.reason);
}
