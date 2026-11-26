import { describeLessons } from '@chaturanga/game-shell/testing';
import { Game, senterej } from '@chaturanga/senterej';
import { describe, expect, it } from 'vitest';
import { PRODUCT } from '../product.config';
import { LESSONS } from './features/learn/lessons';

describeLessons(PRODUCT, senterej, LESSONS);

describe('Senterej tutorial', () => {
  it('covers every piece and every selected phase and ending rule', () => {
    const copy = LESSONS.flatMap((lesson) => lesson.steps)
      .map((step) => 'text' in step ? step.text.en : '')
      .join(' ');
    const lessonFor: Record<string, string> = {
      k: 'negus-and-ferz', q: 'negus-and-ferz', b: 'saba-and-feres', n: 'saba-and-feres', r: 'der-and-medeq', p: 'der-and-medeq',
    };
    for (const type of senterej.pieceTypes) {
      expect(LESSONS.some((lesson) => lesson.id === lessonFor[type])).toBe(true);
    }
    expect(copy).toContain('Werera');
    expect(copy).toContain('check');
    expect(copy).toContain('seven');
    expect(copy).toContain('repetition');
  });

  it('teaches the first-capture transition and a real checkmate', () => {
    const capture = LESSONS.find((lesson) => lesson.id === 'first-capture')!;
    const captureStep = capture.steps.find((step) => step.kind === 'move');
    if (captureStep?.kind !== 'move') throw new Error('capture lesson missing move step');
    const game = new Game(captureStep.fen);
    game.move(captureStep.solutions[0]!);
    expect(game.phase).toBe('turn');
    expect(game.turn).toBe('b');

    const mate = LESSONS.find((lesson) => lesson.id === 'checkmate')!;
    const mateStep = mate.steps.find((step) => step.kind === 'move');
    if (mateStep?.kind !== 'move') throw new Error('mate lesson missing move step');
    const checkmate = new Game(mateStep.fen);
    checkmate.move(mateStep.solutions[0]!);
    expect(checkmate.status()).toEqual({ kind: 'checkmate', winner: 'w' });
  });
});
