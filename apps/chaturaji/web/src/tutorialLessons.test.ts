import { describe, expect, it } from 'vitest';
import { Game } from '@chaturanga/chaturaji';
import { TUTORIAL_LESSONS } from './tutorialLessons';
import en from './locales/en.json';

describe('Chaturaji tutorial path', () => {
  it('covers every selected rule and includes a rules-engine-backed board move', () => {
    const topics = new Set(TUTORIAL_LESSONS.map((lesson) => lesson.topic));
    for (const topic of ['seats', 'turn-order', 'dice', 'movement', 'pawns', 'check', 'scoring', 'promotion', 'boat-triumph', 'throne', 'ending']) {
      expect(topics.has(topic), `missing ${topic}`).toBe(true);
    }
    expect(TUTORIAL_LESSONS.some((lesson) => lesson.kind === 'board')).toBe(true);
    expect(en.family.title).toBeTruthy();
    const game = new Game();
    expect(game.legalUci().some((move) => move !== 'pass')).toBe(true);
  });

  it('keeps every quiz answer inside its four-option choice set', () => {
    for (const lesson of TUTORIAL_LESSONS) {
      if (lesson.kind === 'quiz') {
        expect(lesson.answer).toBeGreaterThanOrEqual(0);
        expect(lesson.answer).toBeLessThan(4);
        const text = en.tutorial.lessons[lesson.id as keyof typeof en.tutorial.lessons];
        expect(text.title).toBeTruthy();
        expect(text.body).toBeTruthy();
        expect(text.options).toHaveLength(4);
        expect(text.options[lesson.answer]).toBeTruthy();
      } else {
        const text = en.tutorial.lessons[lesson.id as keyof typeof en.tutorial.lessons];
        expect(text.title).toBeTruthy();
        expect(text.body).toBeTruthy();
      }
    }
  });
});
