/**
 * Numeric board for Shogi: 9 files x 9 ranks = 81 squares.
 *
 * A square holds 0 (empty) or a piece code: type (1..8) | PROMOTED (16) | BLACK (32). Unlike the
 * Makruk-family board, the promoted bit changes how a piece moves — a promoted pawn, lance, knight or
 * silver moves as a gold, a promoted bishop or rook keeps its own moves and adds the king's.
 *
 * File `a` is the left edge and rank 1 is Sente's back rank, matching Fairy-Stockfish's coordinates. The
 * traditional 9..1 / 一..九 labels a player sees are a display mapping in the app, never in the rules.
 */
import type { Color } from '@chaturanga/rules-core';
import type { Piece, PieceType, Square } from './types';

export const FILES = 9;
export const RANKS = 9;
export const SIZE = FILES * RANKS;

export const PAWN = 1;
export const LANCE = 2;
export const KNIGHT = 3;
export const SILVER = 4;
export const GOLD = 5;
export const BISHOP = 6;
export const ROOK = 7;
export const KING = 8;
export const PROMOTED = 16;
export const BLACK = 32;
export const TYPE_MASK = 15;

export type ColorIndex = 0 | 1;
export type Board = Uint8Array;

export const typeOf = (code: number): number => code & TYPE_MASK;
export const isPromoted = (code: number): boolean => (code & PROMOTED) !== 0;
export const colorIndexOf = (code: number): ColorIndex => (code & BLACK ? 1 : 0);
export const colorBits = (c: ColorIndex): number => (c === 1 ? BLACK : 0);
export const toColor = (c: ColorIndex): Color => (c === 1 ? 'b' : 'w');
export const toColorIndex = (c: Color): ColorIndex => (c === 'b' ? 1 : 0);
export const opposite = (c: ColorIndex): ColorIndex => (c === 0 ? 1 : 0);
export const fileOf = (sq: Square): number => sq % FILES;
export const rankOf = (sq: Square): number => Math.floor(sq / FILES);
export const squareAt = (file: number, rank: number): Square => rank * FILES + file;
export const inBounds = (file: number, rank: number): boolean =>
  file >= 0 && file < FILES && rank >= 0 && rank < RANKS;

/** FEN letter per piece type, lower case; index 0 unused. */
const TYPE_CHARS: readonly string[] = ['', 'p', 'l', 'n', 's', 'g', 'b', 'r', 'k'];
/** SAN letter per unpromoted piece type. */
const SAN_BASE: readonly string[] = ['', 'P', 'L', 'N', 'S', 'G', 'B', 'R', 'K'];

/**
 * SAN letter of a piece as it moves: a promoted pawn, lance, knight or silver is a gold (G), a promoted
 * bishop is a horse (H) and a promoted rook is a dragon (D). Confirmed against Fairy-Stockfish.
 */
export function sanLetter(code: number): string {
  const type = typeOf(code);
  if (!isPromoted(code)) return SAN_BASE[type]!;
  if (type === ROOK) return 'D';
  if (type === BISHOP) return 'H';
  return 'G';
}

export function typeFromChar(ch: string): number {
  return ch.length === 1 ? Math.max(TYPE_CHARS.indexOf(ch.toLowerCase()), 0) : 0;
}

/** FEN text of a piece code: `+` for a promoted piece, upper case for Sente. */
export function codeToChar(code: number): string {
  const ch = TYPE_CHARS[typeOf(code)]!;
  return (isPromoted(code) ? '+' : '') + (code & BLACK ? ch : ch.toUpperCase());
}

export function codeToPiece(code: number): Piece {
  return {
    color: toColor(colorIndexOf(code)),
    type: TYPE_CHARS[typeOf(code)] as PieceType,
    promoted: isPromoted(code),
  };
}

/** Pieces a side can hold in hand, in the order Fairy-Stockfish prints them: G N L P S R B. */
export const HAND_ORDER: readonly number[] = [GOLD, KNIGHT, LANCE, PAWN, SILVER, ROOK, BISHOP];

export type Hands = [Uint8Array, Uint8Array];

export const emptyHands = (): Hands => [new Uint8Array(9), new Uint8Array(9)];
export const cloneHands = (hands: Hands): Hands => [Uint8Array.from(hands[0]), Uint8Array.from(hands[1])];
export const handCount = (hand: Uint8Array): number => hand.reduce((sum, n) => sum + n, 0);

/** Rank a piece of colour `c` moves towards: Sente (index 0) up the board, Gote down it. */
export const forwardOf = (c: ColorIndex): number => (c === 0 ? 1 : -1);

/** True when a square is inside colour `c`'s promotion zone (its three furthest ranks). */
export function inPromotionZone(sq: Square, c: ColorIndex): boolean {
  const rank = rankOf(sq);
  return c === 0 ? rank >= RANKS - 3 : rank <= 2;
}

/**
 * True when a piece of this type landing on `rank` would have no legal move ever again, so the rules
 * force it to promote: a pawn or lance on the last rank, a knight on either of the last two.
 */
export function mustPromote(type: number, c: ColorIndex, toRank: number): boolean {
  const fromEnd = c === 0 ? RANKS - 1 - toRank : toRank;
  if (type === PAWN || type === LANCE) return fromEnd < 1;
  if (type === KNIGHT) return fromEnd < 2;
  return false;
}

