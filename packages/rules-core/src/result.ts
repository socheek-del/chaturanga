import type { Color, GameStatus } from './types';

/**
 * Every reason a game can end, across every variant and every way a game can end (a position the rules
 * engine reached, or a decision/event outside the position). The single source of truth: `protocol`'s
 * wire schema and `game-shell`'s UI-facing type both derive from this list, so they cannot drift from
 * each other or from `GameStatus` above.
 */
export const RESULT_REASONS = [
  'checkmate',
  'restricted-mate',
  'stalemate',
  'repetition',
  'counting',
  'fifty-move',
  'insufficient-material',
  'bare-king',
  'goal-square',
  'progression',
  'elimination',
  'perpetual-check',
  'perpetual-chase',
  'bikjang',
  'double-pass',
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
  /** Present for point-settled multi-seat games, including tied winners. */
  winners?: string[];
  /** Final standings for point-settled multi-seat games. */
  scores?: Record<string, number>;
}

/** The single implementation both `game-shell` and `server-kit` use, so they cannot drift. */
export function resultFromStatus<C extends string>(status: GameStatus<C>): GameResult | null {
  const winnerFields = (winner: C | undefined): Pick<GameResult, 'winner' | 'winners'> => {
    if (winner === 'w' || winner === 'b') return { winner: winner as unknown as Color };
    return winner ? { winner: null, winners: [winner] } : { winner: null };
  };
  switch (status.kind) {
    case 'ongoing':
      return null;
    case 'checkmate':
    case 'perpetual-check':
    case 'perpetual-chase':
    case 'bikjang':
    case 'double-pass':
      return { ...winnerFields(status.winner), reason: status.kind };
    case 'elimination':
    case 'progression':
      return { ...winnerFields(status.winner), reason: status.kind };
    case 'stalemate':
    case 'restricted-mate':
    case 'repetition':
    case 'fifty-move':
    case 'bare-king':
    case 'goal-square':
      return { ...winnerFields(status.winner), reason: status.kind };
    case 'points':
      return {
        winner: Object.keys(status.scores).length === 2
          && (status.winner === 'w' || status.winner === 'b')
          ? status.winner as Color
          : null,
        reason: status.reason === 'resignation' ? 'resign' : status.reason,
        winners: [...status.winners],
        scores: { ...status.scores },
      };
    default:
      return { winner: null, reason: status.kind };
  }
}

/** Endings a takeback cannot reverse: they are decisions or events outside the position. */
export const FINAL_REASONS: readonly ResultReason[] = ['timeout', 'resign', 'agreement', 'abandon'];

export function isUndoableResult(result: GameResult | null): boolean {
  return !result || !FINAL_REASONS.includes(result.reason);
}
