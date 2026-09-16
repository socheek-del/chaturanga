/** Xiangqi move generation on the numeric board. Moves are encoded as from | (to << 7). */
import {
  ADVISOR,
  ADVISOR_TARGETS,
  BLACK,
  type Board,
  CANNON,
  CHARIOT,
  type ColorIndex,
  colorBits,
  ELEPHANT,
  ELEPHANT_TARGETS,
  GENERAL,
  GENERAL_TARGETS,
  HORSE,
  HORSE_TARGETS,
  RAYS,
  SOLDIER,
  SOLDIER_TARGETS,
  TYPE_MASK,
} from './board';
import { inCheck } from './attacks';
import type { Square } from './types';

const TO_SHIFT = 7;
const SQUARE_MASK = (1 << TO_SHIFT) - 1;

export const encodeMove = (from: Square, to: Square): number => from | (to << TO_SHIFT);
export const moveFrom = (m: number): Square => m & SQUARE_MASK;
export const moveTo = (m: number): Square => (m >> TO_SHIFT) & SQUARE_MASK;

const isOwn = (code: number, bits: number): boolean => code !== 0 && (code & BLACK) === bits;

/** Pseudo-legal moves of every piece colour `c` owns (does not check for self-check). */
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
        for (const { to, eye } of ELEPHANT_TARGETS[c][from]!) {
          if (board[eye] === 0 && !isOwn(board[to]!, bits)) out.push(encodeMove(from, to));
        }
        break;
      case ADVISOR:
        for (const to of ADVISOR_TARGETS[c][from]!) if (!isOwn(board[to]!, bits)) out.push(encodeMove(from, to));
        break;
      case GENERAL:
        for (const to of GENERAL_TARGETS[c][from]!) if (!isOwn(board[to]!, bits)) out.push(encodeMove(from, to));
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
          let i = 0;
          while (i < ray.length && board[ray[i]!] === 0) {
            out.push(encodeMove(from, ray[i]!));
            i++;
          }
          if (i >= ray.length) continue;
          i++; // step past the screen
          while (i < ray.length && board[ray[i]!] === 0) i++;
          if (i < ray.length && !isOwn(board[ray[i]!]!, bits)) out.push(encodeMove(from, ray[i]!));
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
  const piece = board[from]!;
  const captured = board[to]!;
  board[from] = 0;
  board[to] = piece;
  return captured;
}

export function unmakeRaw(board: Board, m: number, moved: number, captured: number): void {
  board[moveFrom(m)] = moved;
  board[moveTo(m)] = captured;
}

/** True when playing `m` for colour `c` does not leave that colour's own general attacked (or facing). */
export function isLegal(board: Board, m: number, c: ColorIndex): boolean {
  const moved = board[moveFrom(m)]!;
  const captured = makeRaw(board, m);
  const legal = !inCheck(board, c);
  unmakeRaw(board, m, moved, captured);
  return legal;
}

export function generateLegalMoves(board: Board, c: ColorIndex): number[] {
  return generatePieceMoves(board, c).filter((m) => isLegal(board, m, c));
}
