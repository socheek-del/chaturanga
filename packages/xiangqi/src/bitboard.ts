/**
 * Square-set ("bitboard") helpers for the game-end rules, ported from Fairy-Stockfish so the chasing
 * and repetition code in `chase.ts` and `gameEnd.ts` can follow the C++ line by line. A bitboard is a
 * bigint with bit `s` set for point `s` (the same 0..89 index as `board.ts`).
 *
 * Move generation does not use this file: it stays on the faster array tables in `board.ts`.
 *
 * Fairy-Stockfish names and their Xiangqi pieces: KING = General (moves as WAZIR), FERS = Advisor,
 * ELEPHANT = Elephant, HORSE = Horse, ROOK = Chariot, CANNON = Cannon, SOLDIER = Soldier.
 */
import {
  ADVISOR,
  type Board,
  CANNON,
  CHARIOT,
  type ColorIndex,
  colorIndexOf,
  ELEPHANT,
  fileOf,
  FILES,
  GENERAL,
  HORSE,
  HORSE_TARGETS,
  inBounds,
  RANKS,
  rankOf,
  RAYS,
  SIZE,
  SOLDIER,
  squareAt,
  typeOf,
} from './board';
import type { Square } from './types';

export type Bitboard = bigint;

export const PIECE_TYPES = [SOLDIER, HORSE, ELEPHANT, ADVISOR, CANNON, CHARIOT, GENERAL] as const;

export const bb = (s: Square): Bitboard => 1n << BigInt(s);
export const moreThanOne = (b: Bitboard): boolean => (b & (b - 1n)) !== 0n;
export const other = (c: ColorIndex): ColorIndex => (c === 0 ? 1 : 0);

export function squaresOf(b: Bitboard): Square[] {
  const out: Square[] = [];
  for (let s = 0; b; s++, b >>= 1n) if (b & 1n) out.push(s);
  return out;
}

function table(build: (file: number, rank: number) => Array<[number, number]>): Bitboard[] {
  return Array.from({ length: SIZE }, (_, s) => {
    let b = 0n;
    for (const [f, r] of build(fileOf(s), rankOf(s))) if (inBounds(f, r)) b |= bb(squareAt(f, r));
    return b;
  });
}

/** PseudoAttacks[WAZIR]: the four orthogonal neighbours. */
export const WAZIR_BB = table((f, r) => [
  [f + 1, r],
  [f - 1, r],
  [f, r + 1],
  [f, r - 1],
]);
/** PseudoAttacks[FERS]: the four diagonal neighbours. */
export const FERS_BB = table((f, r) => [
  [f + 1, r + 1],
  [f + 1, r - 1],
  [f - 1, r + 1],
  [f - 1, r - 1],
]);
/** PseudoAttacks[HORSE]: every knight-distance point, ignoring legs. */
export const KNIGHT_BB = table((f, r) => [
  [f + 1, r + 2],
  [f + 2, r + 1],
  [f + 2, r - 1],
  [f + 1, r - 2],
  [f - 1, r - 2],
  [f - 2, r - 1],
  [f - 2, r + 1],
  [f - 1, r + 2],
]);
/** PseudoAttacks[ROOK] (also CANNON's): the whole file and rank, excluding the point itself. */
export const LINES_BB = table((f, r) => {
  const out: Array<[number, number]> = [];
  for (let i = 0; i < FILES; i++) if (i !== f) out.push([i, r]);
  for (let i = 0; i < RANKS; i++) if (i !== r) out.push([f, i]);
  return out;
});

export const FILE_BB: Bitboard[] = Array.from({ length: FILES }, (_, f) => {
  let b = 0n;
  for (let r = 0; r < RANKS; r++) b |= bb(squareAt(f, r));
  return b;
});

function region(test: (file: number, rank: number) => boolean): Bitboard {
  let b = 0n;
  for (let s = 0; s < SIZE; s++) if (test(fileOf(s), rankOf(s))) b |= bb(s);
  return b;
}

const FULL = region(() => true);
/** mobilityRegion[c][KING] and [FERS]. */
const PALACE: readonly [Bitboard, Bitboard] = [
  region((f, r) => f >= 3 && f <= 5 && r <= 2),
  region((f, r) => f >= 3 && f <= 5 && r >= 7),
];
/** mobilityRegion[c][ELEPHANT]: a colour's own side of the river. */
const HALF: readonly [Bitboard, Bitboard] = [region((_, r) => r <= 4), region((_, r) => r >= 5)];

/** board_bb(c, pt): the points a piece type of colour c may ever stand on. */
export function regionOf(c: ColorIndex, pt: number): Bitboard {
  if (pt === GENERAL || pt === ADVISOR) return PALACE[c];
  if (pt === ELEPHANT) return HALF[c];
  return FULL;
}

