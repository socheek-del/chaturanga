import { describeVariantConformance, loadFfish, mulberry32 } from '@chaturanga/rules-core/testing';
import { describe, expect, it } from 'vitest';
import { chaturanga, Game, parseSquare } from './index';

const mate = '6k1/5ppp/8/8/8/8/8/3R2K1 w - - 0 1';
const promote = '7k/4P2p/8/8/8/8/8/K7 w - - 0 1';

describeVariantConformance(chaturanga, {
  fens: [mate, promote, '7k/p4K2/R5P1/8/8/8/8/8 b - - 0 1'],
  invalidFens: ['', '7k/8/8/8/8/8/8/8 w - - 0 1', '7k/8/8/8/8/8/8/K7 w K - 0 1'],
  illegalMoves: ['a1b2', 'e2e4', 'e2e3q', 'e1b1'],
  checkmate: { fen: mate, move: 'd1d8', winner: 'w' },
});

describe('al-Adli rules', () => {
  it('starts the two rajas on different files and lets an elephant leap over infantry', () => {
    const game = new Game();
    expect(game.pieceAt(parseSquare('e1'))?.type).toBe('k');
    expect(game.pieceAt(parseSquare('d8'))?.type).toBe('k');
    expect(game.legalUci().filter((uci) => uci.startsWith('a1'))).toEqual(['a1a3']);
    game.move('a1a3');
    expect(game.legalUci()).toContain('h8h6');
  });

  it('promotes infantry on the last rank to a diagonal-moving adviser', () => {
    const game = new Game(promote);
    expect(game.legalUci().filter((uci) => uci.startsWith('e7'))).toEqual(['e7e8q']);
    game.move('e7e8q');
    expect(game.pieceAt(parseSquare('e8'))).toEqual({ color: 'w', type: 'q', promoted: true });
    expect(game.attackedSquares('w')).toContain(parseSquare('d7'));
    expect(game.attackedSquares('w')).not.toContain(parseSquare('c6'));
  });

  it('awards a safe but immobile side the win', () => {
    const game = new Game('7k/p4K2/R5P1/8/8/8/8/8 b - - 0 1');
    expect(game.inCheck()).toBe(false);
    expect(game.status()).toEqual({ kind: 'stalemate', winner: 'b' });
  });

  it('wins immediately on baring the king even if it could strike back', () => {
    const game = new Game('8/8/8/8/4k3/3p4/8/K2R4 w - - 0 1');
    game.move('d1d3');
    expect(game.status()).toEqual({ kind: 'bare-king', winner: 'w' });
    expect(game.legalUci()).toEqual([]);
  });

  it('matches a configured Fairy-Stockfish move oracle in seeded games', async () => {
    const ffish = await loadFfish() as Awaited<ReturnType<typeof loadFfish>> & { loadVariantConfig(config: string): void };
    ffish.loadVariantConfig(`
[chaturanga-al-adli:shatranj]
alfil = -
customPiece1 = b:D
startFen = ${chaturanga.startFen}
stalemateValue = win
extinctionValue = none
`);
    for (let seed = 1; seed <= 8; seed++) {
      const game = new Game();
      const reference = new ffish.Board('chaturanga-al-adli');
      const random = mulberry32(seed);
      try {
        for (let ply = 0; ply < 130 && !game.isGameOver(); ply++) {
          expect(reference.fen()).toBe(game.fen());
          const moves = game.legalUci().sort();
          expect(moves, `seed ${seed}, ply ${ply}`).toEqual(reference.legalMoves().split(' ').sort());
          const move = moves[Math.floor(random() * moves.length)]!;
          expect(reference.push(move)).toBe(true);
          game.move(move);
        }
      } finally {
        reference.delete();
      }
    }
  }, 15_000);
});
