import { squareNameOf } from '@chaturanga/rules-core';
import { describe, expect, it } from 'vitest';
import { xiangqi } from './variant';

const names = (fen: string | undefined, color: 'w' | 'b'): string[] =>
  xiangqi.createGame(fen)
    .attackedSquares(color)
    .map((sq) => squareNameOf(sq, xiangqi.files));

describe('attackedSquares (plat-015)', () => {
  it('covers advisors, elephants and the cannon past its screen', () => {
    const own = names(undefined, 'w');
    expect(own).toEqual(expect.arrayContaining(['e2', 'a3', 'e3', 'b10']));
    // The cannon on b3 jumps the enemy cannon on b8: b8 itself is its screen, not its target.
    expect(own).not.toContain('b8');
    // The horse on b1 is hobbled by the elephant on c1.
    expect(own).not.toContain('d2');
  });

  it('blocks an elephant whose eye is occupied', () => {
    const own = names('3k5/9/9/9/9/9/9/9/3P5/2B1K4 w - - 0 1', 'w');
    expect(own).toContain('a3');
    expect(own).not.toContain('e3');
  });
});