/** relative_rank(c, s): 0 on colour c's back rank, 9 on the far one. */
const relativeRank = (c: ColorIndex, s: Square): number => (c === 0 ? rankOf(s) : RANKS - 1 - rankOf(s));

/** A snapshot of the piece bitboards of one position (Position::pieces overloads). */
export interface Pieces {
  board: Board;
  all: Bitboard;
  color: [Bitboard, Bitboard];
  /** byColor[c][pieceType] */
  byColor: [Bitboard[], Bitboard[]];
  /** byType[pieceType], both colours */
  byType: Bitboard[];
  general: [Square, Square];
}

export function piecesOf(board: Board): Pieces {
  const p: Pieces = {
    board,
    all: 0n,
    color: [0n, 0n],
    byColor: [new Array<Bitboard>(8).fill(0n), new Array<Bitboard>(8).fill(0n)],
    byType: new Array<Bitboard>(8).fill(0n),
    general: [-1, -1],
  };
  for (let s = 0; s < SIZE; s++) {
    const code = board[s]!;
    if (!code) continue;
    const c = colorIndexOf(code);
    const t = typeOf(code);
    const bit = bb(s);
    p.all |= bit;
    p.color[c] |= bit;
    p.byColor[c][t]! |= bit;
    p.byType[t]! |= bit;
    if (t === GENERAL) p.general[c] = s;
  }
  return p;
}

/** promoted_soldiers(c): colour c's soldiers that have crossed the river (relative rank 6 and up). */
export const promotedSoldiers = (p: Pieces, c: ColorIndex): Bitboard => p.byColor[c][SOLDIER]! & HALF[other(c)];

/**
 * attacks_bb(c, pt, s, occupied): the points a piece attacks given an occupancy, with no mobility
 * region applied. A General attacks as a WAZIR (its king_type), an unpromoted Soldier still gets its
 * sideways steps here (attacks_from() strips them).
 */
export function attacksBb(c: ColorIndex, pt: number, s: Square, occupied: Bitboard): Bitboard {
  switch (pt) {
    case SOLDIER: {
      const f = fileOf(s);
      const r = rankOf(s) + (c === 0 ? 1 : -1);
      let b = 0n;
      if (inBounds(f, r)) b |= bb(squareAt(f, r));
      if (inBounds(f - 1, rankOf(s))) b |= bb(s - 1);
      if (inBounds(f + 1, rankOf(s))) b |= bb(s + 1);
      return b;
    }
    case HORSE: {
      let b = 0n;
      for (const { to, leg } of HORSE_TARGETS[s]!) if (!(occupied & bb(leg))) b |= bb(to);
      return b;
    }
    case ELEPHANT: {
      let b = 0n;
      const f = fileOf(s);
      const r = rankOf(s);
      for (const [df, dr] of [
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ] as const) {
        if (!inBounds(f + 2 * df, r + 2 * dr)) continue;
        if (!(occupied & bb(squareAt(f + df, r + dr)))) b |= bb(squareAt(f + 2 * df, r + 2 * dr));
      }
      return b;
    }
    case ADVISOR:
      return FERS_BB[s]!;
    case GENERAL:
      return WAZIR_BB[s]!;
    case CHARIOT: {
      let b = 0n;
      for (const ray of RAYS[s]!) {
        for (const t of ray) {
          b |= bb(t);
          if (occupied & bb(t)) break;
        }
      }
      return b;
    }
    case CANNON: {
      // sliding_attack<HOPPER>: every point after the first hurdle, up to and including the next piece.
      let b = 0n;
      for (const ray of RAYS[s]!) {
        let hurdle = false;
        for (const t of ray) {
          if (hurdle) b |= bb(t);
          if (occupied & bb(t)) {
            if (hurdle) break;
            hurdle = true;
          }
        }
      }
      return b;
    }
    default:
      return 0n;
  }
}

/** attacks_from(c, pt, s): attacks with the current occupancy, the soldier restriction and the region. */
export function attacksFrom(p: Pieces, c: ColorIndex, pt: number, s: Square): Bitboard {
  let b = attacksBb(c, pt, s, p.all);
  if (pt === SOLDIER && !(promotedSoldiers(p, c) & bb(s))) b &= FILE_BB[fileOf(s)]!;
  return b & regionOf(c, pt);
}

/**
 * attackers_to(s, occupied, c): colour c's pieces attacking `s`, sliding through `occupied`. Piece
 * identity comes from `p` even where `occupied` has a point removed. The flying general is not an
 * attack here, exactly as in Fairy-Stockfish.
 */
