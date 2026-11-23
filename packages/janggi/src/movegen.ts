/** Janggi move generation on the numeric board. Moves are encoded as from | (to << 7); a pass has from === to. */
import {
  ADVISOR,
  BLACK,
  type Board,
  CANNON,
  CHARIOT,
  type ColorIndex,
  colorBits,
  ELEPHANT,
  ELEPHANT_TARGETS,
  GENERAL,
  HORSE,
  HORSE_TARGETS,
  PALACE_TARGETS,
  RAYS,
  SOLDIER,
  SOLDIER_TARGETS,
  TYPE_MASK,
} from './board';
import { findGeneral, generalsFace, inCheck } from './attacks';
import type { Square } from './types';

const TO_SHIFT = 7;
const SQUARE_MASK = (1 << TO_SHIFT) - 1;

export const encodeMove = (from: Square, to: Square): number => from | (to << TO_SHIFT);
export const moveFrom = (m: number): Square => m & SQUARE_MASK;
export const moveTo = (m: number): Square => (m >> TO_SHIFT) & SQUARE_MASK;

/** Passing (한수쉼) is written as the general moving onto its own point. */
export const isPass = (m: number): boolean => moveFrom(m) === moveTo(m);

const isOwn = (code: number, bits: number): boolean => code !== 0 && (code & BLACK) === bits;

/** Pseudo-legal moves of every piece colour `c` owns (does not check for self-check; no pass). */
export function generatePieceMoves(board: Board, c: ColorIndex, out: number[] = []): number[] {
  const bits = colorBits(c);
  for (let from = 0; from < board.length; from++) {
    const p = board[from]!;
    if (!isOwn(p, bits)) continue;
    switch (p & TYPE_MASK) {
      case SOLDIER:
        for (const to of SOLDIER_TARGETS[c][from]!) if (!isOwn(board[to]!, bits)) out.push(encodeMove(from, to));
        break;
      case HORSE:
        for (const { to, leg } of HORSE_TARGETS[from]!) {
          if (board[leg] === 0 && !isOwn(board[to]!, bits)) out.push(encodeMove(from, to));
        }
        break;
      case ELEPHANT:
        for (const { to, first, second } of ELEPHANT_TARGETS[from]!) {
          if (board[first] === 0 && board[second] === 0 && !isOwn(board[to]!, bits)) out.push(encodeMove(from, to));
        }
        break;
      case ADVISOR:
      case GENERAL:
        for (const to of PALACE_TARGETS[c][from]!) if (!isOwn(board[to]!, bits)) out.push(encodeMove(from, to));
        break;
      case CHARIOT:
        for (const ray of RAYS[from]!) {
          for (const to of ray) {
            const q = board[to]!;
            if (q === 0) {
              out.push(encodeMove(from, to));
              continue;
            }
            if (!isOwn(q, bits)) out.push(encodeMove(from, to));
            break;
          }
        }
        break;
      case CANNON:
        for (const ray of RAYS[from]!) {
          // A cannon always jumps exactly one piece, and neither jumps nor takes another cannon.
          let i = 0;
          while (i < ray.length && board[ray[i]!] === 0) i++;
          if (i >= ray.length || (board[ray[i]!]! & TYPE_MASK) === CANNON) continue;
          for (i++; i < ray.length; i++) {
            const q = board[ray[i]!]!;
            if (q === 0) {
              out.push(encodeMove(from, ray[i]!));
              continue;
            }
            if (!isOwn(q, bits) && (q & TYPE_MASK) !== CANNON) out.push(encodeMove(from, ray[i]!));
            break;
          }
        }
        break;
    }
  }
  return out;
}

/** Applies a move for colour `c` in place and returns the captured code (0 if none). */
export function makeRaw(board: Board, m: number): number {
  const from = moveFrom(m);
  const to = moveTo(m);
  if (from === to) return 0;
  const piece = board[from]!;
  const captured = board[to]!;
  board[from] = 0;
  board[to] = piece;
  return captured;
}

export function unmakeRaw(board: Board, m: number, moved: number, captured: number): void {
  if (isPass(m)) return;
  board[moveFrom(m)] = moved;
  board[moveTo(m)] = captured;
}

/**
 * Position::legal(). A move may not leave the mover's general attacked. While the generals face each other
 * (`facing`) a move must also end that; passing is then always allowed, even in check, and accepts bikjang.
 */
export function isLegal(board: Board, m: number, c: ColorIndex, facing: boolean): boolean {
  if (isPass(m)) return facing || !inCheck(board, c);
  const moved = board[moveFrom(m)]!;
  const captured = makeRaw(board, m);
  const legal = !inCheck(board, c) && !(facing && generalsFace(board));
  unmakeRaw(board, m, moved, captured);
  return legal;
}

/** Every legal move, the pass last. */
export function generateLegalMoves(board: Board, c: ColorIndex): number[] {
  const facing = generalsFace(board);
  const moves = generatePieceMoves(board, c).filter((m) => isLegal(board, m, c, facing));
  const general = findGeneral(board, c);
  const pass = encodeMove(general, general);
  if (general >= 0 && isLegal(board, pass, c, facing)) moves.push(pass);
  return moves;
}
