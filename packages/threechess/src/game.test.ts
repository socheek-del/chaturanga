import { describeVariantConformance } from '@chaturanga/rules-core/testing';
import { describe, expect, it } from 'vitest';
import { Game, parseSquare, threechess } from './game';
import { SIZE, hexAt, hexOf } from './hex';
import type { Player } from './types';

function fen(pieces: Array<[string, Player, string]>, eliminated = '-') {
  const board = Array.from({ length: SIZE * SIZE }, (_, square) => hexAt(...hexOf(square)) === null ? '.' : '-');
  for (const [cell, color, type] of pieces) board[parseSquare(cell)!] = color + type;
  const rows = Array.from({ length: SIZE }, (_, row) => board.slice(row * SIZE, (row + 1) * SIZE).join(','));
  return `${rows.join('/')} w - ${eliminated} -`;
}

const mateFen = fen([['f1', 'b', 'k'], ['h1', 'w', 'k'], ['i1', 'w', 'q']], 'r');

describeVariantConformance(threechess, {
  fens: [threechess.startFen, mateFen],
  invalidFens: ['not a position', '8/8 w - - -', `${threechess.startFen} extra`],
  illegalMoves: ['d10d8', 'a1a2', 'z1a2', 'd10d9q'],
  checkmate: { fen: mateFen, move: 'i1g2', winner: 'w' },
});

describe('Hex-cell chess', () => {
  it('starts three equal armies and advances through rotated pawn directions', () => {
    const game = new Game();
    expect(game.pieces()).toHaveLength(36);
    game.move('d10d9');
    expect(game.turn).toBe('b');
    game.move('j4i5');
    expect(game.turn).toBe('r');
    expect(game.legalUci()).toContain('d4e4');
  });

  it('moves a rook along six edge lines and stops at a blocker', () => {
    const game = new Game(fen([['f6', 'w', 'r'], ['h6', 'w', 'p']]));
    expect(game.attackedSquares('w')).toEqual(expect.arrayContaining(['g6', 'e6', 'g5', 'f5', 'e7', 'f7'].map(parseSquare)));
    expect(game.legalUci()).not.toContain('f6i6');
    expect(parseSquare('a1')).toBeNull();
  });

  it('moves a bishop along six corner lines', () => {
    const game = new Game(fen([['f6', 'w', 'b']]));
    expect(game.attackedSquares('w')).toEqual(expect.arrayContaining(['g7', 'h5', 'g4', 'e5', 'd7', 'e8'].map(parseSquare)));
    expect(game.legalUci()).not.toContain('f6g6');
  });

  it('gives the knight twelve destinations from the center', () => {
    const game = new Game(fen([['f6', 'w', 'n']]));
    expect(game.legalUci()).toHaveLength(12);
  });

  it('allows four promotions when a pawn reaches its far boundary', () => {
    const game = new Game(fen([['f2', 'w', 'p'], ['a10', 'w', 'k'], ['k5', 'b', 'k'], ['k1', 'r', 'k']]));
    expect(game.legalUci()).toEqual(expect.arrayContaining(['f2f1q', 'f2f1r', 'f2f1b', 'f2f1n']));
    game.move('f2f1n');
    expect(game.pieceAt(parseSquare('f1')!)).toMatchObject({ type: 'n', promoted: true });
  });
});