export function attackersTo(p: Pieces, s: Square, occupied: Bitboard, c: ColorIndex): Bitboard {
  let b = 0n;
  const target = bb(s);
  for (const pt of PIECE_TYPES) {
    if (!(regionOf(c, pt) & target)) continue;
    if (pt === HORSE) {
      // Asymmetric rider: test each horse's own legs.
      for (const s2 of squaresOf(KNIGHT_BB[s]! & p.byColor[c][HORSE]!)) {
        if (attacksBb(c, HORSE, s2, occupied) & target) b |= bb(s2);
      }
    } else {
      b |= attacksBb(other(c), pt, s, occupied) & p.byColor[c][pt]!;
    }
  }
  // Unpromoted soldiers only attack forwards.
  if (b & p.byType[SOLDIER]! && relativeRank(c, s) < 5) {
    b ^= b & p.byType[SOLDIER]! & ~shogiPawnBehind(c, s);
  }
  return b;
}

/** PseudoAttacks[~c][SHOGI_PAWN][s]: the point one step behind `s` from colour c's point of view. */
function shogiPawnBehind(c: ColorIndex, s: Square): Bitboard {
  const r = rankOf(s) + (c === 0 ? -1 : 1);
  return r >= 0 && r < RANKS ? bb(squareAt(fileOf(s), r)) : 0n;
}

/** between_bb(s1, s2): points strictly between two aligned points plus s2; just s2 when not aligned. */
export function betweenBb(s1: Square, s2: Square): Bitboard {
  const df = fileOf(s2) - fileOf(s1);
  const dr = rankOf(s2) - rankOf(s1);
  let b = bb(s2);
  if (s1 === s2 || !(df === 0 || dr === 0 || Math.abs(df) === Math.abs(dr))) return b;
  const sf = Math.sign(df);
  const sr = Math.sign(dr);
  for (let f = fileOf(s1) + sf, r = rankOf(s1) + sr; f !== fileOf(s2) || r !== rankOf(s2); f += sf, r += sr) {
    b |= bb(squareAt(f, r));
  }
  return b;
}

/** line_bb(s1, s2) for two points on one file or rank: that whole file or rank. */
export function lineBb(s1: Square, s2: Square): Bitboard {
  return (LINES_BB[s1]! & LINES_BB[s2]!) | bb(s1) | bb(s2);
}

/** The part of PseudoAttacks that is a rider (PseudoAttacks ^ LeaperAttacks) for each piece type. */
function riderPseudo(pt: number, s: Square): Bitboard {
  if (pt === HORSE) return KNIGHT_BB[s]!;
  if (pt === ELEPHANT) return elephantPseudo(s);
  if (pt === CHARIOT || pt === CANNON) return LINES_BB[s]!;
  return 0n;
}

const elephantPseudo = (s: Square): Bitboard => attacksBb(0, ELEPHANT, s, 0n);

/**
 * slider_blockers(sliders = pieces(c), kingSq): pieces of either colour that alone stand between one of
 * colour c's riders (chariot, cannon screen pair, horse leg, elephant eye) and the king on `kingSq`.
 */
export function sliderBlockers(p: Pieces, c: ColorIndex, kingSq: Square): Bitboard {
  if (kingSq < 0 || !p.color[c]) return 0n;
  let blockers = 0n;
  let snipers = 0n;
  let slidingSnipers = 0n;
  const enemy = other(c);

  for (const pt of PIECE_TYPES) {
    const b = p.color[c] & riderPseudo(pt, kingSq) & p.byColor[c][pt]!;
    if (!b) continue;
    if (pt === HORSE) {
      for (const s2 of squaresOf(KNIGHT_BB[kingSq]! & p.byColor[c][HORSE]!)) {
        if (!(attacksFrom(p, c, HORSE, s2) & bb(kingSq))) snipers |= bb(s2);
      }
    } else {
      snipers |= b & ~attacksBb(enemy, pt, kingSq, p.all);
    }
    if (pt !== CANNON) slidingSnipers |= snipers & p.byType[pt]!;
  }

  const occupancy = p.all ^ slidingSnipers;
  for (const sniperSq of squaresOf(snipers)) {
    const type = typeOf(p.board[sniperSq]!);
    const isHopper = type === CANNON;
    const between = type === HORSE ? WAZIR_BB[sniperSq]! & FERS_BB[kingSq]! : betweenBb(kingSq, sniperSq);
    const b = between & (isHopper ? p.all ^ bb(sniperSq) : occupancy);
    if (b && (!moreThanOne(b) || (isHopper && squaresOf(b).length === 2))) blockers |= b;
  }
  return blockers;
}

/** blockers_for_king(c): pieces blocking the enemy's attacks on colour c's general. */
export function blockersForKing(p: Pieces, c: ColorIndex): Bitboard {
  return sliderBlockers(p, other(c), p.general[c]);
}
