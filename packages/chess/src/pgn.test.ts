import { describe, expect, it } from 'vitest';
import { START_FEN } from './fen';
import { Game } from './game';
import { parsePgn, PgnError, toPgn } from './pgn';

const OPERA = ['e2e4', 'e7e5', 'g1f3', 'd7d6', 'd2d4', 'c8g4', 'd4e5', 'g4f3', 'd1f3', 'd6e5', 'f1c4', 'g8f6', 'f3b3', 'd8e7', 'b1c3', 'c7c6', 'c1g5', 'b7b5', 'c3b5', 'c6b5', 'c4b5', 'b8d7', 'e1c1', 'a8d8', 'd1d7', 'd8d7', 'h1d1', 'e7e6', 'b5d7', 'f6d7', 'b3b8', 'd7b8', 'd1d8'];

describe('toPgn', () => {
  it('writes the roster, the moves with numbers, and the result', () => {
    const pgn = toPgn({ tags: { White: 'Morphy', Black: 'Duke & Count', Result: '1-0' }, startFen: START_FEN, moves: OPERA });
    expect(pgn).toMatch(/^\[Event "\?"\]\n\[Site "\?"\]\n\[Date "\?"\]\n\[Round "\?"\]\n\[White "Morphy"\]\n\[Black "Duke & Count"\]\n\[Result "1-0"\]\n\n1\. e4 e5 2\. Nf3 d6/);
    expect(pgn).toContain('12. O-O-O Rd8');
    expect(pgn).toContain('17. Rd8# 1-0');
    expect(pgn.split('\n').every((line) => line.length <= 80)).toBe(true);
  });

  it('writes SetUp and FEN for another start, and numbers a black first move with dots', () => {
    const fen = 'r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3';
    const pgn = toPgn({ tags: {}, startFen: fen, moves: ['g8f6', 'e1g1'] });
    expect(pgn).toContain('[SetUp "1"]');
    expect(pgn).toContain(`[FEN "${fen}"]`);
    expect(pgn).toContain('3... Nf6 4. O-O *');
  });

  it('escapes quotes and backslashes in tag values', () => {
    const pgn = toPgn({ tags: { White: 'A "B" \\C' }, startFen: START_FEN, moves: [] });
    expect(pgn).toContain('[White "A \\"B\\" \\\\C"]');
    expect(parsePgn(pgn).tags.White).toBe('A "B" \\C');
  });
});

describe('parsePgn', () => {
  it('reads back what toPgn writes', () => {
    const fen = 'r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1';
    const moves = ['c4c5', 'b2a1q', 'd1a1'];
    const game = { tags: { White: 'W', Black: 'B', Result: '*', Event: 'Test' }, startFen: fen, moves };
    const back = parsePgn(toPgn(game));
    expect(back.moves).toEqual(moves);
    expect(back.startFen).toBe(fen);
    expect(back.tags.White).toBe('W');
    expect(parsePgn(toPgn({ tags: {}, startFen: START_FEN, moves: OPERA })).moves).toEqual(OPERA);
  });

  it('skips comments, variations, NAGs, clock comments and escape lines', () => {
    const text = `%escaped line
[Event "Casual"]
[Result "1-0"]

1. e4 {[%clk 0:03:00]} e5 $1 2. Nf3 (2. f4 exf4 (2... d5) 3. Nf3) 2... d6!? ; a line comment
3.d4 Bg4?! 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7 8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5
11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8# 1-0`;
    const game = parsePgn(text);
    expect(game.tags.Event).toBe('Casual');
    expect(game.moves).toEqual(OPERA);
  });

  it('reads SAN loosely: 0-0, extra disambiguation, missing =, lowercase promotion, missing check marks', () => {
    expect(parsePgn('1. e4 e5 2. Ng1f3 Nb8c6 3. Bc4 Bc5 4. 0-0 Nf6').moves).toEqual(['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4', 'f8c5', 'e1g1', 'g8f6']);
    const fen = '8/P6k/8/8/8/8/8/K7 w - - 0 1';
    expect(parsePgn(`[FEN "${fen}"]\n\n1. a8Q`).moves).toEqual(['a7a8q']);
    expect(parsePgn(`[FEN "${fen}"]\n\n1. a8=n`).moves).toEqual(['a7a8n']);
    expect(parsePgn('1. f3 e5 2. g4 Qh4').moves.at(-1)).toBe('d8h4');
  });

  it('takes the result from the move text when there is no Result tag, and stops at the first game', () => {
    const game = parsePgn('1. e4 e5 0-1\n\n[Event "Second"]\n\n1. d4 *');
    expect(game.tags.Result).toBe('0-1');
    expect(game.moves).toEqual(['e2e4', 'e7e5']);
  });

  it('reports an illegal move with its ply', () => {
    try {
      parsePgn('1. e4 e5 2. Ke3');
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(PgnError);
      expect((err as PgnError).ply).toBe(3);
      expect((err as PgnError).san).toBe('Ke3');
    }
  });

  it('reads Windows line ends and a byte-order mark', () => {
    expect(parsePgn('\uFEFF[Event "x"]\r\n\r\n1. d4 d5\r\n').moves).toEqual(['d2d4', 'd7d5']);
  });

  it('rejects a bad FEN tag and text with no game', () => {
    expect(() => parsePgn('[FEN "nonsense"]\n\n1. e4')).toThrow(PgnError);
    expect(() => parsePgn('hello there')).toThrow(PgnError);
    expect(() => parsePgn('')).toThrow(PgnError);
  });

  it('rejects an ambiguous move', () => {
    const fen = '4k3/8/8/8/8/8/8/N3K2N w - - 0 1';
    expect(new Game(fen).legalUci()).toContain('a1b3');
    expect(() => parsePgn(`[FEN "4k3/8/8/8/8/8/8/1N2KN2 w - - 0 1"]\n\n1. Nd2`)).toThrow(PgnError);
  });
});
