import { squareNameOf } from '@chaturanga/rules-core';
import { describe, expect, it } from 'vitest';
import { sittuyin } from './variant';

const names = (fen: string | undefined, color: 'w' | 'b'): string[] =>
  sittuyin.createGame(fen)
    .attackedSquares(color)
    .map((sq) => squareNameOf(sq, sittuyin.files));

describe('attackedSquares (plat-015)', () => {
  it('ignores pieces still in hand during setup', () => {
    expect(names(undefined, 'w').sort()).toEqual(['a4', 'b4', 'c4', 'd4', 'd5', 'e4', 'e5', 'f5', 'g5', 'h5']);
  });
});
