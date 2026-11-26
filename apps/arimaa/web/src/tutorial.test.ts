import { describe, expect, it } from 'vitest';
import en from './locales/en.json';
import { LESSONS, lessonStartingGame } from './tutorial';

describe('Arimaa tutorial positions', () => {
  it('constructs every lesson from a valid game state', () => {
    expect(LESSONS).toHaveLength(15);
    for (const lesson of LESSONS) expect(() => lessonStartingGame(lesson), lesson.id).not.toThrow();
  });

  it('has title, summary, and task copy for every interactive lesson', () => {
    for (const lesson of LESSONS) {
      expect(en.lessons[lesson.id as keyof typeof en.lessons], lesson.id).toMatchObject({ title: expect.any(String), summary: expect.any(String), task: expect.any(String) });
    }
  });

  it('accepts every marked move through the rules engine', () => {
    for (const lesson of LESSONS.filter((item) => item.kind === 'move')) {
      const game = lessonStartingGame(lesson);
      expect(lesson.solutions, lesson.id).toBeDefined();
      for (const solution of lesson.solutions ?? []) {
        expect(() => game.move(solution), `${lesson.id}: ${solution}`).not.toThrow();
      }
    }
  });

  it('uses a genuinely frozen Rabbit in the support lesson', () => {
    const lesson = LESSONS.find((item) => item.id === 'freeze');
    if (!lesson) throw new Error('Missing freeze lesson');
    const game = lessonStartingGame(lesson);
    expect(game.legalUci()).toContain('b2c2');
    expect(game.legalUci()).not.toContain('d2d3');
  });

  it('teaches the selected terminal results and forced repetition rule', () => {
    const elimination = lessonStartingGame(LESSONS.find((item) => item.id === 'elimination')!);
    expect(elimination.status()).toMatchObject({ kind: 'elimination', winner: 'w' });

    const immobilization = lessonStartingGame(LESSONS.find((item) => item.id === 'immobilization')!);
    expect(immobilization.status()).toMatchObject({ kind: 'stalemate', winner: 'b' });

    const priority = lessonStartingGame(LESSONS.find((item) => item.id === 'priority')!);
    expect(priority.status()).toMatchObject({ winner: 'b' });

    const repetition = lessonStartingGame(LESSONS.find((item) => item.id === 'repetition')!);
    expect(() => repetition.move('f5f4')).toThrow();

    const noPass = lessonStartingGame(LESSONS.find((item) => item.id === 'noPass')!);
    expect(() => noPass.move('c4c5c5c4')).toThrow();
  });
});
