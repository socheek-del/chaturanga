import { describe, expect, it } from 'vitest';
import { Game, START_FEN } from '@chaturanga/hiashatar';
import { chooseMove } from './index';

describe('Hiashatar bot', () => {
  it.each([['white', []], ['black', ['e2e5']]] as const)('chooses a legal move playing as %s', (_side, moves) => {
    const game = new Game(START_FEN);
    for (const move of moves) game.move(move);
    const reply = chooseMove(START_FEN, moves, { maxNodes: 1_500 });
    expect(game.legalUci()).toContain(reply);
  });

  it('returns null from a completed position', () => {
    const game = new Game('k9/1Q8/2K7/10/10/10/10/10/10/10 b - - 0 1');
    expect(game.status().kind).not.toBe('ongoing');
    expect(chooseMove(game.fen(), [])).toBeNull();
  });

  it('recognizes either triple-step en passant capture as tactical', () => {
    const fen = '9k/10/10/10/10/3pP5/3p6/10/10/K9 b - e3,e4 0 1';
    expect(['d4e3', 'd5e4']).toContain(chooseMove(fen, [], { maxNodes: 1_500 }));
  });
});
