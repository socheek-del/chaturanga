import { Game, type Seat } from '@chaturanga/fortress';
import { describe, expect, it } from 'vitest';
import { chooseMove } from './index';

function readyGame(): Game {
  const game = new Game();
  for (const move of [
    'B@a13', 'N@b13', 'R@c13', 'B@m13', 'N@n13', 'R@o13',
    'B@m1', 'N@n1', 'R@o1', 'B@a1', 'N@b1', 'R@c1',
  ]) game.move(move);
  return game;
}

describe('Fortress team bots', () => {
  it('returns a legal reserve placement from setup', () => {
    const game = new Game();
    const move = chooseMove(game.fen(), { maxNodes: 100, maxDepth: 1 });
    expect(move).not.toBeNull();
    expect(game.legalUci()).toContain(move);
  });

  it('can play a legal move from each of the four seats', () => {
    const game = readyGame();
    const seen = new Set<Seat>();
    for (let ply = 0; ply < 4; ply++) {
      const mover = game.turn;
      seen.add(mover);
      const move = chooseMove(game.fen(), { maxNodes: 120, maxDepth: 2 });
      expect(move, `seat ${mover}`).not.toBeNull();
      expect(game.legalUci()).toContain(move);
      game.move(move!);
    }
    expect(seen).toEqual(new Set(['r', 'b', 'w', 'k']));
  });

  it('keeps a legal fallback when its node budget is exhausted', () => {
    const game = readyGame();
    const move = chooseMove(game.fen(), { maxNodes: 1, maxDepth: 6 });
    expect(game.legalUci()).toContain(move);
  });

  it('returns null for a finished game', () => {
    const fields = new Game().fen().split(' ');
    fields[4] = 'draw';
    expect(chooseMove(fields.join(' '))).toBeNull();
  });
});
