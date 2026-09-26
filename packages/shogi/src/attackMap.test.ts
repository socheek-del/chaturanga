import { squareNameOf } from '@chaturanga/rules-core';
import { describe, expect, it } from 'vitest';
import { shogi } from './variant';

const names = (fen: string | undefined, color: 'w' | 'b'): string[] =>
  shogi.createGame(fen)
    .attackedSquares(color)
    .map((sq) => squareNameOf(sq, shogi.files));

describe('attackedSquares (plat-015)', () => {
  it('counts pawns straight ahead and nothing for pieces in hand', () => {
    const own = names(undefined, 'w');
    for (const file of 'abcdefghi') expect(own).toContain(`${file}4`);
    expect(own).not.toContain('e5');
    expect(names('4k4/9/9/9/9/9/9/9/4K4[RR] w - - 0 1', 'w').sort()).toEqual(['d1', 'd2', 'e2', 'f1', 'f2']);
  });
});
