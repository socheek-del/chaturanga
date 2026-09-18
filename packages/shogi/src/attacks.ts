/** Attack detection for Shogi. */
import {
  BISHOP,
  BISHOP_RAYS,
  BLACK,
  type Board,
  type ColorIndex,
  colorBits,
  DRAGON_STEPS,
  GOLD,
  GOLD_ATTACKERS,
  HORSE_STEPS,
  KING,
  KING_TARGETS,
  KNIGHT,
  KNIGHT_ATTACKERS,
  LANCE,
  LANCE_ATTACK_RAYS,
  opposite,
  PAWN,
  PAWN_ATTACKERS,
  PROMOTED,
  ROOK,
  ROOK_RAYS,
  SILVER,
  SILVER_ATTACKERS,
} from './board';
import type { Square } from './types';

/** Square of colour `c`'s king, or -1 when it is not on the board. */
export function findKing(board: Board, c: ColorIndex): Square {
  const code = KING | colorBits(c);
  for (let sq = 0; sq < board.length; sq++) if (board[sq] === code) return sq;
  return -1;
}

/** True if `sq` is attacked by any piece of colour `by`. */
export function isAttacked(board: Board, sq: Square, by: ColorIndex): boolean {
  const bits = colorBits(by);

  for (const from of PAWN_ATTACKERS[by][sq]!) if (board[from] === (bits | PAWN)) return true;
  for (const from of KNIGHT_ATTACKERS[by][sq]!) if (board[from] === (bits | KNIGHT)) return true;
  for (const from of SILVER_ATTACKERS[by][sq]!) if (board[from] === (bits | SILVER)) return true;
  for (const from of GOLD_ATTACKERS[by][sq]!) {
    const p = board[from]!;
    if (p === (bits | GOLD)) return true;
    if ((p & BLACK) === bits && p & PROMOTED) {
      const type = p & 15;
      if (type === PAWN || type === LANCE || type === KNIGHT || type === SILVER) return true;
    }
  }
  for (const from of KING_TARGETS[sq]!) if (board[from] === (bits | KING)) return true;
  for (const from of DRAGON_STEPS[sq]!) if (board[from] === (bits | PROMOTED | ROOK)) return true;
  for (const from of HORSE_STEPS[sq]!) if (board[from] === (bits | PROMOTED | BISHOP)) return true;

  for (const ray of ROOK_RAYS[sq]!) {
    for (const s of ray) {
      const p = board[s]!;
      if (p === 0) continue;
      if (p === (bits | ROOK) || p === (bits | PROMOTED | ROOK)) return true;
      break;
    }
  }
  for (const ray of BISHOP_RAYS[sq]!) {
    for (const s of ray) {
      const p = board[s]!;
      if (p === 0) continue;
      if (p === (bits | BISHOP) || p === (bits | PROMOTED | BISHOP)) return true;
      break;
    }
  }
  for (const s of LANCE_ATTACK_RAYS[by][sq]!) {
    const p = board[s]!;
    if (p === 0) continue;
    if (p === (bits | LANCE)) return true;
    break;
  }

  return false;
}

/** True if colour `c` has its king on the board and it is attacked. */
export function inCheck(board: Board, c: ColorIndex): boolean {
  const king = findKing(board, c);
  return king >= 0 && isAttacked(board, king, opposite(c));
}
