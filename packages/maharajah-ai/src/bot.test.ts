import { Game, START_FEN } from '@chaturanga/maharajah';
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

it('finds a Maharajah checkmate and stops in terminal positions', () => {
  const fen = 'k7/8/8/8/8/4M3/8/8 w - - 0 1';
  expect(chooseMove(fen, [], { maxNodes: 250 })).toBe('e3b6');
  expect(chooseMove(fen, ['e3b6'])).toBeNull();
});
