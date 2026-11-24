import { squareOf } from '@chaturanga/rules-core';
import { describeVariantConformance, mulberry32 } from '@chaturanga/rules-core/testing';
import { describe, expect, it } from 'vitest';
import { acedrex, FILES, Game, RANKS } from './index';

const square = (name: string) => squareOf(name, FILES)!;
function fen(pieces: Record<string, string>, turn = 'w', leaps = '-'): string {
  const ranks = Array.from({ length: RANKS }, () => Array<string>(FILES).fill('.'));
  for (const [name, piece] of Object.entries(pieces)) {
    const index = square(name);
    ranks[RANKS - 1 - Math.floor(index / FILES)]![index % FILES] = piece;
  }
  const board = ranks.map((row) => row.join('').replace(/\.+/g, (empty) => String(empty.length))).join('/');
  return `${board} ${turn} ${leaps} - 0 1`;
}

const mate = fen({ l12: 'k', k11: 'p', l11: 'p', d1: 'R', a1: 'K' });
const promotion = fen({ l12: 'k', h10: 'p', f11: 'P', g11: 'P', a1: 'K' });

describeVariantConformance(acedrex, {
  fens: [mate, promotion],
  invalidFens: ['', promotion.replace(' w -', ' w K'), promotion.replace('/12/', '/13/')],
  illegalMoves: ['a4a6', 'a4a13', 'g1g4', 'g1g3q'],
  checkmate: { fen: mate, move: 'd1d12', winner: 'w' },
});

describe('Grande Acedrex', () => {
  it('starts with 24 pieces per side on ranks 1, 4, 9 and 12', () => {
    const game = new Game();
    expect(game.pieces()).toHaveLength(48);
    expect(game.pieceAt(square('g12'))?.type).toBe('k');
    expect(game.pieceAt(square('l12'))?.type).toBe('r');
    expect(game.pieceAt(square('e4'))?.type).toBe('p');
    expect(game.pieceAt(square('e9'))?.type).toBe('p');
    expect(game.legalUci()).toContain('e4e5');
    expect(game.legalUci()).not.toContain('e4e6');
  });

  it('clears the first king leap right and restores it on undo', () => {
    const start = fen({ l12: 'k', h10: 'p', g2: 'P', g1: 'K' }, 'w', 'K');
    const game = new Game(start);
    expect(game.legalUci()).toContain('g1g3');
    game.move('g1g3');
    expect(game.fen().split(' ')[2]).toBe('-');
    game.move('h10h9');
    expect(game.legalUci()).not.toContain('g3g1');
    game.undo();
    game.undo();
    expect(game.fen()).toBe(start);
  });

  it('lets the Aanca turn outward after an open diagonal step, stopping at a blocker', () => {
    const game = new Game(fen({ l12: 'k', h10: 'p', d4: 'A', e7: 'P', a1: 'K' }));
    expect(game.legalUci()).toEqual(expect.arrayContaining(['d4e5', 'd4h5', 'd4e6']));
    expect(game.legalUci()).not.toContain('d4e7');
    expect(game.legalUci()).not.toContain('d4e8');
    expect(game.legalUci()).not.toContain('d4d5');
    const blocked = new Game(fen({ l12: 'k', h10: 'p', d4: 'A', e5: 'p', a1: 'K' }));
    expect(blocked.legalUci()).toContain('d4e5');
    expect(blocked.legalUci()).not.toContain('d4h5');
  });

  it('lets the Unicornio jump like a knight before sliding outward diagonally', () => {
    const game = new Game(fen({ l12: 'k', h10: 'p', d4: 'U', e5: 'P', a1: 'K' }));
    expect(game.legalUci()).toEqual(expect.arrayContaining(['d4f5', 'd4g6', 'd4h7']));
    expect(game.legalUci()).not.toContain('d4f6');
    expect(game.legalUci()).not.toContain('d4g4');
  });

  it('distinguishes the lion’s straight and camel jumps from the giraffe’s zebra jump', () => {
    const lion = new Game(fen({ l12: 'k', h10: 'p', d4: 'L', a1: 'K' }));
    const giraffe = new Game(fen({ l12: 'k', h10: 'p', d4: 'G', a1: 'K' }));
    expect(lion.legalUci()).toEqual(expect.arrayContaining(['d4g4', 'd4g5', 'd4a3']));
    expect(lion.legalUci()).not.toContain('d4g6');
    expect(giraffe.legalUci()).toEqual(expect.arrayContaining(['d4g6', 'd4f7', 'd4a2']));
    expect(giraffe.legalUci()).not.toContain('d4g5');
  });

  it('promotes to the destination file’s piece, including Aanca on the king’s file', () => {
    const game = new Game(promotion);
    expect(game.legalUci()).toEqual(expect.arrayContaining(['f11f12a', 'g11g12a']));
    game.move('g11g12a');
    expect(game.pieceAt(square('g12'))?.type).toBe('a');
    const capture = new Game(fen({ l12: 'k', c12: 'r', d11: 'P', a1: 'K' }));
    expect(capture.move('d11c12u').san).toBe('dxc12=U');
    expect(capture.pieceAt(square('c12'))?.type).toBe('u');
  });

  it('ends when a side is stalemated or loses its final non-king piece', () => {
    const stalemate = new Game(fen({ l12: 'k', l11: 'p', l10: 'P', k9: 'R', a1: 'K' }, 'b'));
    expect(stalemate.status()).toEqual({ kind: 'stalemate', winner: 'w' });
    const bare = new Game(fen({ l12: 'k', c3: 'p', c1: 'R', a1: 'K' }));
    bare.move('c1c3');
    expect(bare.status()).toEqual({ kind: 'bare-king', winner: 'w' });
  });

  it('replays and unwinds six seeded games with multi-digit ranks', () => {
    for (let seed = 1; seed <= 6; seed++) {
      const game = new Game();
      const random = mulberry32(seed);
      const history = [];
      for (let ply = 0; ply < 55 && !game.isGameOver(); ply++) {
        const moves = game.legalUci();
        history.push(game.move(moves[Math.floor(random() * moves.length)]!));
        const restored = new Game(game.fen());
        expect(restored.pieces()).toEqual(game.pieces().map(({ square, piece }) => ({
          square, piece: { ...piece, promoted: false },
        })));
      }
      const replay = new Game();
      for (const move of history) expect(replay.move(move.uci).fenAfter).toBe(move.fenAfter);
      for (const move of history.reverse()) expect(game.undo()?.uci).toBe(move.uci);
      expect(game.fen()).toBe(acedrex.startFen);
    }
  });
});
