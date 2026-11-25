import type { ColorIndex } from '@chaturanga/chess/core';
import { BLACK, type Position, TYPE_MASK } from '@chaturanga/chess/core';
import type { Pockets } from '@chaturanga/crazyhouse';

export const PIECE_VALUE = [0, 100, 320, 330, 500, 900, 0] as const;
const HAND_VALUE = [0, 125, 365, 375, 560, 980] as const;

export function materialBalance(pos: Position, pockets: Pockets, color: ColorIndex): number {
  const sideValue = [0, 0];
  for (let square = 0; square < 64; square++) {
    const code = pos.board[square]!;
    if (!code) continue;
    const side = code & BLACK ? 1 : 0;
    sideValue[side]! += PIECE_VALUE[code & TYPE_MASK]!;
  }
  for (const side of [0, 1] as const) {
    const colorName = side === 0 ? 'w' : 'b';
    for (const [type, index] of Object.entries({ p: 1, n: 2, b: 3, r: 4, q: 5 }) as Array<['p' | 'n' | 'b' | 'r' | 'q', number]>) {
      sideValue[side]! += pockets[colorName][type] * HAND_VALUE[index]!;
    }
  }
  return sideValue[color]! - sideValue[color === 0 ? 1 : 0]!;
}

/** Pocket-aware Crazyhouse evaluation, from the side-to-move's point of view. */
export function evaluate(pos: Position, pockets: Pockets, turn: ColorIndex): number {
  const score = [0, 0];
  for (let square = 0; square < 64; square++) {
    const code = pos.board[square]!;
    if (!code) continue;
    const side = code & BLACK ? 1 : 0;
    const type = code & TYPE_MASK;
    score[side]! += PIECE_VALUE[type]!;
    const file = square & 7;
    const rank = square >> 3;
    const forwardRank = side === 0 ? rank : 7 - rank;
    const center = 7 - Math.abs(file - 3.5) - Math.abs(rank - 3.5);
    if (type === 1) score[side]! += forwardRank * 5 + center * 2;
    else if (type === 2 || type === 3) score[side]! += center * 8;
    else if (type === 5) score[side]! += center * 3;
  }
  for (const side of [0, 1] as const) {
    const colorName = side === 0 ? 'w' : 'b';
    for (const [type, index] of Object.entries({ p: 1, n: 2, b: 3, r: 4, q: 5 }) as Array<['p' | 'n' | 'b' | 'r' | 'q', number]>) {
      score[side]! += pockets[colorName][type] * HAND_VALUE[index]!;
    }
  }
  return score[turn]! - score[turn === 0 ? 1 : 0]!;
}
