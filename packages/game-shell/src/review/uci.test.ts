import { describe, expect, it } from 'vitest';
import { negate, parseBestMove, parseInfo } from './uci';

describe('UCI output (ch-015)', () => {
  it('reads depth, multipv, a centipawn score and the pv', () => {
    expect(parseInfo('info depth 16 seldepth 24 multipv 2 score cp 16 nodes 335440 nps 481954 hashfull 111 time 696 pv b1c3 b8c6 g1f3')).toEqual({
      depth: 16,
      multipv: 2,
      score: { cp: 16 },
      bound: null,
      pv: ['b1c3', 'b8c6', 'g1f3'],
    });
  });

  it('reads a mate score, a bound, and defaults multipv to 1', () => {
    expect(parseInfo('info depth 5 score mate -2 lowerbound pv h2h3 d8h4')).toMatchObject({ multipv: 1, score: { mate: -2 }, bound: 'lower' });
    expect(parseInfo('info depth 5 score cp 30 upperbound pv e2e4')?.bound).toBe('upper');
  });

  it('ignores info lines without a score or a pv, and other lines', () => {
    expect(parseInfo('info depth 12 currmove e2e4 currmovenumber 1')).toBeNull();
    expect(parseInfo('info string NNUE evaluation using nn-61e7af4bb97d.nnue')).toBeNull();
    expect(parseInfo('info depth 0 score mate 0')).toBeNull();
    expect(parseInfo('bestmove e2e4')).toBeNull();
  });

  it('reads bestmove, including a finished position', () => {
    expect(parseBestMove('bestmove g1f3 ponder b8c6')).toBe('g1f3');
    expect(parseBestMove('bestmove (none)')).toBeNull();
    expect(parseBestMove('info depth 1')).toBeUndefined();
  });

  it('turns a score around', () => {
    expect(negate({ cp: 40 })).toEqual({ cp: -40 });
    expect(negate({ mate: 3 })).toEqual({ mate: -3 });
  });
});
