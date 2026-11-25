/**
 * Square-coordinate helpers for a board of any size (files x ranks), shared by every variant's
 * conformance suite, the lesson player, and packages that parse or print engine move strings.
 * `packages/board-ui/src/coords.ts` re-exports `squareNameOf` and `squareOf` so its public API is
 * unchanged; the Makruk-family engines keep using the fixed 8x8 `squareName`/`parseSquare` in
 * `board8.ts`.
 */
import type { Square } from './types';

const FILE_LETTERS = 'abcdefghijklmnopqrstuvwxyz';

/** Square index (rank * files + file, a1 = 0) to its name, e.g. `e4` or `i10`. */
export function squareNameOf(square: Square, files: number): string {
  return FILE_LETTERS[square % files]! + String(Math.floor(square / files) + 1);
}

/** Square name to index, or null when it is not a square name. */
export function squareOf(name: string, files: number): Square | null {
  const match = /^([a-z])(\d{1,2})$/.exec(name);
  if (!match) return null;
  const file = match[1]!.charCodeAt(0) - 97;
  const rank = Number(match[2]);
  if (file >= files || rank < 1) return null;
  return (rank - 1) * files + file;
}
