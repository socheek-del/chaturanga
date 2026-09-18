/**
 * Numeric 8x8 board shared by the Makruk-family engines (Makruk, Sittuyin).
 *
 * A square holds 0 (empty) or a piece code: type (1..6) | BLACK (8) | PROMOTED (16).
 * Squares are 0..63 with a1 = 0. Colour index: 0 = White, 1 = Black.
 * The six piece types move the same way in these games: pawn, knight, silver general (Makruk Khon,
 * Sittuyin Sin), ferz (Makruk Met, Sittuyin Sit-ke), rook and king. Letters are each engine's own.
 */
import type { Color, Square } from './types';

export const PAWN = 1;
export const KNIGHT = 2;
/** One step diagonally or straight forward. */
export const SILVER = 3;
/** One step diagonally. */
export const FERZ = 4;
export const ROOK = 5;
export const KING = 6;
export const BLACK = 8;
export const PROMOTED = 16;
export const TYPE_MASK = 7;

export type ColorIndex = 0 | 1;
export type Board = Uint8Array;

export const typeOf = (code: number): number => code & TYPE_MASK;
export const colorIndexOf = (code: number): ColorIndex => (code & BLACK ? 1 : 0);
export const colorBits = (c: ColorIndex): number => (c === 1 ? BLACK : 0);
export const toColor = (c: ColorIndex): Color => (c === 1 ? 'b' : 'w');
export const toColorIndex = (c: Color): ColorIndex => (c === 'b' ? 1 : 0);
export const fileOf = (sq: Square): number => sq & 7;
export const rankOf = (sq: Square): number => sq >> 3;

export function squareName(sq: Square): string {
  return 'abcdefgh'[fileOf(sq)]! + String(rankOf(sq) + 1);
}

/** Returns -1 for an invalid square name. */
export function parseSquare(name: string): Square {
  if (!/^[a-h][1-8]$/.test(name)) return -1;
  return (name.charCodeAt(1) - 49) * 8 + (name.charCodeAt(0) - 97);
}

function leaper(deltas: ReadonlyArray<readonly [number, number]>): Square[][] {
  const table: Square[][] = [];
  for (let sq = 0; sq < 64; sq++) {
    const list: Square[] = [];
    for (const [df, dr] of deltas) {
      const f = fileOf(sq) + df;
      const r = rankOf(sq) + dr;
      if (f >= 0 && f < 8 && r >= 0 && r < 8) list.push(r * 8 + f);
    }
    table.push(list);
  }
  return table;
}

const DIAGONALS = [
  [1, 1],
  [-1, 1],
  [1, -1],
  [-1, -1],
] as const;
const ORTHOGONALS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

export const KNIGHT_TARGETS = leaper([
  [1, 2],
  [2, 1],
  [2, -1],
  [1, -2],
  [-1, -2],
  [-2, -1],
  [-2, 1],
  [-1, 2],
]);
export const KING_TARGETS = leaper([...DIAGONALS, ...ORTHOGONALS]);
export const FERZ_TARGETS = leaper(DIAGONALS);
/** Silver general targets, indexed by colour (forward is up the board for White). */
export const SILVER_TARGETS: readonly [Square[][], Square[][]] = [
  leaper([...DIAGONALS, [0, 1]]),
  leaper([...DIAGONALS, [0, -1]]),
];
/** Pawn capture targets, indexed by colour. */
export const PAWN_CAPTURES: readonly [Square[][], Square[][]] = [
  leaper([
    [1, 1],
    [-1, 1],
  ]),
  leaper([
    [1, -1],
    [-1, -1],
  ]),
];
function rays(directions: ReadonlyArray<readonly [number, number]>): Square[][][] {
  return Array.from({ length: 64 }, (_, sq) =>
    directions.map(([df, dr]) => {
      const ray: Square[] = [];
      let f = fileOf(sq) + df;
      let r = rankOf(sq) + dr;
      while (f >= 0 && f < 8 && r >= 0 && r < 8) {
        ray.push(r * 8 + f);
        f += df;
        r += dr;
      }
      return ray;
    }),
  );
}

/** Rook rays: for each square, 4 arrays of squares ordered outward. */
export const ROOK_RAYS: Square[][][] = rays(ORTHOGONALS);
/**
 * Diagonal-slider rays, ordered outward like `ROOK_RAYS`. The Makruk family has no diagonal slider; chess
 * (bishop, queen) does.
 */
export const BISHOP_RAYS: Square[][][] = rays(DIAGONALS);
