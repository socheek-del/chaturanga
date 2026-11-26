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

  it.each(['repetition', 'counting', 'fifty-move', 'insufficient-material', 'goal-square', 'restricted-mate'] as const)('%s is a plain draw', (kind) => {
    expect(resultFromStatus({ kind } as GameStatus)).toEqual({ winner: null, reason: kind });
  });

  it('reports elimination with the winning side', () => {
    expect(resultFromStatus({ kind: 'elimination', winner: 'w' })).toEqual({ winner: 'w', reason: 'elimination' });
  });

  it('reports a completed formation or progression with the winning side', () => {
    expect(resultFromStatus({ kind: 'progression', winner: 'b' })).toEqual({ winner: 'b', reason: 'progression' });
  });

  it('preserves multi-seat winners and standings from point-scored endings', () => {
    const status: GameStatus<string> = {
      kind: 'points', reason: 'elimination', winners: ['r', 'y'], winner: null,
      scores: { r: 42, b: 21, y: 42, g: 9 },
    };
    expect(resultFromStatus(status)).toEqual({
      winner: null, reason: 'elimination', winners: ['r', 'y'],
      scores: { r: 42, b: 21, y: 42, g: 9 },
    });
  });

  it('maps a rules-engine resignation to the shared result reason', () => {
    const status: GameStatus<string> = { kind: 'points', reason: 'resignation', winners: ['r'], winner: 'r', scores: { r: 5, b: 0, y: 0, g: 0 } };
    expect(resultFromStatus(status))
      .toEqual({ winner: null, reason: 'resign', winners: ['r'], scores: { r: 5, b: 0, y: 0, g: 0 } });
  });

  it('preserves the conventional winner when a point-settled two-seat result carries standings', () => {
    const status: GameStatus<'w' | 'b'> = {
      kind: 'points', reason: 'elimination', winners: ['w'], winner: 'w', scores: { w: 70, b: 68.5 },
    };
    expect(resultFromStatus(status)).toEqual({
      winner: 'w', reason: 'elimination', winners: ['w'], scores: { w: 70, b: 68.5 },
    });
  });

  it('keeps the four-seat Blue winner out of the two-seat black winner field', () => {
    const status: GameStatus<string> = {
      kind: 'points', reason: 'elimination', winners: ['b'], winner: 'b',
      scores: { r: 4, b: 28, y: 7, g: 1 },
    };
    expect(resultFromStatus(status)).toEqual({
      winner: null, reason: 'elimination', winners: ['b'],
      scores: { r: 4, b: 28, y: 7, g: 1 },
    });
  });
});

it.each(['repetition', 'fifty-move', 'bikjang', 'double-pass'] as const)('%s names the winner when points decide it, as in Janggi', (kind) => {
  expect(resultFromStatus({ kind, winner: 'b' })).toEqual({ winner: 'b', reason: kind });
});

describe('isUndoableResult', () => {
  it('allows takeback with no result yet', () => {
    expect(isUndoableResult(null)).toBe(true);
  });

  it.each(['checkmate', 'stalemate', 'repetition', 'counting', 'fifty-move', 'insufficient-material', 'perpetual-check', 'perpetual-chase', 'progression'] as const)(
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
      'restricted-mate',
      'stalemate',
      'repetition',
      'counting',
      'fifty-move',
      'insufficient-material',
      'bare-king',
      'goal-square',
      'progression',
      'elimination',
      'perpetual-check',
      'perpetual-chase',
      'bikjang',
      'double-pass',
    ]);
  });
});
