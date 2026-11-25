import { describeLessons } from '@chaturanga/game-shell/testing';
import { Game, dameo, square } from '@chaturanga/dameo';
import { describe, expect, it } from 'vitest';
import { PRODUCT } from '../../product.config';
import { ALL_LESSONS, RULE_LESSONS } from './lessons';

describeLessons(PRODUCT, dameo, ALL_LESSONS);

describe('Dameo tutorial rule coverage', () => {
  it('assigns every selected rule to a lesson', () => {
    for (const [topic, lessonId] of Object.entries(RULE_LESSONS)) {
      expect(ALL_LESSONS.some((lesson) => lesson.id === lessonId), topic).toBe(true);
    }
  });

  it('plays the line-promotion exercise and crowns only the leading man', () => {
    const lesson = ALL_LESSONS.find(({ id }) => id === 'the-moving-line')!;
    const step = lesson.steps.find((candidate) => candidate.kind === 'move' && candidate.solutions.includes('e6f7g8'))!;
    if (step.kind !== 'move') throw new Error('expected a move exercise');
    const game = new Game(step.fen);
    game.move('e6f7g8');
    expect(game.pieceAt(square('f7'))).toMatchObject({ color: 'w', type: 'm', promoted: false });
    expect(game.pieceAt(square('g8'))).toMatchObject({ color: 'w', type: 'k', promoted: true });
  });

  it('keeps a man unpromoted when its capture route crosses the far rank and ends elsewhere', () => {
    const lesson = ALL_LESSONS.find(({ id }) => id === 'when-a-man-becomes-king')!;
    const step = lesson.steps.find((candidate) => candidate.kind === 'move' && candidate.solutions.includes('e6e8g8g6'))!;
    if (step.kind !== 'move') throw new Error('expected a move exercise');
    const game = new Game(step.fen);
    game.move('e6e8g8g6');
    expect(game.pieceAt(square('g6'))).toMatchObject({ color: 'w', type: 'm', promoted: false });
  });

  it('shows a Coup Turc route revisiting its vacated starting square', () => {
    const lesson = ALL_LESSONS.find(({ id }) => id === 'coup-turc')!;
    const step = lesson.steps.find((candidate) => candidate.kind === 'move')!;
    if (step.kind !== 'move') throw new Error('expected a move exercise');
    const game = new Game(step.fen);
    const record = game.move('d4d7g7g4d4d1');
    expect(record.captures).toHaveLength(4);
    expect(game.pieceAt(square('d4'))).toBeNull();
    expect(game.pieceAt(square('d1'))).toMatchObject({ color: 'w', type: 'k' });
  });

  it('pairs a global maximum-capture quiz with only the longest legal route', () => {
    const lesson = ALL_LESSONS.find(({ id }) => id === 'the-longest-route')!;
    const step = lesson.steps.find((candidate) => candidate.kind === 'quiz' && candidate.fen)!;
    if (step.kind !== 'quiz' || !step.fen) throw new Error('expected a capture-choice quiz');
    const game = new Game(step.fen);
    expect(game.legalUci()).toContain('e4e6e8');
    expect(game.legalUci()).not.toContain('a1a3');
  });
});
