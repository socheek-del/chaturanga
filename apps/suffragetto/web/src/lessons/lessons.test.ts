import { describe, expect, it } from 'vitest';
import { Game, HOSPITAL, HOSPITAL_GROUNDS, squareAt, suffragetto } from '@chaturanga/suffragetto';
import { describeLessons } from '@chaturanga/game-shell/testing';
import { PRODUCT } from '../../product.config';
import { ALL_LESSONS, UNITS } from './lessons';

describeLessons(PRODUCT, suffragetto, ALL_LESSONS);

describe('Suffragetto tutorial', () => {
  it('covers setup, movement, routes, captures, exchanges, goals, and digital endings', () => {
    const words = ALL_LESSONS.flatMap((lesson) => lesson.steps.flatMap((step) => [
      step.text.en,
      ...(step.kind === 'move' ? [step.hint?.en, step.success?.en] : []),
      ...(step.kind === 'quiz' ? step.choices.map((choice) => choice.en) : []),
    ])).filter(Boolean).join(' ').toLowerCase();
    for (const rule of ['17×17', 'coin toss', 'eight directions', 'chain hops', 'prison yard', 'captures only diagonally',
      'leader', 'hospital', '12 pieces', 'pairs of equal rank', 'six cells', 'third time', 'no legal move', '50-move'])
      expect(words).toContain(rule);
    expect(UNITS).toHaveLength(3);
    expect(ALL_LESSONS.length).toBeGreaterThanOrEqual(7);
  });

  it('transfers a captured Police piece into Hospital', () => {
    const lesson = ALL_LESSONS.find(({ id }) => id === 'small-rank-capture')!;
    const step = lesson.steps.find((candidate) => candidate.kind === 'move')!;
    if (step.kind !== 'move') throw new Error('expected a move lesson');
    const game = new Game(step.fen);
    game.move(step.solutions[0]!);
    const hospitalCell = HOSPITAL.find((square) => game.pieceAt(square)?.type === 'p');
    expect(hospitalCell).toBeDefined();
    expect(game.pieceAt(hospitalCell!)).toMatchObject({ color: 'b', type: 'p' });
  });

  it('serializes the exchange as a legal action and releases both ranks', () => {
    const lesson = ALL_LESSONS.find(({ id }) => id === 'exchange')!;
    const step = lesson.steps.find((candidate) => candidate.kind === 'move')!;
    if (step.kind !== 'move') throw new Error('expected a move lesson');
    const game = new Game(step.fen);
    expect(game.legalUci()).toContain('X11@b1');
    game.move('X11@b1');
    expect(game.pieceAt(squareAt('b', 1))).toMatchObject({ color: 'w', type: 'l' });
    expect(game.pieceAt(squareAt('b', 2))).toMatchObject({ color: 'w', type: 's' });
    expect(game.pieceAt(HOSPITAL_GROUNDS[0]!)).toMatchObject({ color: 'b', type: 'i' });
  });

  it('finishes the House goal immediately when the sixth cell is filled', () => {
    const lesson = ALL_LESSONS.find(({ id }) => id === 'six-in-the-building')!;
    const step = lesson.steps.find((candidate) => candidate.kind === 'move')!;
    if (step.kind !== 'move') throw new Error('expected a move lesson');
    const game = new Game(step.fen);
    game.move('g13h13');
    expect(game.status()).toEqual({ kind: 'goal-square', winner: 'w' });
  });
});
