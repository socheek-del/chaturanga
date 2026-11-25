import { describe, expect, it } from 'vitest';
import { Game, congo } from '@chaturanga/congo';
import { describeLessons } from '@chaturanga/game-shell/testing';
import { PRODUCT } from '../../product.config';
import { ALL_LESSONS, UNITS } from './lessons';

describeLessons(PRODUCT, congo, ALL_LESSONS);

describe('Congo tutorial', () => {
  it('covers the selected game’s objective, all eight piece types, river rules, routes and endings', () => {
    expect(ALL_LESSONS.map(({ id }) => id)).toEqual([
      'welcome',
      'zebra-and-elephant',
      'giraffe-and-crocodile',
      'river-deadline',
      'monkey-route',
      'pawn-and-superpawn',
      'lion-capture',
      'game-endings',
    ]);
    expect(UNITS).toHaveLength(3);
    const copy = ALL_LESSONS.flatMap((lesson) => lesson.steps).map((step) => step.text.en).join(' ').toLowerCase();
    for (const piece of ['lion', 'zebra', 'elephant', 'giraffe', 'crocodile', 'monkey', 'pawn', 'superpawn'])
      expect(copy).toContain(piece);
  });

  it('uses one complete Monkey route to collect both intervening pieces', () => {
    const step = ALL_LESSONS.find(({ id }) => id === 'monkey-route')!.steps.find((item) => item.kind === 'move')!;
    if (step.kind !== 'move') throw new Error('expected a move lesson');
    const game = new Game(step.fen);
    const record = game.move(step.solutions[0]!);
    expect(record.captures).toHaveLength(2);
    expect(record.fenAfter).toContain('M');
  });

  it('makes the Lion’s special flight a decisive capture', () => {
    const step = ALL_LESSONS.find(({ id }) => id === 'lion-capture')!.steps.find((item) => item.kind === 'move')!;
    if (step.kind !== 'move') throw new Error('expected a move lesson');
    const game = new Game(step.fen);
    game.move(step.solutions[0]!);
    expect(game.status()).toEqual({ kind: 'goal-square', winner: 'w' });
  });
});
