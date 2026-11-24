import { describeVariantConformance, loadFfish, mulberry32 } from '@chaturanga/rules-core/testing';
import { describe, expect, it } from 'vitest';
import { Game, parseSquare, shatranj } from './index';

const mate = '6k1/5ppp/8/8/8/8/8/3R2K1 w - - 0 1';
const promote = '7k/4P2p/8/8/8/8/8/K7 w - - 0 1';

describeVariantConformance(shatranj, {
  fens: [mate, promote, '7k/7r/8/8/8/8/8/KR6 b - - 139 70'],
  invalidFens: ['', '7k/8/8/8/8/8/8/8 w - - 0 1', '7k/8/8/8/8/8/8/K7 w K - 0 1'],
  illegalMoves: ['a1a3', 'e2e4', 'e2e3q', 'd1b1'],
  checkmate: { fen: mate, move: 'd1d8', winner: 'w' },
});

describe('classical Shatranj rules', () => {
  it('lets the alfil leap diagonally over its own pawn and forbids a double pawn step', () => {
    const legal = new Game().legalUci();
    expect(legal).toContain('c1e3');
    expect(legal).toContain('c1a3');
    expect(legal).not.toContain('c1d2');
    expect(legal).not.toContain('e2e4');
  });

  it('promotes only to a ferz, which moves a single diagonal step', () => {
    const game = new Game(promote);
    expect(game.legalUci().filter((m) => m.startsWith('e7'))).toEqual(['e7e8q']);
    expect(game.move('e7e8q').san).toBe('e8=Q');
    expect(game.pieceAt(parseSquare('e8'))).toEqual({ color: 'w', type: 'q', promoted: true });
    expect(game.attackedSquares('w')).toContain(parseSquare('d7'));
    expect(game.attackedSquares('w')).not.toContain(parseSquare('c6'));
    game.undo();
    expect(game.fen()).toBe(promote);
  });

  it('awards the game to the side that stalemates its opponent', () => {
    const game = new Game('7k/p4K2/R5P1/8/8/8/8/8 b - - 0 1');
    expect(game.status()).toEqual({ kind: 'stalemate', winner: 'w' });
  });

  it('wins by baring the king and draws if the king can immediately bare its opponent', () => {
    const win = new Game('7k/8/8/8/8/3p4/8/K2R4 w - - 0 1');
    const draw = new Game('8/8/8/8/4k3/3p4/8/K2R4 w - - 0 1');
    win.move('d1d3');
    draw.move('d1d3');
    expect(win.status()).toEqual({ kind: 'bare-king', winner: 'w' });
    expect(draw.status()).toEqual({ kind: 'bare-king' });
    expect(draw.legalUci()).toEqual([]);
    expect(() => draw.move('e4d3')).toThrow();
  });

  it('draws on the third repetition and on the 140th no-progress ply', () => {
    const repeated = new Game();
    for (let count = 0; count < 2; count++) {
      for (const move of ['b1c3', 'b8c6', 'c3b1', 'c6b8']) repeated.move(move);
    }
    expect(repeated.status()).toEqual({ kind: 'repetition' });

    const counted = new Game('7k/7r/8/8/8/8/8/KR6 w - - 139 70');
    counted.move('b1b2');
    expect(counted.status()).toEqual({ kind: 'counting' });
  });

  it('matches Fairy-Stockfish legal moves and FEN across seeded games', async () => {
    const ffish = await loadFfish();
    for (let seed = 1; seed <= 12; seed++) {
      const reference = new ffish.Board('shatranj');
      const game = new Game();
      const random = mulberry32(seed);
      try {
        expect(game.fen()).toBe(reference.fen());
        for (let ply = 0; ply < 160 && !game.isGameOver(); ply++) {
          const moves = game.legalUci().sort();
          expect(moves, `seed ${seed}, ply ${ply}, ${game.fen()}`).toEqual(reference.legalMoves().split(' ').sort());
          const move = moves[Math.floor(random() * moves.length)]!;
          expect(reference.push(move)).toBe(true);
          game.move(move);
          expect(game.fen()).toBe(reference.fen());
        }
      } finally {
        reference.delete();
      }
    }
  }, 15_000);
});
