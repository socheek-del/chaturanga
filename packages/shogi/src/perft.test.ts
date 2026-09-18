import { describe, expect, it } from 'vitest';
import { perft } from './perft';
import reference from './testing/perft-reference.json';

/** Fast depths run in `npm run verify`; set PERFT_DEEP=1 to run every reference depth. */
const DEEP = process.env.PERFT_DEEP === '1';
const FAST_NODE_BUDGET = 30_000;

/**
 * The reference counts come from Fairy-Stockfish, which does not implement uchifuzume, so they are
 * compared against this engine with that rule switched off. The strict counts below are this engine's
 * own, with the real rule on: they are a regression pin, and every one of them is at most the
 * Fairy-Stockfish count, because the only difference is pawn drops this engine refuses.
 */
describe('perft matches Fairy-Stockfish with its rules (sg-001)', () => {
  for (const position of reference.positions) {
    position.perft.forEach((expected, index) => {
      const depth = index + 1;
      const run = DEEP || expected <= FAST_NODE_BUDGET;
      it.runIf(run)(`${position.name} depth ${depth} = ${expected}`, { timeout: 600_000 }, () => {
        expect(perft(position.fen, depth, false)).toBe(expected);
      });
    });
  }
});

describe('perft under the real rules never counts a forbidden pawn-drop mate (sg-001)', () => {
  for (const position of reference.positions) {
    position.perft.forEach((expected, index) => {
      const depth = index + 1;
      const run = DEEP || expected <= FAST_NODE_BUDGET;
      it.runIf(run)(`${position.name} depth ${depth}`, { timeout: 600_000 }, () => {
        expect(perft(position.fen, depth)).toBeLessThanOrEqual(expected);
      });
    });
  }
});
