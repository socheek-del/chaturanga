import { Game, START_FEN } from '@chaturanga/senterej';
import { describe, expect, it } from 'vitest';
import { BOTS, chooseMove } from './index';

describe('Senterej bots', () => {
  it('returns a seeded legal move for both seats during Werera', () => {
    for (const color of ['w', 'b'] as const) {
      const move = chooseMove(START_FEN, color, { seed: 42, level: 3 });
      expect(move).not.toBeNull();
      expect(new Game().legalUciFor(color)).toContain(move!.uci);
      expect(chooseMove(START_FEN, color, { seed: 42, level: 3 })).toEqual(move);
    }
  });

  it('honors actor history, searches ordinary turns and chooses a winning capture', () => {
    const fen = '1n5k/8/8/8/8/3p4/8/K2R4 w - - 0 1 turn - -';
    const move = chooseMove(fen, 'w', { seed: 4, level: 4 });
    expect(move?.uci).toBe('d1d3');

    const game = new Game(START_FEN);
    game.moveFor('b', 'e7e6');
    const decision = chooseMove(START_FEN, 'w', {
      seed: 4,
      level: 2,
      history: [{ color: 'b', uci: 'e7e6' }],
    });
    expect(game.legalUciFor('w')).toContain(decision?.uci);
  });

  it('stops at terminal positions and keeps difficulty budgets bounded', () => {
    const terminal = '7k/8/8/8/8/8/8/K7 w - - 0 1 turn - -';
    expect(chooseMove(terminal, 'w', { seed: 1 })).toBeNull();
    expect(BOTS).toHaveLength(6);
    const move = chooseMove(START_FEN, 'w', { seed: 7, level: 6 });
    expect(move?.nodes).toBeLessThanOrEqual(BOTS[5].maxNodes);
  });
});
