/**
 * Numeric board for Xiangqi: 9 files x 10 ranks = 90 points (pieces stand on line intersections; the
 * point-index model is the same shape rules-core's size-aware coords helpers already support, plat-007).
 *
 * A point holds 0 (empty) or a piece code: type (1..7) | BLACK (8). Xiangqi has no promotion, so unlike
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
/** SAN letter per piece code -- Xiangqi SAN spells Horse and Elephant differently from their FEN letters. */
export const SAN_LETTER: readonly string[] = ['', 'P', 'H', 'E', 'A', 'C', 'R', 'K'];

export function typeFromChar(ch: string): number {
  return ch.length === 1 ? Math.max(TYPE_CHARS.indexOf(ch.toLowerCase()), 0) : 0;
}

/** FEN letter: uppercase for Red/White. */
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

/** True when rank is on colour c's own side of the river (the general/advisor/elephant/soldier side). */
function inOwnHalf(rank: number, c: ColorIndex): boolean {
  return c === 0 ? rank <= 4 : rank >= 5;
}

/** True once a soldier on this rank has crossed the river and may also step sideways. */
function hasCrossedRiver(rank: number, c: ColorIndex): boolean {
  return c === 0 ? rank >= 5 : rank <= 4;
}

function perColor<T>(build: (c: ColorIndex) => T[]): readonly [T[], T[]] {
  return [build(0), build(1)];
}

/** General: one orthogonal step, confined to its own palace. */
export const GENERAL_TARGETS: readonly [Square[][], Square[][]] = perColor((c) =>
  Array.from({ length: SIZE }, (_, sq) => {
    const file = fileOf(sq);
    const rank = rankOf(sq);
    if (!inPalace(file, rank, c)) return [];
    const targets: Square[] = [];
    for (const [df, dr] of ORTHOGONAL) {
      const nf = file + df;
      const nr = rank + dr;
      if (inPalace(nf, nr, c)) targets.push(squareAt(nf, nr));
    }
    return targets;
  }),
);

/** Advisor: one diagonal step, confined to its own palace. */
export const ADVISOR_TARGETS: readonly [Square[][], Square[][]] = perColor((c) =>
  Array.from({ length: SIZE }, (_, sq) => {
    const file = fileOf(sq);
    const rank = rankOf(sq);
    if (!inPalace(file, rank, c)) return [];
    const targets: Square[] = [];
    for (const [df, dr] of DIAGONAL) {
      const nf = file + df;
      const nr = rank + dr;
      if (inPalace(nf, nr, c)) targets.push(squareAt(nf, nr));
    }
    return targets;
  }),
);

export interface ElephantTarget {
  to: Square;
  /** The diagonal midpoint ("eye"); the move is blocked when any piece sits there. */
  eye: Square;
}

/** Elephant: exactly two points diagonally, never crossing the river, blocked by its "eye". */
export const ELEPHANT_TARGETS: readonly [ElephantTarget[][], ElephantTarget[][]] = perColor((c) =>
  Array.from({ length: SIZE }, (_, sq) => {
    const file = fileOf(sq);
    const rank = rankOf(sq);
    const targets: ElephantTarget[] = [];
    for (const [df, dr] of DIAGONAL) {
      const nf = file + 2 * df;
      const nr = rank + 2 * dr;
      if (!inBounds(nf, nr) || !inOwnHalf(nr, c)) continue;
      targets.push({ to: squareAt(nf, nr), eye: squareAt(file + df, rank + dr) });
    }
    return targets;
  }),
);

export interface HorseTarget {
  to: Square;
  /** The orthogonally adjacent "leg"; the move is blocked when any piece sits there. */
  leg: Square;
}

/** [df, dr, legDf, legDr] for each of a horse's 8 leaps; the leg is the single step in the long axis. */
const HORSE_DELTAS: ReadonlyArray<readonly [number, number, number, number]> = [
  [1, 2, 0, 1],
  [2, 1, 1, 0],
  [2, -1, 1, 0],
  [1, -2, 0, -1],
  [-1, -2, 0, -1],
  [-2, -1, -1, 0],
  [-2, 1, -1, 0],
  [-1, 2, 0, 1],
];

/** Horse: knight-shaped leap, blocked by an orthogonal "leg" piece adjacent to its own square. */
export const HORSE_TARGETS: readonly HorseTarget[][] = Array.from({ length: SIZE }, (_, sq) => {
  const file = fileOf(sq);
  const rank = rankOf(sq);
  const targets: HorseTarget[] = [];
  for (const [df, dr, lf, lr] of HORSE_DELTAS) {
    const nf = file + df;
    const nr = rank + dr;
    if (!inBounds(nf, nr)) continue;
    targets.push({ to: squareAt(nf, nr), leg: squareAt(file + lf, rank + lr) });
  }
  return targets;
});

/** Inverse of HORSE_TARGETS: for a square, the {from, leg} pairs from which a horse could attack it. */
export const HORSE_ATTACKERS: readonly HorseTarget[][] = Array.from({ length: SIZE }, () => []);
HORSE_TARGETS.forEach((targets, from) => {
  for (const { to, leg } of targets) (HORSE_ATTACKERS[to] as HorseTarget[]).push({ to: from, leg });
});

/** Soldier: one step forward always; also sideways (never backward) once it has crossed the river. */
export const SOLDIER_TARGETS: readonly [Square[][], Square[][]] = perColor((c) =>
  Array.from({ length: SIZE }, (_, sq) => {
    const file = fileOf(sq);
    const rank = rankOf(sq);
    const forwardDr = c === 0 ? 1 : -1;
    const targets: Square[] = [];
    if (inBounds(file, rank + forwardDr)) targets.push(squareAt(file, rank + forwardDr));
    if (hasCrossedRiver(rank, c)) {
      if (inBounds(file - 1, rank)) targets.push(squareAt(file - 1, rank));
      if (inBounds(file + 1, rank)) targets.push(squareAt(file + 1, rank));
    }
    return targets;
  }),
);

/** Inverse of SOLDIER_TARGETS: for a square, the squares an enemy soldier could attack it from. */
export const SOLDIER_ATTACKERS: readonly [Square[][], Square[][]] = perColor(() =>
  Array.from({ length: SIZE }, () => [] as Square[]),
);
for (const c of [0, 1] as const) {
  SOLDIER_TARGETS[c].forEach((targets, from) => {
    for (const to of targets) (SOLDIER_ATTACKERS[c][to] as Square[]).push(from);
  });
}

/** Chariot/cannon rays: for each square, 4 arrays of squares ordered outward (N, S, E, W-equivalent). */
export const RAYS: readonly Square[][][] = Array.from({ length: SIZE }, (_, sq) => {
  const file = fileOf(sq);
  const rank = rankOf(sq);
  return ORTHOGONAL.map(([df, dr]) => {
    const ray: Square[] = [];
    let nf = file + df;
    let nr = rank + dr;
    while (inBounds(nf, nr)) {
      ray.push(squareAt(nf, nr));
      nf += df;
      nr += dr;
    }
    return ray;
  });
});
