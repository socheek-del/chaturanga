import { resultFromStatus, squareOf } from '@chaturanga/rules-core';
import { describeVariantConformance, mulberry32 } from '@chaturanga/rules-core/testing';
import { describe, expect, it } from 'vitest';
import { FILES, Game, RANKS, isPlayable, tamerlane } from './index';

const square = (name: string) => squareOf(name, FILES)!;
function fen(pieces: Record<string, string>, turn = 'w', rights = '-'): string {
  const ranks = Array.from({ length: RANKS }, () => Array<string>(FILES).fill('.'));
  for (const [name, piece] of Object.entries(pieces)) {
    const index = square(name);
    ranks[RANKS - 1 - Math.floor(index / FILES)]![index % FILES] = piece;
  }
  const rows = ranks.map((row) => row.join('').replace(/\.+/g, (empty) => String(empty.length)));
  return `${rows.join('/')} ${turn} ${rights} - 0 1`;
}

const mate = fen({ l10: 'k', k9: 'q', l9: 'u', d1: 'R', b1: 'K' });
const draw = fen({ l10: 'k', b9: 'K' });
const swap = fen({ l10: 'k', g9: 'r', g2: 'K', b1: 'R' }, 'w', 'K');

describeVariantConformance(tamerlane, {
  fens: [mate, draw, swap],
  invalidFens: ['', fen({ a10: 'k', b1: 'K' }), fen({ l10: 'k', b1: 'K', m2: 'R' })],
  illegalMoves: ['b3b5', 'b3a3', 'g2m2', 'k2k4q'],
  checkmate: { fen: mate, move: 'd1d10', winner: 'w' },
});

