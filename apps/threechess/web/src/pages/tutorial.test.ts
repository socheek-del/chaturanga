import { Game } from '@chaturanga/threechess';
import { expect, it } from 'vitest';
import en from '../locales/en.json';
import { steps } from './tutorialSteps';

it('has translated prompts and engine-verified practice moves', () => {
  expect(new Set(steps.map(({ id }) => id)).size).toBe(steps.length);
  for (const step of steps) {
    expect(en.tutorial.steps[step.id as keyof typeof en.tutorial.steps]).toBeTruthy();
    if (step.kind === 'quiz') {
      expect(step.choices).toContain(step.answer);
      continue;
    }
    if (step.kind === 'info') continue;
    const game = new Game(step.fen);
    expect(game.legalUci()).toContain(step.answer);
    game.move(step.answer);
    if (step.outcome) expect(game.status()).toEqual({ kind: 'checkmate', winner: step.outcome });
  }
});
