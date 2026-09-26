import { squareNameOf } from '@chaturanga/rules-core';
import { describe, expect, it } from 'vitest';
import { makruk } from './variant';

const names = (fen: string | undefined, color: 'w' | 'b'): string[] =>
  makruk.createGame(fen)
    .attackedSquares(color)
    .map((sq) => squareNameOf(sq, makruk.files));

describe('attackedSquares (plat-015)', () => {
  it('counts pawns on their capturing diagonals, not straight ahead', () => {
    const own = names(undefined, 'w');
    expect(own).toEqual(expect.arrayContaining(['a4', 'e4', 'h4']));
    expect(own).not.toContain('e5');
  });

  it('counts the Khon\'s forward step and marks defended own pieces', () => {
    const own = names('4k3/8/8/8/8/8/8/2S1K3 w - - 0 1', 'w');
    expect(own).toEqual(['d1', 'f1', 'b2', 'c2', 'd2', 'e2', 'f2']);
  });
});
