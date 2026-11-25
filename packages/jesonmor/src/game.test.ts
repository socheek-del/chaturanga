import { describe, expect, it } from 'vitest';
import { BLACK_TO_MOVE_FEN, START_FEN } from './fen';
import { Game } from './game';

describe('Jeson Mor moves and capture', () => {
  it('jumps in the standard chess-knight pattern, including over occupied squares', () => {
    const game = new Game();
    expect(game.legalUci()).toContain('a1b3');
    expect(game.legalUci()).toContain('a1c2');
    expect(game.legalUci()).not.toContain('a1a3');
    expect(new Game(BLACK_TO_MOVE_FEN).turn).toBe('b');
  });

  it('captures on landing and records coordinate notation', () => {
    const game = new Game('9/9/9/9/4n4/2N6/9/9/9 w - - 0 1 -');
    const record = game.move('c4e5');
    expect(record.san).toBe('c4xe5');
    expect(record.captured).toEqual({ color: 'b', type: 'n', promoted: false });
    expect(game.status()).toEqual({ kind: 'elimination', winner: 'w' });
    expect(game.legalUci()).toEqual([]);
  });

  it('rejects landing on a friendly horse', () => {
    const game = new Game('n8/9/9/9/9/9/9/2N6/NN7 w - - 0 1 -');
    const before = game.fen();
    expect(() => game.move('a1c2')).toThrow();
    expect(game.fen()).toBe(before);
  });
});

describe('the vulnerable e5 race', () => {
  it('requires the same horse to survive one reply, then escape on its next turn', () => {
    const game = new Game('n8/9/9/9/9/2N6/9/9/9 w - - 0 1 -');
    game.move('c4e5');
    expect(game.status()).toEqual({ kind: 'ongoing' });
    expect(game.fen()).toMatch(/ 1 w$/);
    expect(new Game(game.fen()).fen()).toBe(game.fen());

    game.move('a9b7');
    expect(game.status()).toEqual({ kind: 'ongoing' });
    expect(game.legalUci().every((move) => move.startsWith('e5'))).toBe(true);
    game.move('e5f7');
    expect(game.status()).toEqual({ kind: 'goal-square', winner: 'w' });
    expect(game.legalUci()).toEqual([]);
    expect(new Game(game.fen()).status()).toEqual({ kind: 'goal-square', winner: 'w' });
  });

  it('cancels the attempt when the opponent captures the center horse', () => {
    const game = new Game('9/9/9/2n6/9/2N6/9/9/N8 w - - 0 1 -');
    game.move('c4e5');
    const capture = game.move('c6e5');
    expect(capture.captured).toEqual({ color: 'w', type: 'n', promoted: false });
    expect(game.status()).toEqual({ kind: 'ongoing' });
    expect(game.pieceAt(40)).toEqual({ color: 'b', type: 'n', promoted: false });
    expect(game.fen()).toMatch(/ w - - 0 2 b$/);
  });

  it('preserves the center attempt if the reply captures elsewhere', () => {
    const game = new Game('n8/9/9/9/5N3/2Nn5/9/9/9 w - - 0 1 -');
    game.move('c4e5');
    game.move('d4f5');
    expect(game.fen()).toMatch(/ w - - 0 2 w$/);
    expect(game.legalUci().every((move) => move.startsWith('e5'))).toBe(true);
  });
});

describe('Jeson Mor endings and history', () => {
  it('draws on the third occurrence of the same board and side to move', () => {
    const game = new Game();
    for (let cycle = 0; cycle < 2; cycle++) {
      game.move('a1b3');
      game.move('i9h7');
      game.move('b3a1');
      game.move('h7i9');
    }
    expect(game.fen().split(' ').slice(0, 2)).toEqual(START_FEN.split(' ').slice(0, 2));
    expect(game.status()).toEqual({ kind: 'repetition' });
    expect(game.legalUci()).toEqual([]);
  });

  it('treats a forced e5 escape with no legal knight landing as a loss', () => {
    const game = new Game('n8/9/3N1N3/2N3N2/4N4/2N3N2/3N1N3/9/9 w - - 0 1 w');
    expect(game.status()).toEqual({ kind: 'stalemate', winner: 'b' });
    expect(game.legalUci()).toEqual([]);
  });

  it('undoes the center escape and restores the pending attempt', () => {
    const game = new Game('n8/9/9/9/4N4/9/9/9/9 w - - 0 1 w');
    const before = game.fen();
    game.move('e5f7');
    expect(game.status()).toEqual({ kind: 'goal-square', winner: 'w' });
    game.undo();
    expect(game.fen()).toBe(before);
    expect(game.status()).toEqual({ kind: 'ongoing' });
  });
});
