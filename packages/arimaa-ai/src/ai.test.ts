import { describe, expect, it } from 'vitest';
import { Game } from '@chaturanga/arimaa';
import { BOTS, botById, chooseMove, chooseMoveById } from './index';
import { mulberry32 } from '@chaturanga/ai-core';

const opening = new Game('emhhddcc/rrrrrrrr/8/8/8/8/RRRRRRRR/EMHHDDCC w - - 0 1');

describe('Arimaa bots', () => {
  it('provides six ordered levels with a safe fallback', () => {
    expect(BOTS).toHaveLength(6);
    expect(BOTS.map(({ id }) => id)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(botById(-1)).toEqual(BOTS[0]);
  });

  it('chooses a legal setup placement without leaving the game changed', () => {
    const game = new Game();
    const before = game.fen();
    const result = chooseMoveById(game, 6, mulberry32(11));
    expect(result?.uci).toMatch(/^[EMHDCR]@[a-h][12]$/);
    expect(game.legalUci()).toContain(result?.uci);
    expect(game.fen()).toBe(before);
  });

  it('returns a deterministic legal full turn from the same position and seed', () => {
    const first = chooseMoveById(opening, 4, mulberry32(29));
    const second = chooseMoveById(new Game(opening.fen()), 4, mulberry32(29));
    expect(first).toEqual(second);
    expect(first?.uci).toMatch(/^(?:[a-h][1-8]){2,8}$/);
    expect(opening.legalUci()).toContain(first?.uci);
    expect(first?.candidatesEvaluated).toBeGreaterThan(0);
  });

  it('scores an immediate rabbit goal as a win and leaves no move after a finished game', () => {
    const game = new Game('8/6Rr/8/8/8/8/8/8 w - - 0 1');
    const result = chooseMove(game, BOTS[5]!, mulberry32(51));
    expect(result?.score).toBeGreaterThan(900_000);
    game.move(result!.uci);
    expect(chooseMoveById(game, 6, mulberry32(52))).toBeNull();
  });
});
