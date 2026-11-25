import { Game, START_FEN } from '@chaturanga/acedrex';
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
}, 10_000);

it('finds a rook checkmate and stops in terminal positions', () => {
  const fen = '11k/10pp/12/12/12/12/12/12/12/12/12/K2R8 w - - 0 1';
  expect(chooseMove(fen, [], { maxNodes: 250 })).toBe('d1d12');
  expect(chooseMove(fen, ['d1d12'])).toBeNull();
});
