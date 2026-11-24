import { describeVariantConformance, loadFfish, mulberry32 } from '@chaturanga/rules-core/testing';
import { describe, expect, it } from 'vitest';
import { Game, maharajah, parseSquare } from './index';

const mate = 'k7/8/8/8/8/4M3/8/8 w - - 0 1';
const lastRank = '4k3/8/8/8/7M/8/p7/8 b - - 0 1';

describeVariantConformance(maharajah, {
  fens: [mate, lastRank],
  invalidFens: ['', 'k7/8/8/8/8/8/8/4K3 w - - 0 1', 'k7/8/8/8/8/8/8/4m3 w - - 0 1'],
  illegalMoves: ['e1d8', 'e1e7', 'd1d3'],
  checkmate: { fen: mate, move: 'e3b6', winner: 'w' },
});

describe('Maharajah and the Sepoys', () => {
  it('lets the Maharajah slide through attacks and leap over blockers', () => {
    const game = new Game('k7/8/8/8/r7/8/5p2/4M3 w - - 0 1');
    expect(game.legalUci()).toContain('e1e5');
    expect(game.legalUci()).toContain('e1f3');
    expect(game.legalUci()).not.toContain('e1e4');
    expect(game.legalUci()).not.toContain('e1h4');
  });

  it('leaves a pawn immobile on the last rank', () => {
    const game = new Game(lastRank);
    expect(game.legalUci()).toContain('a2a1');
    game.move('a2a1');
    expect(game.pieceAt(parseSquare('a1'))).toEqual({ type: 'p', color: 'b', promoted: false });
    expect(game.attackedSquares('b')).not.toContain(parseSquare('b1'));
  });

  it('can checkmate the Maharajah with supported pieces', () => {
    const game = new Game('r6r/8/8/8/8/2k5/1q5r/M6r w - - 0 1');
    expect(game.status()).toEqual({ kind: 'checkmate', winner: 'b' });
  });

  it('allows a pawn to advance twice from its start only through an empty square', () => {
    const game = new Game();
    game.move('e1e5');
    expect(game.legalUci()).toContain('d7d5');
    expect(game.legalUci()).not.toContain('e7e5');
  });

  it('matches an independent Fairy-Stockfish configuration during seeded games', async () => {
    const ffish = await loadFfish() as Awaited<ReturnType<typeof loadFfish>> & { loadVariantConfig(config: string): void };
    ffish.loadVariantConfig(`
[sepoys-reference:chess]
customPiece1 = m:QN
startFen = ${maharajah.startFen}
castling = false
promotionPieceTypes = -
promotionRegionBlack = -
extinctionValue = loss
extinctionPieceTypes = m
extinctionPseudoRoyal = true
`);
    for (let seed = 1; seed <= 6; seed++) {
      const game = new Game();
      const reference = new ffish.Board('sepoys-reference');
      const random = mulberry32(seed);
      try {
        for (let ply = 0; ply < 100 && !game.isGameOver(); ply++) {
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
