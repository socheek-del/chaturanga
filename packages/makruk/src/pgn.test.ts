import { PgnError, readPgn, writePgn } from '@chaturanga/rules-core';
import { describe, expect, it } from 'vitest';
import { makruk } from './variant';

describe('Makruk PGN through the shared reader and writer (plat-017, review-001)', () => {
  it('writes Makruk SAN, a promotion to Met included, and reads it back', () => {
    const fen = '4k3/8/8/4P3/8/8/8/R3K3 w - - 0 1';
    const game = makruk.createGame(fen);
    const promotion = game.legalUci().find((u) => u.startsWith('e5e6'))!;
    const moves = [promotion, 'e8d8', 'a1a8'];
    const pgn = writePgn(makruk, { tags: { Variant: 'makruk' }, startFen: fen, moves });
    expect(pgn).toContain('[Variant "makruk"]');
    expect(pgn).toContain(`[FEN "${fen}"]`);
    expect(pgn).toMatch(/1\. e6=M/);
    const back = readPgn(makruk, pgn);
    expect(back.moves).toEqual(moves);
    expect(back.startFen).toBe(fen);
  });

  it('reads a full game from the start position, with loose check marks', () => {
    const start = makruk.createGame();
    const moves: string[] = [];
    for (let i = 0; i < 12; i++) {
      const uci = start.legalUci().sort()[i % 3]!;
      start.move(uci);
      moves.push(uci);
    }
    const pgn = writePgn(makruk, { tags: { Variant: 'makruk' }, startFen: makruk.startFen, moves });
    expect(pgn).not.toContain('[FEN');
    expect(readPgn(makruk, pgn.replace(/\+/g, '')).moves).toEqual(moves);
  });

  it('keeps a counting position in the FEN tag', () => {
    const fen = '8/8/3k4/8/8/4K3/8/R7 w - 16 3 40';
    expect(makruk.createGame(fen).fen()).toBe(fen);
    const back = readPgn(makruk, writePgn(makruk, { tags: {}, startFen: fen, moves: ['a1a2'] }));
    expect(back.startFen).toBe(fen);
    expect(back.moves).toEqual(['a1a2']);
  });

  it('reports an illegal move', () => {
    expect(() => readPgn(makruk, '1. e5')).toThrow(PgnError);
  });
});
