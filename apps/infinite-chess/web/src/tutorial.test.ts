import { describe, expect, it } from 'vitest';
import { LESSONS, acceptsTutorialMove, validateLessons } from './features/learn/lessons';
import { Game } from '@chaturanga/infinite-chess';

describe('interactive Infinite Chess tutorial', () => {
  it('has a legal interactive practice for every selected special rule and ending', () => {
    expect(() => validateLessons()).not.toThrow();
    expect(LESSONS.map(({ id }) => id)).toEqual(['coordinates', 'promotion', 'check', 'mate', 'stalemate', 'castling', 'en-passant', 'repetition', 'fifty-move', 'insufficient-material']);
  });

  it('teaches the listed one-move checkmate', () => {
    const lesson = LESSONS.find(({ id }) => id === 'mate')!;
    const game = new Game(lesson.fen);
    game.move('1,7>7,7');
    expect(game.status()).toEqual({ kind: 'checkmate', winner: 'w' });
    expect(acceptsTutorialMove(lesson.rule, '1,7>7,7', game)).toBe(true);
  });

  it('teaches castling and the en-passant capture with the engine moves', () => {
    const castling = LESSONS.find(({ id }) => id === 'castling')!;
    const castleGame = new Game(castling.fen);
    expect(castleGame.move('5,1>7,1').san).toBe('O-O');

    const enPassant = LESSONS.find(({ id }) => id === 'en-passant')!;
    const epGame = new Game(enPassant.fen);
    const move = epGame.move('1,5>2,6');
    expect(move.captured).toMatchObject({ color: 'b', type: 'p' });
    expect(epGame.pieceAt('2,5')).toBeNull();
  });

  it('reaches the threefold occurrence through the guided sequence', () => {
    const lesson = LESSONS.find(({ id }) => id === 'repetition')!;
    const game = new Game(lesson.fen);
    if (lesson.rule.kind !== 'sequence') throw new Error('Expected sequence lesson');
    lesson.rule.ucis.forEach((uci, index) => {
      expect(acceptsTutorialMove(lesson.rule, uci, game, index)).toBe(true);
      game.move(uci);
    });
    expect(game.status()).toEqual({ kind: 'repetition' });
  });
});
