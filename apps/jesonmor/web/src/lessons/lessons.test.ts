import { describe, expect, it } from 'vitest';
import { Game, jesonMor } from '@chaturanga/jesonmor';
import { describeLessons } from '@chaturanga/game-shell/testing';
import { PRODUCT } from '../../product.config';
import { ALL_LESSONS, UNITS } from './lessons';

describeLessons(PRODUCT, jesonMor, ALL_LESSONS);

describe('Jeson Mor tutorial', () => {
  it('covers the board, knight movement, both wins, the vulnerable center and digital endings', () => {
    expect(ALL_LESSONS.map(({ id }) => id)).toEqual([
      'welcome',
      'knight-leap',
      'reach-e5',
      'capture-center',
      'escape-center',
      'capture-all',
      'draw-and-no-moves',
    ]);
    expect(UNITS).toHaveLength(3);
    const copy = ALL_LESSONS.flatMap((lesson) => lesson.steps).map((step) => step.text.en).join(' ').toLowerCase();
    for (const rule of ['nine-by-nine', 'knight', 'e5', 'reply', 'same horse', 'three times', 'no legal move', '50-move'])
      expect(copy).toContain(rule);
  });

  it('keeps the center claimant capturable during the opponent reply', () => {
    const step = ALL_LESSONS.find(({ id }) => id === 'capture-center')!.steps.find((item) => item.kind === 'move')!;
    if (step.kind !== 'move') throw new Error('expected a move exercise');
    const game = new Game(step.fen);
    const record = game.move(step.solutions[0]!);
    expect(record.captured).not.toBeNull();
    expect(game.status().kind).not.toBe('center-escape');
  });

  it('completes the center escape with the same horse, after the reply', () => {
    const step = ALL_LESSONS.find(({ id }) => id === 'escape-center')!.steps.find((item) => item.kind === 'move')!;
    if (step.kind !== 'move') throw new Error('expected a move exercise');
    const game = new Game(step.fen);
    game.move(step.solutions[0]!);
    expect(game.status()).toEqual({ kind: 'goal-square', winner: 'w' });
  });

  it('wins by capturing the final opposing horse', () => {
    const step = ALL_LESSONS.find(({ id }) => id === 'capture-all')!.steps.find((item) => item.kind === 'move')!;
    if (step.kind !== 'move') throw new Error('expected a move exercise');
    const game = new Game(step.fen);
    game.move(step.solutions[0]!);
    expect(game.status()).toEqual({ kind: 'elimination', winner: 'w' });
  });

  it('uses positions accepted by the engine for every board lesson', () => {
    for (const lesson of ALL_LESSONS) {
      for (const step of lesson.steps) {
        if (step.kind === 'info' || step.kind === 'move') new Game(step.fen ?? jesonMor.startFen);
      }
    }
  });
});
