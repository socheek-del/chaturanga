import { squareNameOf } from '@chaturanga/rules-core';
import { describe, expect, it } from 'vitest';
import { chess } from './variant';

const names = (fen: string | undefined, color: 'w' | 'b'): string[] =>
  chess.createGame(fen)
    .attackedSquares(color)
    .map((sq) => squareNameOf(sq, chess.files));

describe('attackedSquares (plat-015)', () => {
  it('counts pawn diagonals and defended pieces, not pawn pushes', () => {
    const own = names(undefined, 'w');
    expect(own).toEqual(expect.arrayContaining(['a3', 'e3', 'h3', 'd2', 'e2']));
    expect(own).not.toContain('e4');
    expect(own).not.toContain('a1');
  });
});
