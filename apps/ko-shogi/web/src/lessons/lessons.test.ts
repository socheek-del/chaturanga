import { describe, expect, it } from 'vitest';
import { ALL_LESSONS, LESSON_UNITS, verifyLessonMoves } from './lessons';
import { ATLAS_FORMS, PIECE_ORDER, RULE_COVERAGE, STARTING_FORM_COUNT } from './pieceAtlas';
import en from '../locales/en.json';

function localeValue(key: string): unknown {
  return key.split('.').reduce<unknown>((value, part) => {
    if (!value || typeof value !== 'object') return undefined;
    return (value as Record<string, unknown>)[part];
  }, en);
}

describe('Ko Shogi learning field', () => {
  it('has an engine-legal answer for every complete-turn exercise', () => {
    expect(verifyLessonMoves).not.toThrow();
  });

  it('teaches every selected rule and digital convention', () => {
    const covered = new Set(ALL_LESSONS.flatMap((lesson) => [...lesson.coverage]));
    expect(ALL_LESSONS).toHaveLength(11);
    expect(LESSON_UNITS).toHaveLength(5);
    expect([...Object.values(RULE_COVERAGE)].filter((rule) => !covered.has(rule))).toEqual([]);
  });

  it('resolves each lesson title, prompt, choice, hint, summary and label through the locale', () => {
    const keys: string[] = [];
    for (const unit of LESSON_UNITS) {
      keys.push(unit.title.en ?? '');
      for (const lesson of unit.lessons) {
        keys.push(lesson.icon, lesson.title.en ?? '', lesson.summary.en ?? '');
        for (const step of lesson.steps) {
          keys.push(step.text.en ?? '');
          if (step.kind === 'quiz') keys.push(...step.choices.map((choice) => choice.en ?? ''));
          if ('hint' in step && step.hint) keys.push(step.hint.en ?? '');
          if ('success' in step && step.success) keys.push(step.success.en ?? '');
        }
      }
    }
    for (const key of keys) {
      const value = localeValue(key);
      expect(typeof value === 'string' && value.trim().length > 0, key).toBe(true);
    }
  });

  it('lists all 34 starting forms and 31 promotion assignments', () => {
    const starting = ATLAS_FORMS.filter((form) => !form.promoted);
    const promoted = ATLAS_FORMS.filter((form) => form.promoted);
    expect(starting).toHaveLength(STARTING_FORM_COUNT);
    expect(promoted).toHaveLength(31);
    expect(ATLAS_FORMS).toHaveLength(65);
    expect(new Set(ATLAS_FORMS.map(({ id }) => id)).size).toBe(ATLAS_FORMS.length);
    for (const type of PIECE_ORDER) {
      expect(localeValue(`pieces.${type}.name`)).toEqual(expect.any(String));
      expect(localeValue(`pieces.${type}.move`)).toEqual(expect.any(String));
    }
  });
});
