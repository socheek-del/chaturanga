/**
 * One test per Shogi rule, from hand-built positions. Every fixture is parsed by `new Game(fen)` first,
 * so an illegal position (a king missing, or the side not to move already in check) fails loudly instead
 * of quietly changing what the test means.
 */
import { describe, expect, it } from 'vitest';
import { Game } from './game';

/** An otherwise empty board with both kings out of the way of anything placed on e5. */
const board = (
  rank9: string,
  rank5: string,
  extra: Partial<Record<number, string>> = {},
  side = 'w',
): string => {
  const rows = ['2k6', '9', '9', '9', '9', '9', '9', '9', '2K6'];
  rows[0] = rank9;
  rows[4] = rank5;
  for (const [index, row] of Object.entries(extra)) rows[Number(index)] = row!;
  return `${rows.join('/')}[] ${side} - - 0 1`;
};

const from = (fen: string, square: string): string[] =>
  new Game(fen)
    .legalUci()
    .filter((uci) => uci.startsWith(square) && !uci.includes('@'))
    .sort();

/** Destination squares of the moves from a square, without the promotion choice. */
const targets = (fen: string, square: string): string[] =>
  [...new Set(from(fen, square).map((uci) => uci.slice(2, 4)))].sort();

describe('piece movement (sg-001)', () => {
  it('a pawn steps one square forward', () => {
    expect(from(board('2k6', '4P4'), 'e5')).toEqual(['e5e6']);
  });

  it('a lance slides any distance forward and nothing else', () => {
    expect(targets(board('2k6', '4L4'), 'e5')).toEqual(['e6', 'e7', 'e8', 'e9']);
  });

  it('a knight jumps two forward and one across', () => {
    expect(targets(board('2k6', '4N4'), 'e5')).toEqual(['d7', 'f7']);
  });

  it('a silver steps forward or diagonally, never sideways or straight back', () => {
    expect(targets(board('2k6', '4S4'), 'e5')).toEqual(['d4', 'd6', 'e6', 'f4', 'f6']);
  });

  it('a gold steps everywhere but diagonally backwards', () => {
    expect(targets(board('2k6', '4G4'), 'e5')).toEqual(['d5', 'd6', 'e4', 'e6', 'f5', 'f6']);
  });

  it('a bishop slides on the diagonals', () => {
    expect(targets(board('2k6', '4B4'), 'e5')).toEqual(
      ['a1', 'a9', 'b2', 'b8', 'c3', 'c7', 'd4', 'd6', 'f4', 'f6', 'g3', 'g7', 'h2', 'h8', 'i1', 'i9'].sort(),
    );
  });

  it('a rook slides on the rank and the file', () => {
    expect(targets(board('2k6', '4R4'), 'e5')).toEqual(
      ['a5', 'b5', 'c5', 'd5', 'e1', 'e2', 'e3', 'e4', 'e6', 'e7', 'e8', 'e9', 'f5', 'g5', 'h5', 'i5'].sort(),
    );
  });

  it('a dragon is a rook plus one diagonal step, and never counts a square twice', () => {
    const moves = from(board('2k6', '4+R4'), 'e5');
    expect(new Set(moves).size).toBe(moves.length);
    expect(targets(board('2k6', '4+R4'), 'e5')).toContain('d6');
    expect(targets(board('2k6', '4+R4'), 'e5')).toContain('e9');
    expect(targets(board('2k6', '4+R4'), 'e5')).not.toContain('c7');
  });

  it('a horse is a bishop plus one orthogonal step, and never counts a square twice', () => {
    const moves = from(board('2k6', '4+B4'), 'e5');
    expect(new Set(moves).size).toBe(moves.length);
    expect(targets(board('2k6', '4+B4'), 'e5')).toContain('e6');
    expect(targets(board('2k6', '4+B4'), 'e5')).toContain('a9');
    expect(targets(board('2k6', '4+B4'), 'e5')).not.toContain('e7');
  });

  it('a promoted pawn moves as a gold', () => {
    expect(targets(board('2k6', '4+P4'), 'e5')).toEqual(['d5', 'd6', 'e4', 'e6', 'f5', 'f6']);
  });

  it('a king steps one square in any direction', () => {
    expect(targets(board('2k6', '9', { 8: '9', 4: '4K4' }), 'e5')).toEqual(
      ['d4', 'd5', 'd6', 'e4', 'e6', 'f4', 'f5', 'f6'].sort(),
    );
  });
});

