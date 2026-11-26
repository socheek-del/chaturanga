import { Game } from '@chaturanga/fourchess';
import en from '../locales/en.json';
import { steps } from './tutorialSteps';
import { expect, it } from 'vitest';

it('has translated, answerable tutorial content for the crossboard rules', () => {
  expect(steps.length).toBeGreaterThanOrEqual(10);
  for (const step of steps) {
    expect(en.tutorial.steps[step.id]).toBeTruthy();
    if (step.kind === 'quiz') expect(step.choices).toContain(step.answer);
    if (step.kind === 'move') expect(new Game(step.fen).legalUci()).toContain(step.answer);
  }
  expect(en.tutorial.steps.special).toContain('En passant');
  expect(en.tutorial.steps.elimination.toLowerCase()).toContain('checkmate');
});
