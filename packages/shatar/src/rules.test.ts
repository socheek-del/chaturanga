import { describeVariantConformance, loadFfish, mulberry32 } from '@chaturanga/rules-core/testing';
import { describe, expect, it } from 'vitest';
import { Game, parseSquare, shatar } from './index';

const rookMate = '6k1/5ppp/8/8/8/8/8/3R2K1 w - - 0 1';
const knightMate = 'k7/n1K5/8/3N4/8/8/8/8 w - - 0 1';
const bishopMate = 'k7/p1K5/8/3B4/8/8/8/8 w - - 0 1';
const continuous = 'k1R5/8/p1K5/B7/8/8/8/8 b - - 0 1';

describeVariantConformance(shatar, {
  fens: [rookMate, knightMate, bishopMate, continuous],
  invalidFens: ['', '7k/8/8/8/8/8/8/8 w - - 0 1', '7k/8/8/8/8/8/8/K7 w K - 0 1'],
  illegalMoves: ['d2d4', 'e2e4', 'a2a4', 'e1g1'],
  checkmate: { fen: rookMate, move: 'd1d8', winner: 'w' },
});

describe('traditional Shatar', () => {
  it('starts after both compulsory d-pawn advances', () => {
    const game = new Game();
    expect(game.pieceAt(parseSquare('d4'))?.type).toBe('p');
    expect(game.pieceAt(parseSquare('d5'))?.type).toBe('p');
    expect(game.legalUci()).toContain('e2e3');
    expect(game.legalUci()).not.toContain('e2e4');
  });

  it('moves the bers like a rook or one square diagonally', () => {
    const game = new Game('7k/6p1/8/8/3J4/8/8/K7 w - - 0 1');
    expect(game.legalUci()).toEqual(expect.arrayContaining(['d4d8', 'd4h4', 'd4e5']));
    expect(game.legalUci()).not.toContain('d4f6');
  });

  it('promotes pawns directly to bers', () => {
    const game = new Game('7k/4P2p/8/8/8/8/8/K7 w - - 0 1');
    expect(game.legalUci()).toContain('e7e8j');
    game.move('e7e8j');
    expect(game.pieceAt(parseSquare('e8'))?.type).toBe('j');
  });

  it.each([
    [rookMate, ['d1d8'], 'checkmate', 'w', '1-0'],
    [knightMate, ['d5b6'], 'restricted-mate', 'b', '0-1'],
    [bishopMate, ['d5b7'], 'restricted-mate', null, '1/2-1/2'],
    [continuous, ['a8a7', 'a5b6'], 'checkmate', 'w', '1-0'],
  ] as const)('matches the reference result from %s', async (fen, line, kind, winner, result) => {
    const ffish = await loadFfish();
    const reference = new ffish.Board('shatar', fen);
    const game = new Game(fen);
    try {
      for (const move of line) {
        expect(reference.push(move)).toBe(true);
        game.move(move);
      }
      expect(reference.result()).toBe(result);
      expect(game.status()).toEqual(winner ? { kind, winner } : { kind });
      expect(game.legalUci()).toEqual([]);
    } finally {
      reference.delete();
    }
  });

  it('preserves an unbroken shak sequence across a save and restores it on undo', () => {
    const game = new Game(continuous);
    game.move('a8a7');
    const snapshot = game.fen();
    expect(snapshot.split(' ')[2]).toBe('S');
    const saved = new Game(snapshot);
    saved.move('a5b6');
    expect(saved.status()).toEqual({ kind: 'checkmate', winner: 'w' });
    game.move('a5b4');
    expect(game.fen().split(' ')[2]).toBe('-');
    game.undo();
    expect(game.fen()).toBe(snapshot);
  });

  it('draws immediately when a king is bared', () => {
    const game = new Game('7k/8/8/8/8/3p4/8/K2R4 w - - 0 1');
    game.move('d1d3');
    expect(game.status()).toEqual({ kind: 'bare-king' });
  });

  it('matches stock Fairy-Stockfish in seeded full-board positions', async () => {
    const ffish = await loadFfish();
    for (let seed = 1; seed <= 8; seed++) {
      const game = new Game();
      const reference = new ffish.Board('shatar');
      const random = mulberry32(seed);
      try {
        for (let ply = 0; ply < 110 && !game.isGameOver(); ply++) {
          const fields = game.fen().split(' ');
          fields[2] = '-';
          expect(fields.join(' ')).toBe(reference.fen());
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
