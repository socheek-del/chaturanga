/** Attack detection for Xiangqi, including the flying-general rule. */
import {
  type Board,
  CANNON,
  CHARIOT,
  type ColorIndex,
  colorBits,
  fileOf,
  GENERAL,
  HORSE,
  HORSE_ATTACKERS,
  rankOf,
  RAYS,
  SOLDIER,
  SOLDIER_ATTACKERS,
  squareAt,
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
  const bits = colorBits(by);

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

  const enemyGeneral = findGeneral(board, by);
  if (enemyGeneral >= 0 && fileOf(enemyGeneral) === fileOf(sq) && facingClear(board, enemyGeneral, sq)) return true;

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
