import { describe, expect, it } from 'vitest';
import { FenError } from '@chaturanga/rules-core';
import { Game, IllegalMoveError } from './game';
import { START_FEN } from './fen';

describe('Crazyhouse rules', () => {
  it('starts with orthodox chess and empty bracket pockets', () => {
    const game = new Game();
    expect(game.fen()).toBe(START_FEN);
    expect(game.legalUci()).toHaveLength(20);
    expect(game.hand('w')).toEqual([]);
    expect(game.hand('b')).toEqual([]);
  });

  it('captures into the capturer pocket and allows a piece drop', () => {
    const game = new Game();
    for (const move of ['e2e4', 'd7d5']) game.move(move);
    const capture = game.move('e4d5');
    expect(capture.san).toBe('exd5');
    expect(capture.captured).toMatchObject({ color: 'b', type: 'p', promoted: false });
    expect(game.hand('w')).toEqual(['p']);
    game.move('d8d7');
    expect(game.legalUci()).toContain('P@e2');
    const drop = game.move('P@e2');
    expect(drop.san).toBe('P@e2');
    expect(game.pieceAt(12)).toMatchObject({ color: 'w', type: 'p', promoted: false });
    expect(game.hand('w')).toEqual([]);
  });

  it('lets a dropped pawn double-step from its own second rank and be captured en passant', () => {
    const game = new Game('4k3/8/8/8/3p4/8/8/4K3[P] w - - 0 1');
    game.move('P@e2');
    game.move('e8d8');
    game.move('e2e4');
    expect(game.fen()).toContain(' b - e3 ');
    expect(game.legalUci()).toContain('d4e3');
    const capture = game.move('d4e3');
    expect(capture.captured).toMatchObject({ color: 'w', type: 'p' });
    expect(game.hand('b')).toEqual(['p']);
  });

  it('allows same-file pawn drops but forbids drops on the first and eighth ranks', () => {
    const game = new Game('4k3/8/8/8/8/8/P7/4K3[P] w - - 0 1');
    expect(game.legalUci()).toContain('P@a3');
    expect(game.legalUci()).not.toContain('P@a1');
    expect(game.legalUci()).not.toContain('P@a8');
    expect(() => game.move('P@a1')).toThrow(IllegalMoveError);
  });

  it('uses a drop to block a sliding check', () => {
    const game = new Game('k3r3/8/8/8/8/8/8/4K3[B] w - - 0 1');
    expect(game.inCheck()).toBe(true);
    expect(game.legalUci()).toContain('B@e4');
    expect(game.legalUci()).not.toContain('B@a2');
  });

  it('allows pawn-drop mate', () => {
    const game = new Game('5N1k/8/4BK2/8/8/8/8/8[P] w - - 0 1');
    expect(game.legalUci()).toContain('P@g7');
    expect(game.move('P@g7').san).toBe('P@g7#');
    expect(game.status()).toEqual({ kind: 'checkmate', winner: 'w' });
  });

  it('marks promoted pieces and returns them as pawns when captured', () => {
    const game = new Game('4k3/8/8/3q~4/3R4/8/8/4K3[] w - - 0 1');
    expect(game.pieceAt(35)).toMatchObject({ type: 'q', promoted: true });
    const capture = game.move('d4d5');
    expect(capture.captured).toMatchObject({ color: 'b', type: 'q', promoted: true });
    expect(game.hand('w')).toEqual(['p']);
    expect(game.fen()).toContain('[P]');
  });

  it('tracks promotion provenance through FEN and undo', () => {
    const game = new Game('4k3/P7/8/8/8/8/8/4K3[] w - - 0 1');
    game.move('a7a8q');
    expect(game.pieceAt(56)).toMatchObject({ color: 'w', type: 'q', promoted: true });
    expect(game.fen()).toContain('Q~');
    const fen = game.fen();
    expect(new Game(fen).fen()).toBe(fen);
    game.undo();
    expect(game.fen()).toBe('4k3/P7/8/8/8/8/8/4K3[] w - - 0 1');
  });

  it('round-trips pocket order and rejects malformed promoted markers', () => {
    const fen = '4k3/8/8/8/8/8/8/4K3[QRBNPqrbnp] w - - 0 1';
    expect(new Game(fen).fen()).toBe(fen);
    expect(() => new Game('4k3/8/8/8/8/8/8/3K~4[] w - - 0 1')).toThrow(FenError);
  });

  it('does not adjudicate insufficient material, and uses the 50-move rule', () => {
    expect(new Game('4k3/8/8/8/8/8/8/4K3[] w - - 0 1').status()).toEqual({ kind: 'ongoing' });
    expect(new Game('4k3/8/8/8/8/8/8/3NK3[] w - - 0 1').status()).toEqual({ kind: 'ongoing' });
    expect(new Game('4k3/8/8/8/8/8/8/4K3[N] w - - 0 1').status()).toEqual({ kind: 'ongoing' });
    expect(new Game('4k3/8/8/8/8/8/8/4K3[] w - - 100 1').status()).toEqual({ kind: 'fifty-move' });
  });
});
