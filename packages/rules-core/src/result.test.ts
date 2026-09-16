import { describe, expect, it } from 'vitest';
import { FINAL_REASONS, isUndoableResult, RESULT_REASONS, resultFromStatus } from './result';
import type { GameStatus } from './types';

describe('resultFromStatus', () => {
  it('is null while the game is ongoing', () => {
    expect(resultFromStatus({ kind: 'ongoing' })).toBeNull();
  });

  it('names the winner on checkmate', () => {
    expect(resultFromStatus({ kind: 'checkmate', winner: 'w' })).toEqual({ winner: 'w', reason: 'checkmate' });
  });

  it('is a draw when stalemate carries no winner, as Makruk and Sittuyin always produce', () => {
    expect(resultFromStatus({ kind: 'stalemate' })).toEqual({ winner: null, reason: 'stalemate' });
  });

  it('names the winner when stalemate is decisive, as a variant like Xiangqi can produce', () => {
    expect(resultFromStatus({ kind: 'stalemate', winner: 'b' })).toEqual({ winner: 'b', reason: 'stalemate' });
  });

  it('names the winner on perpetual check and perpetual chase', () => {
    expect(resultFromStatus({ kind: 'perpetual-check', winner: 'w' })).toEqual({ winner: 'w', reason: 'perpetual-check' });
    expect(resultFromStatus({ kind: 'perpetual-chase', winner: 'b' })).toEqual({ winner: 'b', reason: 'perpetual-chase' });
  });

  it.each(['repetition', 'counting', 'fifty-move', 'insufficient-material'] as const)('%s is a plain draw', (kind) => {
    expect(resultFromStatus({ kind } as GameStatus)).toEqual({ winner: null, reason: kind });
  });
});

describe('isUndoableResult', () => {
  it('allows takeback with no result yet', () => {
    expect(isUndoableResult(null)).toBe(true);
  });

  it.each(['checkmate', 'stalemate', 'repetition', 'counting', 'fifty-move', 'insufficient-material', 'perpetual-check', 'perpetual-chase'] as const)(
    'allows takeback after the position-based ending %s',
    (reason) => {
      expect(isUndoableResult({ winner: 'w', reason })).toBe(true);
    },
  );

  it.each(FINAL_REASONS)('forbids takeback after the decision/event ending %s', (reason) => {
    expect(isUndoableResult({ winner: 'w', reason })).toBe(false);
  });

  it('FINAL_REASONS is exactly the non-position-based subset of RESULT_REASONS', () => {
    const positionBased = RESULT_REASONS.filter((r) => !FINAL_REASONS.includes(r));
    expect(positionBased).toEqual([
      'checkmate',
      'stalemate',
      'repetition',
      'counting',
      'fifty-move',
      'insufficient-material',
      'perpetual-check',
      'perpetual-chase',
    ]);
  });
});