describe('Tamerlane Chess', () => {
  it('starts with the common rotational array and 112 playable squares', () => {
    const game = new Game();
    expect(game.pieces()).toHaveLength(56);
    expect(Array.from({ length: FILES * RANKS }, (_, index) => index).filter(isPlayable)).toHaveLength(112);
    expect(game.pieceAt(square('b3'))?.type).toBe('p');
    expect(game.pieceAt(square('g3'))?.type).toBe('s');
    expect(game.pieceAt(square('l8'))?.type).toBe('p');
    expect(game.legalUci()).toContain('b3b4');
    expect(game.legalUci()).not.toContain('b3b5');
  });

  it('sends pickets at least two squares diagonally and giraffes at least three beyond the bend', () => {
    const picket = new Game(fen({ l10: 'k', b1: 'K', d4: 'B' }));
    expect(picket.legalUci()).toContain('d4f6');
    expect(picket.legalUci()).not.toContain('d4e5');
    const stalled = new Game(fen({ l10: 'k', b1: 'K', d4: 'B', e5: 'Q' }));
    expect(stalled.legalUci()).not.toContain('d4f6');
    const giraffe = new Game(fen({ l10: 'k', b1: 'K', d4: 'G' }));
    expect(giraffe.legalUci()).toEqual(expect.arrayContaining(['d4h5', 'd4e8']));
    expect(giraffe.legalUci()).not.toContain('d4g5');
  });

  it.each([['a', 'd'], ['m', 'c'], ['i', 'e'], ['j', 'f'], ['s', 'h'], ['w', 'v'],
    ['l', 'g'], ['o', 'b'], ['u', 'n'], ['q', 'r']] as const)('promotes a typed pawn %s to %s', (pawn, promoted) => {
    const game = new Game(fen({ l10: 'k', b1: 'K', e9: pawn.toUpperCase() }));
    game.move(`e9e10${promoted}`);
    expect(game.pieceAt(square('e10'))).toEqual({ color: 'w', type: promoted, promoted: true });
  });

  it('keeps a sleeping pawn immune and forces a qualifying redeployment', () => {
    const immune = new Game(fen({ l10: 'k', b9: 'r', b10: 'P', c1: 'K' }, 'b'));
    expect(immune.legalUci()).not.toContain('b9b10');

    const game = new Game(fen({ l10: 'k', e8: 'n', g8: 'r', b10: 'P', f7: 'Q', c1: 'K' }));
    expect(game.legalUci().every((move) => move.startsWith('b10'))).toBe(true);
    game.move('b10f7');
    expect(game.pieceAt(square('f7'))?.type).toBe('x');
    expect(game.pieceAt(square('b10'))).toBeNull();
  });

  it('restages the pawn after its second arrival and makes a new royal after its third', () => {
    const second = new Game(fen({ l10: 'k', b1: 'K', f9: 'X' }));
    second.move('f9f10y');
    expect(second.pieceAt(square('f10'))).toBeNull();
    expect(second.pieceAt(square('g3'))?.type).toBe('y');
    const blocked = new Game(fen({ l10: 'k', f9: 'X', g3: 'K' }));
    blocked.move('f9f10y');
    expect(blocked.pieceAt(square('f3'))?.type).toBe('y');
    const third = new Game(fen({ l10: 'k', b1: 'K', g9: 'Y' }));
    third.move('g9g10t');
    expect(third.pieceAt(square('g10'))?.type).toBe('t');
  });

  it('allows capture of one of several royals and protects the last', () => {
    const position = fen({ l10: 'k', e8: 'h', e1: 'R', b1: 'K' });
    const game = new Game(position);
    game.move('e1e8');
    expect(game.pieceAt(square('e8'))?.type).toBe('r');
    const lone = new Game(fen({ e8: 'h', e1: 'R', b1: 'K' }));
    expect(lone.legalUci()).not.toContain('e1e8');
  });

  it('goes to a safe square when the checked shah spends its exchange', () => {
    const game = new Game(swap);
    expect(game.inCheck()).toBe(true);
    game.move('g2b1');
    expect(game.pieceAt(square('b1'))?.type).toBe('k');
    expect(game.pieceAt(square('g2'))?.type).toBe('r');
    expect(game.fen().split(' ')[2]).toBe('-');
    game.undo();
    expect(game.fen()).toBe(swap);
  });

  it('draws in an enemy citadel, or exchanges the shah and prince to continue', () => {
    const game = new Game(draw);
    game.move('b9a9');
    expect(resultFromStatus(game.status())).toEqual({ winner: null, reason: 'goal-square' });
    expect(new Game(game.fen()).status()).toEqual(game.status());
    expect(game.legalUci()).toEqual([]);
    game.undo();
    expect(game.fen()).toBe(draw);

    const exchange = new Game(fen({ l10: 'k', b9: 'K', f3: 'H' }, 'w', 'Q'));
    exchange.move('f3a9');
    expect(exchange.pieceAt(square('a9'))?.type).toBe('h');
    expect(exchange.pieceAt(square('f3'))?.type).toBe('k');
    expect(exchange.status().kind).toBe('ongoing');
  });

  it('allows only the promoted adventitious king in its own citadel', () => {
    const game = new Game(fen({ b10: 'k', b1: 'K', l2: 'T', l1: 'R' }));
    expect(game.legalUci()).toContain('l2m2');
    expect(game.legalUci()).not.toContain('l1m2');
    game.move('l2m2');
    expect(game.pieceAt(square('m2'))?.type).toBe('t');
  });

  it('allows a bare king to play and awards stalemate to the other side', () => {
    expect(new Game(draw).status().kind).toBe('ongoing');
    const stalemate = new Game(fen({ l10: 'k', k8: 'R', b9: 'R', l7: 'K' }, 'b'));
    expect(stalemate.status()).toEqual({ kind: 'stalemate', winner: 'w' });
  });

  it('replays and undoes four seeded games', () => {
    for (let seed = 1; seed <= 4; seed++) {
      const game = new Game();
      const random = mulberry32(seed);
      for (let ply = 0; ply < 60 && !game.isGameOver(); ply++) {
        const moves = game.legalUci();
        game.move(moves[Math.floor(random() * moves.length)]!);
      }
      const replay = new Game();
      for (const record of game.moves()) expect(replay.move(record.uci).fenAfter).toBe(record.fenAfter);
      while (game.undo()) { /* undo to the initial array */ }
      expect(game.fen()).toBe(tamerlane.startFen);
    }
  });
});
