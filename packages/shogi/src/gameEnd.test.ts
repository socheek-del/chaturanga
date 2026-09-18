/**
 * How a Shogi game ends (sg-002). Every fixture was checked against Fairy-Stockfish (ffish 0.7.10)
 * before it was written down; the lock-step games in reference.test.ts re-check the same rules
 * continuously.
 */
import { describe, expect, it } from 'vitest';
import { Game } from './game';

const play = (game: Game, moves: string[]): Game => {
  for (const uci of moves) game.move(uci);
  return game;
};

describe('game end (sg-002)', () => {
  it('checkmate names the winner', () => {
    const game = new Game(
      '8b/lrssgkg1P/1pnp2psN/p1N1P2pl/1b1P1SP1L/P8/1PP4P1/2G3+p2/LNg1K4[ppppr] b - - 1 54',
    );
    game.move('R@d1');
    expect(game.status()).toEqual({ kind: 'checkmate', winner: 'b' });
    expect(game.isGameOver()).toBe(true);
  });

  it('a side with no legal move and no check loses (stalemate)', () => {
    const game = new Game('k8/9/NG7/9/9/9/9/9/8K[] b - - 0 1');
    expect(game.inCheck()).toBe(false);
    expect(game.legalUci()).toEqual([]);
    expect(game.status()).toEqual({ kind: 'stalemate', winner: 'w' });
  });

  it('the fourth time the same position comes up is a draw (sennichite)', () => {
    const game = new Game('4k4/9/9/9/9/9/9/1R7/4K4[] w - - 0 1');
    const cycle = ['b2c2', 'e9d9', 'c2b2', 'd9e9'];
    const moves = [...cycle, ...cycle, ...cycle];
    play(game, moves.slice(0, 11));
    expect(game.status()).toEqual({ kind: 'ongoing' });
    game.move(moves[11]!);
    expect(game.status()).toEqual({ kind: 'repetition' });
  });

  it('a side that keeps checking through the repetition loses (perpetual check)', () => {
    const game = new Game('4k4/9/9/9/9/9/9/9/R3K4[] w - - 0 1');
    const moves = [
      'a1a9',
      'e9f8',
      'a9a8',
      'f8e9',
      'a8a9',
      'e9f8',
      'a9a8',
      'f8e9',
      'a8a9',
      'e9f8',
      'a9a8',
      'f8e9',
      'a8a9',
    ];
    play(game, moves.slice(0, 12));
    expect(game.status()).toEqual({ kind: 'ongoing' });
    game.move(moves[12]!);
    expect(game.status()).toEqual({ kind: 'perpetual-check', winner: 'b' });
  });

  it('undo takes the repetition back with the move', () => {
    const game = new Game('4k4/9/9/9/9/9/9/1R7/4K4[] w - - 0 1');
    const cycle = ['b2c2', 'e9d9', 'c2b2', 'd9e9'];
    play(game, [...cycle, ...cycle, ...cycle]);
    expect(game.status().kind).toBe('repetition');
    game.undo();
    expect(game.status()).toEqual({ kind: 'ongoing' });
  });

  it('has no counting rule', () => {
    expect(new Game().counting()).toBeNull();
  });
});
