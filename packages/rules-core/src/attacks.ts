/** Attack detection for the Makruk-family piece set on the shared numeric board. */
import {
  BLACK,
  type Board,
  type ColorIndex,
  colorBits,
  FERZ,
  FERZ_TARGETS,
  KING,
  KING_TARGETS,
  KNIGHT,
  KNIGHT_TARGETS,
  PAWN,
  PAWN_CAPTURES,
  PROMOTED,
  ROOK,
  ROOK_RAYS,
  SILVER,
  TYPE_MASK,
} from './board8';
import type { Square } from './types';

/** Square of the king of colour `c`, or -1 when it is not on the board (e.g. still in hand). */
export function findKing(board: Board, c: ColorIndex): Square {
  const code = KING | colorBits(c);
  for (let sq = 0; sq < 64; sq++) if ((board[sq]! & ~PROMOTED) === code) return sq;
  return -1;
}

/** True if `sq` is attacked by any piece of colour `by`. */
export function isAttacked(board: Board, sq: Square, by: ColorIndex): boolean {
  const bits = colorBits(by);
  const opp: ColorIndex = by === 0 ? 1 : 0;

  for (const s of PAWN_CAPTURES[opp][sq]!) if (board[s] === (bits | PAWN)) return true;
  for (const s of KNIGHT_TARGETS[sq]!) if (board[s] === (bits | KNIGHT)) return true;
  for (const s of KING_TARGETS[sq]!) if (board[s] === (bits | KING)) return true;
  for (const s of FERZ_TARGETS[sq]!) {
    const p = board[s]!;
    if (p !== 0 && (p & BLACK) === bits && ((p & TYPE_MASK) === FERZ || (p & TYPE_MASK) === SILVER)) return true;
  }
  // A silver general also attacks the square directly in front of it.
  const behind = by === 0 ? sq - 8 : sq + 8;
  if (behind >= 0 && behind < 64 && board[behind] === (bits | SILVER)) return true;

  for (const ray of ROOK_RAYS[sq]!) {
    for (const s of ray) {
      const p = board[s]!;
      if (p === 0) continue;
      if (p === (bits | ROOK)) return true;
      break;
    }
  }
  return false;
}

/**
 * Every square of a board with `size` squares for which `attacked` holds, in ascending order. Each engine
 * passes its own attack test; this keeps the attack-map contract (`VariantGame.attackedSquares`) in one place.
 */
export function collectAttacked(size: number, attacked: (sq: Square) => boolean): Square[] {
  const squares: Square[] = [];
  for (let sq = 0; sq < size; sq++) if (attacked(sq)) squares.push(sq);
  return squares;
}

/** True if colour `c` has its king on the board and it is attacked. */
export function inCheck(board: Board, c: ColorIndex): boolean {
  const king = findKing(board, c);
  return king >= 0 && isAttacked(board, king, c === 0 ? 1 : 0);
}
