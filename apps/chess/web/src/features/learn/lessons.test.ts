import { chess, Game } from '@chaturanga/chess';
import { describeLessons } from '@chaturanga/game-shell/testing';
import { describe, expect, it } from 'vitest';
import { PRODUCT } from '../../../product.config';
import { ALL_LESSONS, UNITS } from './lessons';
import type { L10n } from './types';

/** Positions parse, move solutions are legal, squares answers match the engine, and every language is filled. */
describeLessons(PRODUCT, chess, ALL_LESSONS);

const filled = (text: L10n) => PRODUCT.locales.every((lang) => (text[lang] ?? '').trim().length > 0);

describe('chess lesson content (ch-006)', () => {
  it('every unit has its title, and every quiz choice too', () => {
    for (const unit of UNITS) expect(filled(unit.title), unit.id).toBe(true);
    for (const step of ALL_LESSONS.flatMap((lesson) => lesson.steps)) {
      if (step.kind === 'quiz') for (const choice of step.choices) expect(filled(choice)).toBe(true);
      if (step.kind === 'move' && step.success) expect(filled(step.success)).toBe(true);
    }
  });

  it('covers the board, every piece, the special moves, how a game ends and how to play well', () => {
    expect(UNITS.map((unit) => unit.id)).toEqual(['board', 'pieces', 'special', 'ending', 'playing']);
    expect(ALL_LESSONS.map((lesson) => lesson.id)).toEqual([
      'board',
      'king',
      'queen',
      'rook',
      'bishop',
      'knight',
      'pawn',
      'castling',
      'enpassant',
      'promotion',
      'check',
      'stalemate',
      'draws',
      'tactics',
      'endings',
      'openings',
    ]);
  });

  it('every piece type has its own lesson', () => {
    const icons = new Set(ALL_LESSONS.map((lesson) => lesson.icon));
    for (const type of chess.pieceTypes) expect(icons.has(type), type).toBe(true);
  });

  it('every question carries a hint, and no lesson opens with one', () => {
    for (const lesson of ALL_LESSONS) {
      lesson.steps.forEach((step, index) => {
        if (step.kind !== 'info') expect(filled(step.hint ?? { en: '' }), `${lesson.id} step ${index + 1}`).toBe(true);
        if (step.kind === 'squares') expect(index, `${lesson.id} step ${index + 1}`).toBeGreaterThan(0);
      });
    }
  });

  it('every squares step that asks about moves names the piece, so the engine checks the answer', () => {
    for (const step of ALL_LESSONS.flatMap((lesson) => lesson.steps)) {
      if (step.kind === 'squares' && /can move to/.test(step.text.en ?? '')) expect(step.targetsOf, step.text.en).toBeTruthy();
    }
  });

  it('every mate a lesson promises really mates', () => {
    for (const id of ['check', 'endings']) {
      for (const step of ALL_LESSONS.find((lesson) => lesson.id === id)!.steps) {
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
    const claims = ALL_LESSONS.flatMap((lesson) => lesson.steps).filter((step) => step.verify);
    expect(claims.length).toBeGreaterThanOrEqual(6);
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

  it('the promotion lesson teaches under-promotion with a position where the queen only draws', () => {
    const step = ALL_LESSONS.find((lesson) => lesson.id === 'promotion')!.steps.at(-1)!;
    if (step.kind !== 'move') throw new Error('the last promotion step should ask for a move');
    const queened = new Game(step.fen);
    queened.move('c7c8q');
    expect(queened.status()).toEqual({ kind: 'stalemate' });
    const rook = new Game(step.fen);
    rook.move('c7c8r');
    expect(rook.status().kind).toBe('ongoing');
  });
});
