import { Game } from '@chaturanga/congo';
import { describe, expect, it } from 'vitest';
import { bestMove, BOTS, chooseMove, keyOfFen, mulberry32 } from './index';

const LION_CAPTURE_FEN = '2l4/7/7/7/7/7/2L4 w - 0 1';
const MONKEY_FEN = '6l/7/7/7/2p4/1M5/L6 w - 0 1';
const RIVER_FEN = '6l/7/7/2P!4/7/7/2L4 w - 0 1';

function shortClock(): () => number {
  let calls = 0;
  return () => calls++ === 0 ? 0 : 10_000;
}

describe('Congo bots', () => {
  it('exposes six bounded levels and makes a legal move for either side', () => {
    expect(BOTS).toHaveLength(6);
    for (const level of BOTS) {
      const fen = new Game().fen();
      const game = new Game(fen);
      const move = chooseMove(fen, level, { now: shortClock(), rng: mulberry32(level.id) });
      expect(move).not.toBeNull();
      expect(game.legalUci()).toContain(move!.uci);
      expect(move!.nodes).toBeLessThanOrEqual(level.maxNodes + 1_023);

      const blackPosition = new Game();
      blackPosition.move(blackPosition.legalUci()[0]!);
      const blackMove = chooseMove(blackPosition.fen(), level, { now: shortClock(), rng: mulberry32(level.id) });
      expect(blackPosition.legalUci()).toContain(blackMove?.uci);
    }
  });

  it('finds a direct Lion capture and supports multi-capture and river-deadline positions', () => {
    expect(bestMove(LION_CAPTURE_FEN, { maxDepth: 2, maxNodes: 2_000 })?.uci).toBe('c1c7');
    for (const fen of [MONKEY_FEN, RIVER_FEN]) {
      const game = new Game(fen);
      expect(game.status(), fen).toEqual({ kind: 'ongoing' });
      expect(game.legalUci().length, fen).toBeGreaterThan(0);
      const move = bestMove(fen, { maxDepth: 2, maxNodes: 1_024 });
      expect(move, fen).not.toBeNull();
      expect(game.legalUci()).toContain(move!.uci);
    }
  });

  it('is deterministic from a seed, respects repetition keys, and returns null for terminal positions', () => {
    const position = new Game().fen();
    const first = chooseMove(position, 4, { now: shortClock(), rng: mulberry32(91) });
    const second = chooseMove(position, 4, { now: shortClock(), rng: mulberry32(91) });
    expect(second).toEqual(first);
    expect(keyOfFen('7/7/7/7/7/7/2Ll3 w - 0 1')).toBe('7/7/7/7/7/7/2Ll3 w');
    expect(bestMove('2l4/7/7/7/7/7/6L w - 0 1')).toBeNull();
  });
});
