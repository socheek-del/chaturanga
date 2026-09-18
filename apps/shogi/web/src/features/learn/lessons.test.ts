import { describeLessons } from '@chaturanga/game-shell/testing';
import { Game, shogi } from '@chaturanga/shogi';
import { describe, expect, it } from 'vitest';
import { PRODUCT } from '../../../product.config';
import { ALL_LESSONS, UNITS } from './lessons';
import type { L10n } from './types';

/** Positions parse, move solutions are legal, squares answers match the engine, and ja + en are filled. */
describeLessons(PRODUCT, shogi, ALL_LESSONS);

const filled = (text: L10n) => PRODUCT.locales.every((lang) => (text[lang] ?? '').trim().length > 0);

describe('Shogi lesson content (sg-006)', () => {
  it('every unit has both languages, and every quiz choice too', () => {
    for (const unit of UNITS) expect(filled(unit.title), unit.id).toBe(true);
    for (const step of ALL_LESSONS.flatMap((l) => l.steps)) {
      if (step.kind === 'quiz') for (const choice of step.choices) expect(filled(choice)).toBe(true);
      if (step.kind === 'move' && step.success) expect(filled(step.success)).toBe(true);
    }
  });

  it('covers the board, every piece, the rules that make Shogi its own game, and finishing', () => {
    expect(UNITS.map((u) => u.id)).toEqual(['board', 'pieces', 'rules', 'mates']);
    expect(ALL_LESSONS.map((l) => l.id)).toEqual([
      'board',
      'king',
      'gold',
      'silver',
      'knight',
      'lance',
      'pawn',
      'rook',
      'bishop',
      'promotion',
      'drops',
      'nifu',
      'checkmate',
      'sennichite',
      'mates',
    ]);
  });

  it('every piece type has its own lesson', () => {
    const icons = new Set(ALL_LESSONS.map((l) => l.icon));
    for (const type of shogi.pieceTypes) expect(icons.has(type), type).toBe(true);
  });

  it('every question carries a hint, and every piece lesson shows the moves before it asks for them', () => {
    for (const lesson of ALL_LESSONS) {
      lesson.steps.forEach((step, index) => {
        if (step.kind !== 'info') expect(filled(step.hint ?? { en: '' }), `${lesson.id} step ${index + 1}`).toBe(true);
        // A question is never the first thing a lesson says.
        if (step.kind === 'squares') expect(index, `${lesson.id} step ${index + 1}`).toBeGreaterThan(0);
      });
    }
  });

  it('every squares step names the piece whose moves it asks for, so the engine checks the answer', () => {
    const squares = ALL_LESSONS.flatMap((l) => l.steps).filter((s) => s.kind === 'squares' && l10nIsAboutMoves(s.text));
    for (const step of squares) if (step.kind === 'squares') expect(step.targetsOf, step.text.en).toBeTruthy();
  });

  it('every mate solution really checkmates', () => {
    for (const id of ['checkmate', 'mates']) {
      for (const step of ALL_LESSONS.find((l) => l.id === id)!.steps) {
        if (step.kind !== 'move') continue;
        for (const solution of step.solutions) {
          const game = new Game(step.fen);
          game.move(solution);
          expect(game.status(), `${step.fen} ${solution}`).toEqual({ kind: 'checkmate', winner: 'w' });
        }
      }
    }
  });

  it('every ending a lesson claims is what the engine decides', () => {
    const claims = ALL_LESSONS.flatMap((l) => l.steps).filter((s) => s.verify);
    expect(claims.length).toBeGreaterThanOrEqual(4);
    for (const step of claims) {
      const example = step.verify!;
      expect('fen' in step ? step.fen : undefined, 'the board shown is the example position').toBe(example.fen);
      const game = new Game(example.fen);
      for (const uci of example.moves) {
        expect(game.status().kind, `${example.kind}: game over before ${uci}`).toBe('ongoing');
        game.move(uci);
      }
      expect(game.status()).toEqual(example.winner ? { kind: example.kind, winner: example.winner } : { kind: example.kind });
    }
  });
});

function l10nIsAboutMoves(text: L10n): boolean {
  return /reach|go|move to/i.test(text.en ?? '');
}
