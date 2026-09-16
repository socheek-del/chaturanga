import type { Color } from '@chaturanga/rules-core';

/**
 * `ResultReason`, `GameResult`, `resultFromStatus`, `FINAL_REASONS` and `isUndoableResult` live in
 * `@chaturanga/rules-core` (the single implementation `server-kit` also uses, so the two cannot drift).
 */
export {
  FINAL_REASONS,
  type GameResult,
  isUndoableResult,
  resultFromStatus,
  type ResultReason,
} from '@chaturanga/rules-core';

/** Pieces captured by `color`, in capture order. */
export function capturedBy<P>(records: ReadonlyArray<{ color: Color; captured: P | null }>, color: Color): P[] {
  return records.filter((r) => r.color === color && r.captured).map((r) => r.captured!);
}

/** Material on the board by the game's own piece values: positive when White is ahead. */
export function materialBalance(
  game: { pieces(): ReadonlyArray<{ piece: { color: Color; type: string } }> },
  values: Readonly<Record<string, number>>,
): number {
  return game.pieces().reduce((sum, { piece }) => sum + (piece.color === 'w' ? 1 : -1) * (values[piece.type] ?? 0), 0);
}
