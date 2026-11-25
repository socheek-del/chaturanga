import { Game } from '@chaturanga/fortress';
import { describe, expect, it } from 'vitest';
import { tutorialSteps } from './tutorialSteps';

describe('Fortress interactive tutorial', () => {
  it('offers legal move solutions and complete quiz answers in every step', () => {
    for (const step of tutorialSteps) {
      if (step.kind === 'move') expect(new Game(step.fen).legalUci(), step.id).toContain(step.answer);
      if (step.kind === 'quiz') expect(step.choices, step.id).toContain(step.answer);
    }
  });

  it('covers the setup, wall restrictions, special moves and both digital endings', () => {
    expect(tutorialSteps.map((step) => step.id)).toEqual([
      'welcome',
      'board',
      'teams',
      'reserve',
      'turns',
      'pieces',
      'walls',
      'enPassant',
      'castling',
      'promotion',
      'checkmate',
      'stalemate',
    ]);
  });
});
