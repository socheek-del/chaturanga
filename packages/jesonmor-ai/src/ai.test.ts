import { BLACK_TO_MOVE_FEN, Game, START_FEN } from '@chaturanga/jesonmor';
import { describe, expect, it } from 'vitest';
import { BOTS, bestMove, chooseMove, mulberry32 } from './index';

describe('six deterministic Jeson Mor bot levels', () => {
  it.each(BOTS.flatMap((bot) => [
    [`${bot.key} as White`, bot.id, START_FEN] as const,
    [`${bot.key} as Black`, bot.id, BLACK_TO_MOVE_FEN] as const,
  ]))('%s returns a legal move within a fixed node budget', (label, id, fen) => {
    const move = chooseMove(fen, id, { rng: () => 0.999, ignoreTime: true, maxDepth: 2, maxNodes: 1_200 });
    expect(move, label).not.toBeNull();
    expect(new Game(fen).legalUci()).toContain(move!.uci);
    expect(move!.nodes).toBeLessThanOrEqual(1_712);
  });

  it('takes the final opposing horse when it can win by capture-all', () => {
    const fen = '9/9/9/9/4n4/2N6/9/9/9 w - - 0 1 -';
    const move = bestMove(fen, { maxDepth: 1, maxNodes: 1_000, ignoreTime: true });
    expect(move?.uci).toBe('c4e5');
    const game = new Game(fen);
    game.move(move!.uci);
    expect(game.status()).toEqual({ kind: 'elimination', winner: 'w' });
  });

  it('finds a winning escape from e5 and restores the supplied game after search', () => {
    const fen = 'n8/9/9/9/4N4/9/9/9/9 w - - 0 1 w';
    const game = new Game(fen);
    const before = game.fen();
    const move = bestMove(fen, { game, maxDepth: 1, maxNodes: 1_000, ignoreTime: true });
    expect(move?.uci.startsWith('e5')).toBe(true);
    game.move(move!.uci);
    expect(game.status()).toEqual({ kind: 'goal-square', winner: 'w' });
    game.undo();
    expect(game.fen()).toBe(before);
  });

  it('chooses the same move for the same seed', () => {
    const first = chooseMove(START_FEN, 3, { rng: mulberry32(41), ignoreTime: true, maxNodes: 1_200 });
    const second = chooseMove(START_FEN, 3, { rng: mulberry32(41), ignoreTime: true, maxNodes: 1_200 });
    expect(first?.uci).toBe(second?.uci);
  });
});
