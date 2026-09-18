/** Attack detection for the chess piece set on this package's numeric board. */
import type { Square } from '@chaturanga/rules-core';
import {
  BISHOP,
  BISHOP_RAYS,
  BLACK,
  type Board,
  type ColorIndex,
  colorBits,
  KING,
  KING_TARGETS,
  KNIGHT,
  KNIGHT_TARGETS,
  opposite,
  PAWN,
  PAWN_CAPTURES,
  QUEEN,
  ROOK,
  ROOK_RAYS,
  TYPE_MASK,
} from './board';

/** Square of the king of colour `c`, or -1 when it is not on the board. */
export function findKing(board: Board, c: ColorIndex): Square {
  const code = KING | colorBits(c);
  for (let sq = 0; sq < 64; sq++) if (board[sq] === code) return sq;
  return -1;
}

/** True if `sq` is attacked by any piece of colour `by`. */
export function isAttacked(board: Board, sq: Square, by: ColorIndex): boolean {
  const bits = colorBits(by);
  // A pawn of `by` attacks `sq` from where a pawn of the other colour would capture towards.
  for (const s of PAWN_CAPTURES[opposite(by)][sq]!) if (board[s] === (bits | PAWN)) return true;
  for (const s of KNIGHT_TARGETS[sq]!) if (board[s] === (bits | KNIGHT)) return true;
  for (const s of KING_TARGETS[sq]!) if (board[s] === (bits | KING)) return true;

  for (const ray of ROOK_RAYS[sq]!) {
    for (const s of ray) {
      const p = board[s]!;
      if (p === 0) continue;
      if ((p & BLACK) === bits) {
        const type = p & TYPE_MASK;
        if (type === ROOK || type === QUEEN) return true;
      }
      break;
    }
  }
  for (const ray of BISHOP_RAYS[sq]!) {
    for (const s of ray) {
      const p = board[s]!;
      if (p === 0) continue;
      if ((p & BLACK) === bits) {
        const type = p & TYPE_MASK;
        if (type === BISHOP || type === QUEEN) return true;
      }
      break;
    }
  }
  return false;
}

/** True if colour `c` has its king on the board and it is attacked. */
export function inCheck(board: Board, c: ColorIndex): boolean {
  const king = findKing(board, c);
  return king >= 0 && isAttacked(board, king, opposite(c));
}
