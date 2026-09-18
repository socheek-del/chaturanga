import {
  BISHOP,
  BLACK,
  type Board,
  type ColorIndex,
  GOLD,
  type Hands,
  HAND_ORDER,
  KING,
  KNIGHT,
  LANCE,
  PAWN,
  PROMOTED,
  rankOf,
  ROOK,
  SILVER,
  SIZE,
  TYPE_MASK,
} from '@chaturanga/shogi/core';

/**
 * Base material in centipawns, indexed by piece type: -, pawn, lance, knight, silver, gold, bishop, rook,
 * king. The spread follows the values Shogi players use (a rook or bishop is worth several generals, a
 * pawn very little), scaled so a pawn is 100.
 */
export const PIECE_VALUE = [0, 100, 350, 400, 550, 600, 850, 1000, 0] as const;

/** What a piece is worth once promoted; a promoted pawn is a gold, a dragon is a better rook. */
export const PROMOTED_VALUE = [0, 600, 600, 600, 600, 600, 1150, 1300, 0] as const;

/**
 * A piece in hand is worth more than the same piece on the board: it can be dropped anywhere, on the
 * move the player chooses. Shogi players price this at roughly a tenth of the piece.
 */
const IN_HAND_BONUS = 1.1;

/** Per rank a piece stands inside the enemy half, for the side that owns it. */
const ADVANCE_BONUS = 6;
/** Per own piece standing next to the king. */
const KING_GUARD = 18;
/** Per enemy piece inside the king's 5x5 neighbourhood. */
const KING_PRESSURE = 22;

const valueOf = (code: number): number => (code & PROMOTED ? PROMOTED_VALUE : PIECE_VALUE)[code & TYPE_MASK]!;

/** Material on the board and in hand, in centipawns, from `side`'s point of view. */
export function materialBalance(board: Board, hands: Hands, side: ColorIndex): number {
  let diff = 0;
  for (let sq = 0; sq < SIZE; sq++) {
    const p = board[sq]!;
    if (!p) continue;
    diff += (p & BLACK ? -1 : 1) * valueOf(p);
  }
  for (const type of HAND_ORDER) {
    const value = PIECE_VALUE[type]! * IN_HAND_BONUS;
    diff += (hands[0][type]! - hands[1][type]!) * value;
  }
  return side === 0 ? diff : -diff;
}

/** How far into the enemy half a square is for this colour, 0 on one's own side. */
const advance = (c: ColorIndex, sq: number): number =>
  Math.max(0, (c === 0 ? rankOf(sq) : 8 - rankOf(sq)) - 4);

const fileOfSq = (sq: number): number => sq % 9;
const rankOfSq = (sq: number): number => Math.floor(sq / 9);

/**
 * Static evaluation in centipawns from the point of view of `side` (0 = Sente, 1 = Gote): material
 * including both hands, a small bonus for pieces pushed into the enemy half, and the safety of each king —
 * its own pieces standing beside it count for it, enemy pieces near it count against.
 *
 * Stalemate loses in Shogi, so the search needs no special case for it.
 */
export function evaluate(board: Board, hands: Hands, side: ColorIndex): number {
  let score = 0;
  const kings: [number, number] = [-1, -1];
  for (let sq = 0; sq < SIZE; sq++) {
    const p = board[sq]!;
    if (!p) continue;
    const c: ColorIndex = p & BLACK ? 1 : 0;
    const sign = c === 0 ? 1 : -1;
    const type = p & TYPE_MASK;
    score += sign * valueOf(p);
    if (type === KING) kings[c] = sq;
    else score += sign * ADVANCE_BONUS * advance(c, sq);
  }
  for (const type of HAND_ORDER) {
    const value = PIECE_VALUE[type]! * IN_HAND_BONUS;
    score += (hands[0][type]! - hands[1][type]!) * value;
  }

  for (const c of [0, 1] as const) {
    const king = kings[c];
    if (king < 0) continue;
    const sign = c === 0 ? 1 : -1;
    const kf = fileOfSq(king);
    const kr = rankOfSq(king);
    for (let sq = 0; sq < SIZE; sq++) {
      const p = board[sq]!;
      if (!p) continue;
      const df = Math.abs(fileOfSq(sq) - kf);
      const dr = Math.abs(rankOfSq(sq) - kr);
      if (df > 2 || dr > 2) continue;
      const own = (p & BLACK ? 1 : 0) === c;
      if (own && df <= 1 && dr <= 1) score += sign * KING_GUARD;
      else if (!own) score -= sign * KING_PRESSURE;
    }
  }

  return side === 0 ? score : -score;
}

/** Piece types whose capture is worth searching further in quiescence. */
export const CAPTURE_ORDER: readonly number[] = [ROOK, BISHOP, GOLD, SILVER, KNIGHT, LANCE, PAWN];