describe('promotion (sg-001)', () => {
  it('offers the choice for a move that ends in the promotion zone', () => {
    expect(from(board('2k6', '9', { 3: '4S4' }), 'e6').filter((m) => m.startsWith('e6e7'))).toEqual([
      'e6e7',
      'e6e7+',
    ]);
  });

  it('offers the choice for a move that leaves the promotion zone', () => {
    expect(from(board('2k6', '9', { 2: '4S4' }), 'e7').filter((m) => m.startsWith('e7d6'))).toEqual([
      'e7d6',
      'e7d6+',
    ]);
  });

  it('forces a pawn reaching the last rank to promote', () => {
    expect(from(board('2k6', '9', { 1: '4P4' }), 'e8')).toEqual(['e8e9+']);
  });

  it('forces a knight reaching either of the last two ranks to promote', () => {
    expect(from(board('2k6', '9', { 2: '4N4' }), 'e7')).toEqual(['e7d9+', 'e7f9+']);
  });

  it('never promotes a gold or a king', () => {
    expect(from(board('2k6', '9', { 3: '4G4' }), 'e6').every((m) => !m.endsWith('+'))).toBe(true);
  });
});

describe('drops (sg-001)', () => {
  const drops = (fen: string, letter: string): string[] =>
    new Game(fen)
      .legalUci()
      .filter((uci) => uci.startsWith(`${letter}@`))
      .sort();

  it('places a piece from hand on any empty square', () => {
    const fen = '2k6/9/9/9/9/9/9/9/2K6[S] w - - 0 1';
    expect(drops(fen, 'S')).toHaveLength(81 - 2);
  });

  it('refuses a second unpromoted pawn on a file (nifu)', () => {
    const fen = '2k6/9/9/9/4P4/9/9/9/2K6[P] w - - 0 1';
    expect(drops(fen, 'P').some((uci) => uci.startsWith('P@e'))).toBe(false);
    expect(drops(fen, 'P').some((uci) => uci.startsWith('P@d'))).toBe(true);
  });

  it('allows a pawn on a file where the only own pawn is promoted', () => {
    const fen = '2k6/9/9/9/4+P4/9/9/9/2K6[P] w - - 0 1';
    expect(drops(fen, 'P').some((uci) => uci.startsWith('P@e'))).toBe(true);
  });

  it('refuses a drop that could never move again', () => {
    const fen = '2k6/9/9/9/9/9/9/9/2K6[PLN] w - - 0 1';
    expect(drops(fen, 'P').some((uci) => uci.endsWith('9'))).toBe(false);
    expect(drops(fen, 'L').some((uci) => uci.endsWith('9'))).toBe(false);
    expect(drops(fen, 'N').some((uci) => uci.endsWith('9') || uci.endsWith('8'))).toBe(false);
  });

  it('refuses a pawn drop that delivers checkmate (uchifuzume), and reports it', () => {
    const fen = '1l1r1s1+P1/1gsPk3P/ln7/2pg2P1L/pp1gPp3/P1n1nP3/nLPKp2P1/4rg1+b1/BS2+p1+pS1[Pp] b - - 0 119';
    const game = new Game(fen);
    expect(game.legalUci()).not.toContain('P@d4');
    expect(game.uchifuzumeUci()).toContain('P@d4');
    expect(() => game.move('P@d4')).toThrow();
  });

  it('allows another piece to be dropped for mate', () => {
    const fen = '8b/lrssgkg1P/1pnp2psN/p1N1P2pl/1b1P1SP1L/P8/1PP4P1/2G3+p2/LNg1K4[ppppr] b - - 1 54';
    const game = new Game(fen);
    expect(game.legalUci()).toContain('R@d1');
    expect(game.move('R@d1').san).toBe('R@d1#');
    expect(game.status()).toEqual({ kind: 'checkmate', winner: 'b' });
  });
});

describe('legality (sg-001)', () => {
  it('a pinned piece may not step off the pinning line', () => {
    const fen = '2k6/9/9/9/9/9/2G6/9/2K4r1[] w - - 0 1';
    const game = new Game(fen);
    expect(game.legalUci().filter((uci) => uci.startsWith('c3'))).toEqual([]);
  });

  it('only check evasions are legal while in check', () => {
    const fen = '2k6/9/9/9/9/9/9/9/2K4r1[] w - - 0 1';
    const game = new Game(fen);
    expect(game.inCheck()).toBe(true);
    expect(game.legalUci().every((uci) => uci.startsWith('c1'))).toBe(true);
  });
});
