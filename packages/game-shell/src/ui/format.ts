import type { GameStatus, VariantMoveRecord } from '@chaturanga/rules-core';

/** m:ss, or s.t under ten seconds. */
export function formatClock(ms: number): string {
  const clamped = Math.max(0, ms);
  if (clamped < 10_000) return `${Math.floor(clamped / 1000)}.${Math.floor((clamped % 1000) / 100)}`;
  const total = Math.ceil(clamped / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/** Keeps floating-point material sums readable while retaining common half-point values. */
export function formatAdvantage(value: number): string | null {
  const rounded = Math.round(value * 10) / 10;
  return rounded > 0 ? `+${rounded}` : null;
}

/** Sounds the game screen asks for. Each product decides how one is played, or plays nothing. */
export type GameSound = 'move' | 'capture' | 'check' | 'gameEnd';

export function soundForMove(record: VariantMoveRecord, status: GameStatus): GameSound {
  if (status.kind !== 'ongoing') return 'gameEnd';
  if (record.san.endsWith('+')) return 'check';
  return record.captured ? 'capture' : 'move';
}
