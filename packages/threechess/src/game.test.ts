import { describeVariantConformance } from '@chaturanga/rules-core/testing';
import { describe, expect, it } from 'vitest';
import { Game, parseSquare, squareName, threechess } from './game';

function fen(pieces: Array<[string, 'w' | 'b' | 'r', string, boolean?]>, turn: 'w' | 'b' | 'r' = 'w', ep = '-', eliminated = '-', result = '-') {
  const board = Array.from({ length: 12 }, () => Array.from({ length: 8 }, () => '-'));
  for (const [square, color, type, moved = false] of pieces) {
    const index = parseSquare(square)!;
    board[Math.floor(index / 8)]![index % 8] = `${color}${type}${moved ? '!' : ''}`;
  }
  return `${board.map((rank) => rank.join(',')).join('/')} ${turn} ${ep} ${eliminated} ${result}`;
}

const mateFen = fen([
  ['a1', 'b', 'k'],
  ['c2', 'w', 'k'],
  ['b4', 'w', 'q'],
  ['a6', 'w', 'r'],
  ['b6', 'w', 'r'],
], 'w', '-', 'r');

describeVariantConformance(threechess, {
  fens: [threechess.startFen, fen([['a1', 'w', 'k'], ['e5', 'b', 'k'], ['e9', 'r', 'k']], 'b')],
  invalidFens: ['not a position', '8/8 w - - -', `${threechess.startFen} extra`],
  illegalMoves: ['a2a5', 'a1a2', 'z1a2', 'e2e4q'],
  checkmate: { fen: mateFen, move: 'b4b3', winner: 'w' },
});

describe('Three-player chess on the ring', () => {
  it('has 96 squares, three full armies and a legal turn for every seat', () => {
    expect(threechess.files * threechess.ranks).toBe(96);
    expect(threechess.players).toEqual(['w', 'b', 'r']);
    const game = threechess.createGame();
    expect(game.pieces()).toHaveLength(48);
    expect(game.legalUci().length).toBeGreaterThan(20);
    game.move('e2e4');
    expect(game.turn).toBe('b');
    expect(game.legalUci().length).toBeGreaterThan(20);
    game.move('e6e8');
    expect(game.turn).toBe('r');
    expect(game.legalUci().length).toBeGreaterThan(20);
  });

  it('wraps rank movement across the ring seam while files stay bounded', () => {
    const game = new Game(fen([['e1', 'w', 'k'], ['e5', 'b', 'k'], ['e9', 'r', 'k'], ['a1', 'w', 'r']]));
    expect(game.legalUci()).toContain('a1a12');
    expect(squareName(parseSquare('h12')!)).toBe('h12');
    expect(parseSquare('i1')).toBeNull();
  });

  it('detects checks from every living opponent', () => {
    const game = new Game(fen([['a1', 'w', 'k'], ['a6', 'b', 'r'], ['h5', 'b', 'k'], ['h9', 'r', 'k']]));
    expect(game.inCheck()).toBe(true);
    expect(game.checkedKingSquare()).toBe(parseSquare('a1'));
    expect(game.attackedSquares('b')).toContain(parseSquare('a1'));
  });

  it('supports en passant on the shared ring and removes the passed pawn', () => {
    const game = new Game(fen([['e1', 'w', 'k'], ['e5', 'b', 'k'], ['e9', 'r', 'k'], ['e4', 'w', 'p'], ['d2', 'b', 'p']], 'b', 'e3'));
    expect(game.legalUci()).toContain('d2e3');
    game.move('d2e3');
    expect(game.pieceAt(parseSquare('e4')!)).toBeNull();
    expect(game.pieceAt(parseSquare('e3')!)).toMatchObject({ color: 'b', type: 'p' });
  });

  it('promotes on the next sector and permits all four choices', () => {
    const game = new Game(fen([['e1', 'w', 'k'], ['e5', 'b', 'k'], ['e9', 'r', 'k'], ['d4', 'w', 'p']]));
    expect(game.legalUci()).toEqual(expect.arrayContaining(['d4d5q', 'd4d5r', 'd4d5b', 'd4d5n']));
    game.move('d4d5');
    expect(game.pieceAt(parseSquare('d5')!)).toMatchObject({ color: 'w', type: 'q', promoted: true });
  });

  it('castles on a home rank and moves the rook with the king', () => {
    const game = new Game(fen([['e1', 'w', 'k'], ['a1', 'w', 'r'], ['h1', 'w', 'r'], ['e5', 'b', 'k'], ['e9', 'r', 'k']]));
    expect(game.legalUci()).toEqual(expect.arrayContaining(['e1g1', 'e1c1']));
    game.move('e1g1');
    expect(game.pieceAt(parseSquare('g1')!)).toMatchObject({ type: 'k', moved: true });
    expect(game.pieceAt(parseSquare('f1')!)).toMatchObject({ type: 'r', moved: true });
  });

  it('eliminates a mated seat and ends when only one king remains', () => {
    const game = new Game(mateFen);
    game.move('b4b3');
    expect(game.isEliminated('b')).toBe(true);
    expect(game.winnerPlayer()).toBe('w');
    expect(game.status()).toEqual({ kind: 'checkmate', winner: 'w' });
    expect(game.isGameOver()).toBe(true);
  });

  it('undo restores the previous seat, board and legal moves', () => {
    const game = threechess.createGame();
    const start = game.fen();
    game.move('e2e4');
    expect(game.undo()).not.toBeNull();
    expect(game.fen()).toBe(start);
    expect(game.turn).toBe('w');
    expect(game.undo()).toBeNull();
  });
});
