import { describe, expect, it } from 'vitest';
import { perft } from './perft';
import reference from './testing/perft-reference.json';

/** Fast depths run in `npm run verify`; set PERFT_DEEP=1 to run every reference depth. */
const DEEP = process.env.PERFT_DEEP === '1';
const FAST_NODE_BUDGET = 30_000;

describe('perft matches Fairy-Stockfish (xq-001)', () => {
  for (const position of reference.positions) {
    position.perft.forEach((expected, index) => {
      const depth = index + 1;
      const run = DEEP || expected <= FAST_NODE_BUDGET;
      it.runIf(run)(`${position.name} depth ${depth} = ${expected}`, { timeout: 600_000 }, () => {
        expect(perft(position.fen, depth)).toBe(expected);
      });
    });
  }
});
