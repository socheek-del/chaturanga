import { describe, expect, it } from 'vitest';
import { Game } from '@chaturanga/infinite-chess';
import { boundedLegalMoves, parseFen } from '@chaturanga/infinite-chess/core';
import { chooseMove } from './index';

describe('Infinite Chess bot', () => {
  it('returns a legal deterministic move from the official start', () => {
    const first = chooseMove(new Game().fen(), { level: 'club', seed: 9182 });
    const second = chooseMove(new Game().fen(), { level: 'club', seed: 9182 });
    expect(first).not.toBeNull();
    expect(second).toEqual(first);
    expect(boundedLegalMoves(parseFen(new Game().fen()), 6)).toContain(first!.uci);
  });

  it('finds remote captures and preserves exact coordinates', () => {
    const fen = 'K-9007199254740993,0|R-9007199254740993,1|n-9007199254740993,100|k9007199254740993,0 w - - 0 1';
    const choice = chooseMove(fen, { level: 'strong', seed: 7 });
    expect(choice?.uci).toBe('-9007199254740993,1>-9007199254740993,100');
    expect(boundedLegalMoves(parseFen(fen), 12)).toContain(choice!.uci);
  });

  it('prefers promotion to a queen when it is safe', () => {
    const fen = 'K0,0|P0,7|k10,10 w - - 0 1';
    expect(chooseMove(fen, { level: 'strong', seed: 3 })?.uci).toBe('0,7>0,8q');
  });

  it('returns null for a terminal position', () => {
    const fen = 'K0,0|r1,2|r2,1|r-1,2|r-2,1|r1,-2|r2,-1|r-1,-2|r-2,-1|k20,20 w - - 0 1';
    expect(chooseMove(fen, { seed: 1 })).toBeNull();
  });
});
