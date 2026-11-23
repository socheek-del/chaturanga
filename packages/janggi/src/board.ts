/**
 * Numeric board for Janggi: 9 files x 10 ranks = 90 points (pieces stand on line intersections; the
 * point-index model is the same shape rules-core's size-aware coords helpers already support, plat-007).
 *
 * A point holds 0 (empty) or a piece code: type (1..7) | BLACK (8). Janggi has no promotion, so unlike
 * the Makruk-family 8x8 board there is no PROMOTED bit.
 */
import type { Color } from '@chaturanga/rules-core';
import type { Piece, PieceType, Square } from './types';

export const FILES = 9;
export const RANKS = 10;
export const SIZE = FILES * RANKS;

export const SOLDIER = 1;
export const HORSE = 2;
export const ELEPHANT = 3;
export const ADVISOR = 4;
export const CANNON = 5;
export const CHARIOT = 6;
export const GENERAL = 7;
export const BLACK = 8;
export const TYPE_MASK = 7;

export type ColorIndex = 0 | 1;
export type Board = Uint8Array;

export const typeOf = (code: number): number => code & TYPE_MASK;
export const colorIndexOf = (code: number): ColorIndex => (code & BLACK ? 1 : 0);
export const colorBits = (c: ColorIndex): number => (c === 1 ? BLACK : 0);
export const toColor = (c: ColorIndex): Color => (c === 1 ? 'b' : 'w');
export const toColorIndex = (c: Color): ColorIndex => (c === 'b' ? 1 : 0);
export const fileOf = (sq: Square): number => sq % FILES;
export const rankOf = (sq: Square): number => Math.floor(sq / FILES);
export const squareAt = (file: number, rank: number): Square => rank * FILES + file;
export const inBounds = (file: number, rank: number): boolean => file >= 0 && file < FILES && rank >= 0 && rank < RANKS;

/** FEN letter per piece code, lower case; index 0 unused. */
const TYPE_CHARS: readonly string[] = ['', 'p', 'n', 'b', 'a', 'c', 'r', 'k'];
/** SAN letter per piece code -- Janggi SAN spells Horse and Elephant differently from their FEN letters. */
export const SAN_LETTER: readonly string[] = ['', 'P', 'H', 'E', 'A', 'C', 'R', 'K'];

export function typeFromChar(ch: string): number {
  return ch.length === 1 ? Math.max(TYPE_CHARS.indexOf(ch.toLowerCase()), 0) : 0;
}

/** FEN letter: uppercase for Cho (White). */
export function codeToChar(code: number): string {
  const ch = TYPE_CHARS[typeOf(code)]!;
  return code & BLACK ? ch : ch.toUpperCase();
}

export function codeToPiece(code: number): Piece {
  return { color: toColor(colorIndexOf(code)), type: TYPE_CHARS[typeOf(code)] as PieceType, promoted: false };
}

