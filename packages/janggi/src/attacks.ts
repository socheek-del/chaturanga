/** Attack detection for Janggi. Facing generals (bikjang) are not an attack; see `generalsFace`. */
import {
  ADVISOR,
  type Board,
  CANNON,
  CHARIOT,
  type ColorIndex,
  colorBits,
  ELEPHANT,
  ELEPHANT_ATTACKERS,
  fileOf,
  GENERAL,
  HORSE,
  HORSE_ATTACKERS,
  PALACE_TARGETS,
  RAYS,
  SIZE,
  SOLDIER,
  SOLDIER_ATTACKERS,
  TYPE_MASK,
} from './board';
import type { Square } from './types';

/** The nine palace points of each colour, where a general always stands in a legal game. */
const PALACE_POINTS: readonly [Square[], Square[]] = [
  [13, 3, 4, 5, 12, 14, 21, 22, 23],
  [76, 84, 85, 86, 75, 77, 66, 67, 68],
];

/** Square of the general of colour `c`, or -1 when it is not on the board. */
export function findGeneral(board: Board, c: ColorIndex): Square {
  const code = GENERAL | colorBits(c);
  for (const sq of PALACE_POINTS[c]) if (board[sq] === code) return sq;
  return -1;
}

/** Soldier, horse, elephant, chariot and cannon attacks on `sq` by colour `by` (capturing a cannon with a cannon aside). */
export function isAttacked(board: Board, sq: Square, by: ColorIndex): boolean {
  const bits = colorBits(by);
  for (const from of SOLDIER_ATTACKERS[by][sq]!) if (board[from] === (bits | SOLDIER)) return true;
  for (const { to: from, leg } of HORSE_ATTACKERS[sq]!) {
    if (board[from] === (bits | HORSE) && board[leg] === 0) return true;
  }
  for (const { to: from, first, second } of ELEPHANT_ATTACKERS[sq]!) {
    if (board[from] === (bits | ELEPHANT) && board[first] === 0 && board[second] === 0) return true;
  }
  for (const ray of RAYS[sq]!) {
    let screen = false;
    for (const s of ray) {
      const p = board[s]!;
      if (p === 0) continue;
      if (screen) {
        if (p === (bits | CANNON)) return true;
        break;
      }
      if (p === (bits | CHARIOT)) return true;
      // A cannon can never be the screen of another cannon.
      if ((p & TYPE_MASK) === CANNON) break;
      screen = true;
    }
  }
  return false;
}

/**
 * Every point a piece of colour `by` attacks, for the attack-map overlay. Unlike `isAttacked` it includes
 * the general's and advisors' palace steps, and leaves out a cannon's line to another cannon.
 */
export function attackedPoints(board: Board, by: ColorIndex): Square[] {
  const bits = colorBits(by);
  const hit = new Uint8Array(SIZE);
  for (let from = 0; from < SIZE; from++) {
    const p = board[from]!;
    if (p === 0 || (p & ~TYPE_MASK) !== bits) continue;
    const type = p & TYPE_MASK;
    if (type === GENERAL || type === ADVISOR) for (const to of PALACE_TARGETS[by][from]!) hit[to] = 1;
  }
  const squares: Square[] = [];
  for (let sq = 0; sq < SIZE; sq++) {
    const target = board[sq]!;
    if (hit[sq] || (isAttacked(board, sq, by) && !((target & TYPE_MASK) === CANNON && onlyCannonAttacks(board, sq, bits)))) {
      squares.push(sq);
    }
  }
  return squares;
}

/** True when nothing but cannons of colour `bits` attacks `sq`. */
function onlyCannonAttacks(board: Board, sq: Square, bits: number): boolean {
  const without = board.map((p) => (p === (bits | CANNON) ? CANNON | (bits ^ 8) : p));
  return !isAttacked(without, sq, bits ? 1 : 0);
}

/** Bikjang (빅장): the two generals face each other on a file with nothing between them. */
export function generalsFace(board: Board): boolean {
  const a = findGeneral(board, 0);
  const b = findGeneral(board, 1);
  if (a < 0 || b < 0 || fileOf(a) !== fileOf(b)) return false;
  for (let sq = a + 9; sq < b; sq += 9) if (board[sq] !== 0) return false;
  return true;
}

/** True if colour `c` has its general on the board and it is attacked. */
export function inCheck(board: Board, c: ColorIndex): boolean {
  const general = findGeneral(board, c);
  return general >= 0 && isAttacked(board, general, c === 0 ? 1 : 0);
}
