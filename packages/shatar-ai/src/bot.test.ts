import { Game, START_FEN } from '@chaturanga/shatar';
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

it('finds a cart checkmate and stops in terminal positions', () => {
  const fen = '6k1/5ppp/8/8/8/8/8/3R2K1 w - - 0 1';
  expect(chooseMove(fen, [], { maxNodes: 250 })).toBe('d1d8');
  expect(chooseMove(fen, ['d1d8'])).toBeNull();
});

it('avoids a losing mate delivered by the horse alone', () => {
  const fen = 'k7/n1K5/8/3N4/8/8/8/8 w - - 0 1';
  expect(chooseMove(fen, [], { maxNodes: 500 })).not.toBe('d5b6');
});
