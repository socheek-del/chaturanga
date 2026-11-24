import { Game, START_FEN } from '@chaturanga/chaturanga';
import { expect, it } from 'vitest';
import { chooseMove } from './index';

it('returns legal moves on both sides and a legal fallback under a tight budget', () => {
  const game = new Game();
  const line: string[] = [];
  for (let ply = 0; ply < 8; ply++) {
    const move = chooseMove(START_FEN, line, { maxNodes: ply === 0 ? 1 : 250 });
    expect(move).not.toBeNull();
    expect(game.legalUci()).toContain(move);
    game.move(move!);
    line.push(move!);
  }
});

it('takes the last opposing piece when it wins and stops in terminal positions', () => {
  const fen = '7k/8/8/8/8/3p4/8/K2R4 w - - 0 1';
  expect(chooseMove(fen, [], { maxNodes: 250 })).toBe('d1d3');
  expect(chooseMove(fen, ['d1d3'])).toBeNull();
});
