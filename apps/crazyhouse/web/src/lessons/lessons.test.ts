import { describe, expect, it } from 'vitest';
import { Game, crazyhouse } from '@chaturanga/crazyhouse';
import { describeLessons } from '@chaturanga/game-shell/testing';
import { PRODUCT } from '../../product.config';
import { ALL_LESSONS, UNITS } from './lessons';

describeLessons(PRODUCT, crazyhouse, ALL_LESSONS);

describe('Crazyhouse tutorial', () => {
  it('covers ordinary chess movement, pockets, every Crazyhouse rule, and game endings', () => {
    expect(ALL_LESSONS.map(({ id }) => id)).toEqual([
      'welcome',
      'piece-moves',
      'capture',
      'drop',
      'pawn-ranks',
      'same-file',
      'drop-check',
      'pawn-mate',
      'check-and-mate',
      'promotion-capture',
      'promotion-choice',
      'castling',
      'en-passant',
      'draws',
    ]);
    expect(UNITS).toHaveLength(3);
  });

  it('every promised checkmate puzzle ends in checkmate after its solution drop', () => {
    for (const step of ALL_LESSONS.flatMap((lesson) => lesson.steps)) {
      if (step.kind !== 'move' || !step.success?.en?.includes('checkmate')) continue;
      for (const move of step.solutions) {
        const game = new Game(step.fen);
        game.move(move);
        expect(game.status(), `${step.fen}: ${move}`).toEqual({ kind: 'checkmate', winner: 'w' });
      }
    }
  });
});
