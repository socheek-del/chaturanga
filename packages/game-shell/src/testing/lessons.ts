/**
 * Lesson conformance: a lesson is only as good as the positions and answers it claims. Every FEN must
 * parse, every move solution must be legal, every squares answer must be a real square (and must equal
 * the engine's legal destinations when the step says so), and every piece of text must exist in every
 * language the product declares.
 *
 * A product registers this beside its own checks; anything game-specific (Makruk's counting examples,
 * a coverage list) belongs in the product's own test.
 */
import { parseUci } from '@chaturanga/board-ui';
import { squareNameOf, squareOf, type FiniteVariantGame, type Variant } from '@chaturanga/rules-core';
import { describe, expect, it } from 'vitest';
import type { L10n, Lesson, LessonStep } from '../lessons';
import type { ProductConfig } from '../product';

/** Registers the lesson content tests for a product. */
export function describeLessons<L extends string, G extends FiniteVariantGame, Verify>(
  product: ProductConfig<L>,
  variant: Variant<G>,
  lessons: ReadonlyArray<Lesson<Verify>>,
): void {
  const filled = (text: L10n | undefined) => !text || product.locales.every((lang) => (text[lang] ?? '').trim().length > 0);

  describe(`${product.id} lessons`, () => {
    it('has lessons, with unique ids', () => {
      const ids = lessons.map((l) => l.id);
      expect(ids.length).toBeGreaterThan(0);
      expect(new Set(ids).size).toBe(ids.length);
    });

    for (const lesson of lessons) {
      describe(`lesson ${lesson.id}`, () => {
        it('has a title, a summary and XP in every language', () => {
          expect(filled(lesson.title), 'title').toBe(true);
          expect(filled(lesson.summary), 'summary').toBe(true);
          expect(lesson.xp).toBeGreaterThan(0);
          expect(lesson.route || lesson.steps.length > 0, 'a lesson needs steps or a route').toBeTruthy();
        });

        lesson.steps.forEach((step: LessonStep<Verify>, i) => {
          it(`step ${i + 1} (${step.kind}) is valid`, () => {
            expect(filled(step.text), 'prompt').toBe(true);
            if ('hint' in step) expect(filled(step.hint), 'hint').toBe(true);
            const fen = 'fen' in step ? step.fen : undefined;
            const game = fen ? variant.createGame(fen) : null;

            switch (step.kind) {
              case 'info':
                for (const sq of step.highlight ?? []) expect(squareOf(sq, variant.files), sq).not.toBeNull();
                break;
              case 'move': {
                const legal = game!.legalUci();
                expect(step.solutions.length, 'a move step needs a solution').toBeGreaterThan(0);
                const squares = (uci: string) => {
                  const parsed = parseUci(uci, variant.files);
                  if (parsed?.kind === 'drop') return `${parsed.type}@${parsed.to}`;
                  if (parsed?.kind === 'action') return parsed.uci;
                  return parsed && `${parsed.from}-${parsed.to}`;
                };
                const legalSquares = legal.map(squares);
                for (const s of step.solutions) expect(legalSquares, s).toContain(squares(s));
                expect(legal.length, 'there must be a wrong move to make').toBeGreaterThan(step.solutions.length);
                if (step.success) expect(filled(step.success), 'success').toBe(true);
                break;
              }
              case 'squares': {
                expect(step.answer.length, 'a squares step needs an answer').toBeGreaterThan(0);
                for (const sq of step.answer) expect(squareOf(sq, variant.files), sq).not.toBeNull();
                if (step.targetsOf) {
                  const from = squareOf(step.targetsOf, variant.files);
                  const moves = game!
                    .legalUci()
                    .map((uci) => parseUci(uci, variant.files))
                    .filter((m): m is Extract<NonNullable<typeof m>, { kind: 'move' }> => m?.kind === 'move');
                  const targets = moves.filter((m) => m.from === from && m.to !== from).map((m) => squareNameOf(m.to, variant.files));
                  expect([...step.answer].sort()).toEqual([...new Set(targets)].sort());
                }
                break;
              }
              case 'quiz':
                expect(step.choices.length, 'a quiz needs at least two choices').toBeGreaterThanOrEqual(2);
                expect(step.correct).toBeGreaterThanOrEqual(0);
                expect(step.correct).toBeLessThan(step.choices.length);
                for (const c of step.choices) expect(filled(c), 'choice').toBe(true);
                break;
            }
          });
        });
      });
    }
  });
}
