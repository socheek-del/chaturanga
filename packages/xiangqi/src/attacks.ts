/** Attack detection for Xiangqi, including the flying-general rule. */
import {
  ADVISOR,
  ADVISOR_TARGETS,
  type Board,
  CANNON,
  CHARIOT,
  type ColorIndex,
  colorBits,
  ELEPHANT,
  ELEPHANT_TARGETS,
  fileOf,
  GENERAL,
  GENERAL_TARGETS,
  HORSE,
  HORSE_ATTACKERS,
  rankOf,
  RAYS,
  SOLDIER,
  SOLDIER_ATTACKERS,
  SIZE,
  squareAt,
  TYPE_MASK,
} from './board';
import type { Square } from './types';

/** The nine palace points of each colour, where a general always stands in a legal game. */
const PALACE_POINTS: readonly [Square[], Square[]] = [
  [3, 4, 5, 12, 13, 14, 21, 22, 23],
  [84, 85, 86, 75, 76, 77, 66, 67, 68],
];

/** Square of the general of colour `c`, or -1 when it is not on the board. */
export function findGeneral(board: Board, c: ColorIndex): Square {
  const code = GENERAL | colorBits(c);
  // Hot path for search: look in the palace first, then anywhere (a FEN may place a general elsewhere).
  for (const sq of PALACE_POINTS[c]) if (board[sq] === code) return sq;
  for (let sq = 0; sq < board.length; sq++) if (board[sq] === code) return sq;
  return -1;
}

/**
 * True if `sq` is attacked by any piece of colour `by`, including the flying-general rule: the two
 * generals may never face each other on an open file, modelled here as the enemy general attacking the
 * defending general's own square through a clear file.
 */
export function isAttacked(board: Board, sq: Square, by: ColorIndex): boolean {
  if (attackedByMovers(board, sq, colorBits(by))) return true;
  const enemyGeneral = findGeneral(board, by);
  return enemyGeneral >= 0 && fileOf(enemyGeneral) === fileOf(sq) && facingClear(board, enemyGeneral, sq);
}

/**
 * Every point a piece of colour `by` attacks, for the attack-map overlay. Unlike `isAttacked`, which only
 * answers "is this general in check" and so skips the pieces that can never give check, this covers every
 * piece: the advisor's and general's palace steps and the elephant's blocked-eye leaps too. The general
 * reaches the enemy general's point only when the two face each other on an open file (flying general).
 */
export function attackedPoints(board: Board, by: ColorIndex): Square[] {
  const bits = colorBits(by);
  const hit = new Uint8Array(SIZE);
  for (let from = 0; from < SIZE; from++) {
    const p = board[from]!;
    if (p === 0 || (p & ~TYPE_MASK) !== bits) continue;
    switch (p & TYPE_MASK) {
      case ADVISOR:
        for (const to of ADVISOR_TARGETS[by][from]!) hit[to] = 1;
        break;
      case ELEPHANT:
        for (const { to, eye } of ELEPHANT_TARGETS[by][from]!) if (board[eye] === 0) hit[to] = 1;
        break;
      case GENERAL: {
        for (const to of GENERAL_TARGETS[by][from]!) hit[to] = 1;
        const enemy = findGeneral(board, by === 0 ? 1 : 0);
        if (enemy >= 0 && fileOf(enemy) === fileOf(from) && facingClear(board, from, enemy)) hit[enemy] = 1;
        break;
      }
    }
  }
  const squares: Square[] = [];
  for (let sq = 0; sq < SIZE; sq++) if (hit[sq] || attackedByMovers(board, sq, bits)) squares.push(sq);
  return squares;
}

/** Soldier, horse, chariot and cannon attacks on `sq` by the side whose colour bits are `bits`. */
function attackedByMovers(board: Board, sq: Square, bits: number): boolean {
  const by: ColorIndex = bits ? 1 : 0;
  for (const from of SOLDIER_ATTACKERS[by][sq]!) if (board[from] === (bits | SOLDIER)) return true;
  for (const { to: from, leg } of HORSE_ATTACKERS[sq]!) {
    if (board[leg] === 0 && board[from] === (bits | HORSE)) return true;
  }
  for (const ray of RAYS[sq]!) {
    let screen = false;
    for (const s of ray) {
      const p = board[s]!;
      if (p === 0) continue;
      if (!screen) {
        if (p === (bits | CHARIOT)) return true;
        screen = true;
        continue;
      }
      if (p === (bits | CANNON)) return true;
      break;
    }
  }
  return false;
}

/** True when every point strictly between two same-file squares is empty. */
function facingClear(board: Board, a: Square, b: Square): boolean {
  const file = fileOf(a);
  const [loRank, hiRank] = rankOf(a) < rankOf(b) ? [rankOf(a), rankOf(b)] : [rankOf(b), rankOf(a)];
  for (let rank = loRank + 1; rank < hiRank; rank++) if (board[squareAt(file, rank)] !== 0) return false;
  return true;
}

/** True if colour `c` has its general on the board and it is attacked (including flying-general). */
export function inCheck(board: Board, c: ColorIndex): boolean {
  const general = findGeneral(board, c);
  return general >= 0 && isAttacked(board, general, c === 0 ? 1 : 0);
}