/** True when this piece type can promote at all (gold and king cannot). */
export const canPromote = (type: number): boolean => type !== GOLD && type !== KING;

const ORTHOGONAL: ReadonlyArray<readonly [number, number]> = [
  [0, 1],
  [0, -1],
  [1, 0],
  [-1, 0],
];
const DIAGONAL: ReadonlyArray<readonly [number, number]> = [
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

function perColor<T>(build: (c: ColorIndex) => T[]): readonly [T[], T[]] {
  return [build(0), build(1)];
}

function steps(deltas: ReadonlyArray<readonly [number, number]>): Square[][] {
  return Array.from({ length: SIZE }, (_, sq) => {
    const file = fileOf(sq);
    const rank = rankOf(sq);
    const targets: Square[] = [];
    for (const [df, dr] of deltas) {
      if (inBounds(file + df, rank + dr)) targets.push(squareAt(file + df, rank + dr));
    }
    return targets;
  });
}

function rays(deltas: ReadonlyArray<readonly [number, number]>): Square[][][] {
  return Array.from({ length: SIZE }, (_, sq) => {
    const file = fileOf(sq);
    const rank = rankOf(sq);
    return deltas.map(([df, dr]) => {
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
}

/** Pawn: one step straight forward. */
export const PAWN_TARGETS: readonly [Square[][], Square[][]] = perColor((c) => steps([[0, forwardOf(c)]]));

/** Knight: two squares forward and one to the side, jumping over anything between. */
export const KNIGHT_TARGETS: readonly [Square[][], Square[][]] = perColor((c) =>
  steps([
    [1, 2 * forwardOf(c)],
    [-1, 2 * forwardOf(c)],
  ]),
);

/** Silver: one step straight forward or one step in any diagonal. */
export const SILVER_TARGETS: readonly [Square[][], Square[][]] = perColor((c) =>
  steps([[0, forwardOf(c)], ...DIAGONAL]),
);

/** Gold (and every promoted pawn, lance, knight and silver): like a king but not diagonally backwards. */
export const GOLD_TARGETS: readonly [Square[][], Square[][]] = perColor((c) =>
  steps([
    [0, forwardOf(c)],
    [1, forwardOf(c)],
    [-1, forwardOf(c)],
    [1, 0],
    [-1, 0],
    [0, -forwardOf(c)],
  ]),
);

/** King: one step in any of the eight directions. */
export const KING_TARGETS: readonly Square[][] = steps([...ORTHOGONAL, ...DIAGONAL]);

/** Dragon (promoted rook): what the rook's rays do not already cover — one diagonal step. */
export const DRAGON_STEPS: readonly Square[][] = steps(DIAGONAL);

/** Horse (promoted bishop): what the bishop's rays do not already cover — one orthogonal step. */
export const HORSE_STEPS: readonly Square[][] = steps(ORTHOGONAL);

/** Lance: any distance straight forward. One ray per square. */
export const LANCE_RAYS: readonly [Square[][], Square[][]] = perColor((c) =>
  rays([[0, forwardOf(c)]]).map((r) => r[0]!),
);

/** Rook (and dragon): the four orthogonal rays. */
export const ROOK_RAYS: readonly Square[][][] = rays(ORTHOGONAL);

/** Bishop (and horse): the four diagonal rays. */
export const BISHOP_RAYS: readonly Square[][][] = rays(DIAGONAL);

function invert(targets: readonly [Square[][], Square[][]]): readonly [Square[][], Square[][]] {
  const inverse: readonly [Square[][], Square[][]] = [
    Array.from({ length: SIZE }, () => [] as Square[]),
    Array.from({ length: SIZE }, () => [] as Square[]),
  ];
  for (const c of [0, 1] as const) {
    targets[c].forEach((squares, from) => {
      for (const to of squares) inverse[c][to]!.push(from);
    });
  }
  return inverse;
}

/** For a square, the squares a pawn of that colour could attack it from. */
export const PAWN_ATTACKERS = invert(PAWN_TARGETS);
export const KNIGHT_ATTACKERS = invert(KNIGHT_TARGETS);
export const SILVER_ATTACKERS = invert(SILVER_TARGETS);
export const GOLD_ATTACKERS = invert(GOLD_TARGETS);
/** For a square, the squares a lance of that colour could attack it from, nearest first. */
export const LANCE_ATTACK_RAYS: readonly [Square[][], Square[][]] = [LANCE_RAYS[1], LANCE_RAYS[0]];

/**
 * Squares this piece code can reach in a single step, ignoring what stands there. A dragon's and a
 * horse's rays are generated separately, so each returns only the steps its rays do not already cover.
 */
export function stepTargets(code: number, sq: Square): readonly Square[] {
  const c = colorIndexOf(code);
  const type = typeOf(code);
  if (isPromoted(code)) {
    if (type === ROOK) return DRAGON_STEPS[sq]!;
    if (type === BISHOP) return HORSE_STEPS[sq]!;
    return GOLD_TARGETS[c][sq]!;
  }
  switch (type) {
    case PAWN:
      return PAWN_TARGETS[c][sq]!;
    case KNIGHT:
      return KNIGHT_TARGETS[c][sq]!;
    case SILVER:
      return SILVER_TARGETS[c][sq]!;
    case GOLD:
      return GOLD_TARGETS[c][sq]!;
    case KING:
      return KING_TARGETS[sq]!;
    default:
      return [];
  }
}