const ORTHOGONAL: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];
const DIAGONAL: ReadonlyArray<readonly [number, number]> = [
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

/** True when (file, rank) is inside colour c's 3x3 palace (files d-f, ranks 1-3 or 8-10). */
function inPalace(file: number, rank: number, c: ColorIndex): boolean {
  if (file < 3 || file > 5) return false;
  return c === 0 ? rank >= 0 && rank <= 2 : rank >= 7 && rank <= 9;
}

/** True on a point where the palace diagonals run: the four corners and the centre of either palace. */
export function onPalaceDiagonal(sq: Square): boolean {
  const file = fileOf(sq);
  const rank = rankOf(sq);
  return (inPalace(file, rank, 0) && (file + rank) % 2 === 1) || (inPalace(file, rank, 1) && (file + rank) % 2 === 0 && rank >= 7);
}

function perColor<T>(build: (c: ColorIndex) => T[]): readonly [T[], T[]] {
  return [build(0), build(1)];
}

/** General and advisor alike: one step along a line of their own palace, drawn diagonals included. */
export const PALACE_TARGETS: readonly [Square[][], Square[][]] = perColor((c) =>
  Array.from({ length: SIZE }, (_, sq) => {
    const file = fileOf(sq);
    const rank = rankOf(sq);
    if (!inPalace(file, rank, c)) return [];
    const targets: Square[] = [];
    for (const [df, dr] of ORTHOGONAL) {
      if (inPalace(file + df, rank + dr, c)) targets.push(squareAt(file + df, rank + dr));
    }
    if (!onPalaceDiagonal(sq)) return targets;
    for (const [df, dr] of DIAGONAL) {
      if (inPalace(file + df, rank + dr, c)) targets.push(squareAt(file + df, rank + dr));
    }
    return targets;
  }),
);

/** The four diagonals that continue an orthogonal step outward. */
const OUTWARD: ReadonlyArray<readonly [number, number, number, number]> = ORTHOGONAL.flatMap(([df, dr]) =>
  [1, -1].map((side) => [df, dr, df || side, dr || side] as const),
);

export interface HorseTarget {
  to: Square;
  /** The orthogonally adjacent "leg"; the move is blocked when any piece sits there. */
  leg: Square;
}

/** Horse: one step along a line, then one diagonally outward; blocked when the first point is occupied. */
export const HORSE_TARGETS: readonly HorseTarget[][] = Array.from({ length: SIZE }, (_, sq) => {
  const file = fileOf(sq);
  const rank = rankOf(sq);
  const targets: HorseTarget[] = [];
  for (const [lf, lr, df, dr] of OUTWARD) {
    if (!inBounds(file + lf + df, rank + lr + dr)) continue;
    targets.push({ to: squareAt(file + lf + df, rank + lr + dr), leg: squareAt(file + lf, rank + lr) });
  }
  return targets;
});

/** Inverse of HORSE_TARGETS: for a square, the {from, leg} pairs from which a horse could attack it. */
export const HORSE_ATTACKERS: readonly HorseTarget[][] = Array.from({ length: SIZE }, () => []);
HORSE_TARGETS.forEach((targets, from) => {
  for (const { to, leg } of targets) HORSE_ATTACKERS[to]!.push({ to: from, leg });
});

export interface ElephantTarget {
  to: Square;
  /** The two points passed over, in order; the move is blocked when either is occupied. */
  first: Square;
  second: Square;
}

/** Elephant: one step along a line, then two diagonally outward, over the whole board. */
export const ELEPHANT_TARGETS: readonly ElephantTarget[][] = Array.from({ length: SIZE }, (_, sq) => {
  const file = fileOf(sq);
  const rank = rankOf(sq);
  const targets: ElephantTarget[] = [];
  for (const [lf, lr, df, dr] of OUTWARD) {
    if (!inBounds(file + lf + 2 * df, rank + lr + 2 * dr)) continue;
    targets.push({
      to: squareAt(file + lf + 2 * df, rank + lr + 2 * dr),
      first: squareAt(file + lf, rank + lr),
      second: squareAt(file + lf + df, rank + lr + dr),
    });
  }
  return targets;
});

/** Inverse of ELEPHANT_TARGETS (`to` is where the elephant stands). */
export const ELEPHANT_ATTACKERS: readonly ElephantTarget[][] = Array.from({ length: SIZE }, () => []);
ELEPHANT_TARGETS.forEach((targets, from) => {
  for (const { to, first, second } of targets) ELEPHANT_ATTACKERS[to]!.push({ to: from, first, second });
});

/** Soldier: one step forward or sideways from the start; also diagonally forward along a palace diagonal. */
export const SOLDIER_TARGETS: readonly [Square[][], Square[][]] = perColor((c) =>
  Array.from({ length: SIZE }, (_, sq) => {
    const file = fileOf(sq);
    const rank = rankOf(sq);
    const forward = c === 0 ? 1 : -1;
    const targets: Square[] = [];
    for (const [df, dr] of [[0, forward], [-1, 0], [1, 0]] as const) {
      if (inBounds(file + df, rank + dr)) targets.push(squareAt(file + df, rank + dr));
    }
    if (onPalaceDiagonal(sq)) {
      for (const df of [-1, 1]) {
        if (!inBounds(file + df, rank + forward)) continue;
        const to = squareAt(file + df, rank + forward);
        if (onPalaceDiagonal(to)) targets.push(to);
      }
    }
    return targets;
  }),
);

/** Inverse of SOLDIER_TARGETS: for a square, the squares a soldier of that colour could attack it from. */
export const SOLDIER_ATTACKERS: readonly [Square[][], Square[][]] = perColor(() =>
  Array.from({ length: SIZE }, () => [] as Square[]),
);
for (const c of [0, 1] as const) {
  SOLDIER_TARGETS[c].forEach((targets, from) => {
    for (const to of targets) SOLDIER_ATTACKERS[c][to]!.push(from);
  });
}

/**
 * Chariot and cannon lines from each point, ordered outward: the four orthogonal rays, plus the palace
 * diagonals from a point they run through. A line works the same from either end, so the same table answers
 * both "where can it go" and "from where is this point attacked".
 */
export const RAYS: readonly Square[][][] = Array.from({ length: SIZE }, (_, sq) => {
  const file = fileOf(sq);
  const rank = rankOf(sq);
  const trace = (df: number, dr: number, allowed: (sq: Square) => boolean): Square[] => {
    const ray: Square[] = [];
    for (let f = file + df, r = rank + dr; inBounds(f, r) && allowed(squareAt(f, r)); f += df, r += dr) ray.push(squareAt(f, r));
    return ray;
  };
  const rays = ORTHOGONAL.map(([df, dr]) => trace(df, dr, () => true));
  if (onPalaceDiagonal(sq)) rays.push(...DIAGONAL.map(([df, dr]) => trace(df, dr, onPalaceDiagonal)));
  return rays.filter((ray) => ray.length > 0);
});
