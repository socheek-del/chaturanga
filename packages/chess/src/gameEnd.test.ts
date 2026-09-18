import { describe, expect, it } from 'vitest';
import { Game } from './game';
import { loadFfish } from './testing/ffish';

/** Every drawn material ending Fairy-Stockfish recognises, and the ones it does not (ch-002). */
const MATERIAL: Array<[string, boolean, string]> = [
  ['8/8/6K1/8/8/2k5/8/8 w - - 0 1', true, 'bare kings'],
  ['8/8/6K1/8/6B1/2k5/8/8 w - - 0 1', true, 'king and bishop'],
  ['8/8/6K1/8/6N1/2k5/8/8 w - - 0 1', true, 'king and knight'],
  ['8/8/6K1/8/6b1/2k5/8/5b2 w - - 0 1', true, 'two bishops on one colour'],
  ['8/8/6K1/8/6b1/2k5/8/4b3 w - - 0 1', false, 'two bishops on both colours'],
  ['4kb2/8/8/8/8/8/8/4KB2 w - - 0 1', false, 'a bishop each'],
  ['4kn2/8/8/8/8/8/8/4KN2 w - - 0 1', false, 'a knight each'],
  ['4k3/8/8/8/8/8/8/4KNN1 w - - 0 1', false, 'king and two knights'],
  ['4k3/8/8/8/8/8/8/4KR2 w - - 0 1', false, 'king and rook'],
  ['4k3/8/8/8/8/8/4P3/4K3 w - - 0 1', false, 'a pawn is still on the board'],
];

describe('how a chess game ends (ch-002)', () => {
  it('mate ends the game with a winner', () => {
    const game = new Game('6k1/5ppp/8/8/8/8/8/3R2K1 w - - 0 1');
    const record = game.move('d1d8');
    expect(record.san).toBe('Rd8#');
    expect(game.status()).toEqual({ kind: 'checkmate', winner: 'w' });
    expect(game.isGameOver()).toBe(true);
  });

  it('stalemate is a draw, with no winner', () => {
    const game = new Game('7k/8/8/3K1Q2/8/8/8/8 w - - 0 1');
    game.move('f5f7');
    expect(game.status()).toEqual({ kind: 'stalemate' });
  });

  it.each(MATERIAL)('%s is a dead position: %s (%s)', (fen, dead) => {
    expect(new Game(fen).status().kind === 'insufficient-material').toBe(dead);
  });

  it('a third repetition of the same position is a draw', () => {
    const game = new Game('4k3/8/8/8/8/8/R7/4K2R w - - 0 1');
    for (const uci of ['h1h2', 'e8f8', 'h2h1', 'f8e8', 'h1h2', 'e8f8', 'h2h1']) {
      expect(game.status().kind, `before ${uci}`).toBe('ongoing');
      game.move(uci);
    }
    // The position after Black's reply repeats for the third time.
    game.move('f8e8');
    expect(game.status()).toEqual({ kind: 'repetition' });
  });

  it('a position that repeats only twice is still being played', () => {
    const game = new Game('4k3/8/8/8/8/8/R7/4K2R w - - 0 1');
    for (const uci of ['h1h2', 'e8f8', 'h2h1', 'f8e8']) game.move(uci);
    expect(game.status().kind).toBe('ongoing');
  });

  it('fifty moves without a pawn move or a capture end the game', () => {
    const game = new Game('4k3/8/8/8/8/8/R7/4K2R w - - 99 60');
    expect(game.status().kind).toBe('ongoing');
    game.move('a2a3');
    expect(game.halfmoveClock()).toBe(100);
    expect(game.status()).toEqual({ kind: 'fifty-move' });
  });

  it('a capture or a pawn move restarts the fifty-move count', () => {
    const game = new Game('4k3/8/8/8/8/8/P7/4K3 w - - 40 60');
    game.move('a2a4');
    expect(game.halfmoveClock()).toBe(0);
  });

  it('agrees with Fairy-Stockfish about every ending above', async () => {
    const ffish = await loadFfish();
    for (const [fen, dead, name] of MATERIAL) {
      const ref = new ffish.Board('chess', fen);
      try {
        expect(ref.isGameOver(true), name).toBe(dead);
      } finally {
        ref.delete();
      }
    }
  });
});
