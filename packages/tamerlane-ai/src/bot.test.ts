import { Game, START_FEN } from '@chaturanga/tamerlane';
import { expect, it } from 'vitest';
import { chooseMove } from './index';

it('returns legal moves on both sides and a legal fallback under a tight budget', () => {
  const game = new Game();
  const line: string[] = [];
  for (let ply = 0; ply < 4; ply++) {
    const move = chooseMove(START_FEN, line, { maxNodes: ply === 0 ? 1 : 80 });
    expect(move).not.toBeNull();
    expect(game.legalUci()).toContain(move);
    game.move(move!);
    line.push(move!);
  }
});

it('finds a rook checkmate and stops in terminal positions', () => {
  const fen = '11k1/10qu1/13/13/13/13/13/13/13/1K1R9 w - - 0 1';
  expect(chooseMove(fen, [], { maxNodes: 250 })).toBe('d1d10');
  expect(chooseMove(fen, ['d1d10'])).toBeNull();
});
