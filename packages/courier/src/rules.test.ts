import { squareOf } from '@chaturanga/rules-core';
import { describeVariantConformance, loadFfish, mulberry32 } from '@chaturanga/rules-core/testing';
import { describe, expect, it } from 'vitest';
import { courier, FILES, Game } from './index';

const square = (name: string) => squareOf(name, FILES)!;
const mate = '10k1/9ppp/12/12/12/12/12/3R4K3 w - - 0 1';
const promotion = '11k/4P7/12/12/12/12/12/K11 w - - 0 1';

describeVariantConformance(courier, {
  fens: [mate, promotion],
  invalidFens: ['', '11k/12/12/12/12/12/12/12 w - - 0 1', '11k/13/12/12/12/12/12/K11 w - - 0 1'],
  illegalMoves: ['a4a6', 'g3g5', 'l4m4', 'a1a9'],
  checkmate: { fen: mate, move: 'd1d8', winner: 'w' },
});

describe('medieval Courier Chess', () => {
  it('starts after the joyleaps with 24 pieces per side', () => {
    const game = new Game();
    expect(game.pieces()).toHaveLength(48);
    expect(game.pieceAt(square('f1'))?.type).toBe('k');
    expect(game.pieceAt(square('f8'))?.type).toBe('k');
    expect(game.pieceAt(square('g3'))?.type).toBe('f');
    expect(game.pieceAt(square('l5'))?.type).toBe('p');
    expect(game.legalUci()).toContain('j2j3');
    expect(game.legalUci()).not.toContain('j2j4');
  });

  it('distinguishes the jumping alfil from the sliding courier', () => {
    const game = new Game('11k/12/12/12/12/12/1PPP8/K1AC8 w - - 0 1');
    expect(game.legalUci()).toContain('c1a3');
    expect(game.legalUci()).toContain('c1e3');
    expect(game.legalUci()).not.toContain('c1b2');
    expect(game.legalUci()).toContain('d1e2');
    expect(game.legalUci()).not.toContain('d1b3');
  });

  it('promotes immediately to a ferz and can undo it', () => {
    const game = new Game(promotion);
    expect(game.legalUci()).toContain('e7e8f');
    expect(game.legalUci()).not.toContain('e7e8');
    game.move('e7e8f');
    expect(game.pieceAt(square('e8'))?.type).toBe('f');
    game.undo();
    expect(game.fen()).toBe(promotion);
  });

  it('agrees with a twelve-file Fairy-Stockfish reference', async () => {
    const ffish = await loadFfish() as Awaited<ReturnType<typeof loadFfish>> & { loadVariantConfig(config: string): void };
    ffish.loadVariantConfig(`
[courier-reference:chess]
maxFile = 12
maxRank = 8
bishop = c
queen = -
alfil = a
fers = f
commoner = m
wazir = s
castling = false
doubleStep = false
promotionPieceTypes = f
promotionRegionWhite = *8
promotionRegionBlack = *1
startFen = ${courier.startFen}
`);
    for (let seed = 1; seed <= 6; seed++) {
      const game = new Game();
      const reference = new ffish.Board('courier-reference');
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
