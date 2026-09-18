import { describe, expect, it } from 'vitest';
import { normalizeEp, parseFen } from './fen';
import type { Position } from './movegen';
import { perft } from './perft';

/**
 * The standard perft suite every chess move generator is checked against. Depths marked deep run only
 * under PERFT_DEEP=1, because they take minutes.
 */
const DEEP = process.env.PERFT_DEEP === '1';

function positionOf(fen: string): Position {
  const data = parseFen(fen);
  const pos: Position = { board: data.board, turn: data.turn, castling: data.castling, ep: data.ep };
  normalizeEp(pos);
  return pos;
}

const SUITE: Array<{ name: string; fen: string; counts: number[]; deepFrom: number }> = [
  {
    name: 'the start position',
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    counts: [20, 400, 8902, 197281, 4865609],
    deepFrom: 4,
  },
  {
    name: 'Kiwipete',
    fen: 'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1',
    counts: [48, 2039, 97862, 4085603],
    deepFrom: 4,
  },
  {
    name: 'position 3 (pawns and a rook endgame)',
    fen: '8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1',
    counts: [14, 191, 2812, 43238, 674624],
    deepFrom: 5,
  },
  {
    name: 'position 4 (promotions and pins)',
    fen: 'r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1',
    counts: [6, 264, 9467, 422333],
    deepFrom: 4,
  },
  {
    name: 'position 5',
    fen: 'rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8',
    counts: [44, 1486, 62379, 2103487],
    deepFrom: 4,
  },
  {
    name: 'position 6',
    fen: 'r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w - - 0 10',
    counts: [46, 2079, 89890, 3894594],
    deepFrom: 4,
  },
];

describe('perft (ch-001)', () => {
  for (const { name, fen, counts, deepFrom } of SUITE) {
    for (const [index, expected] of counts.entries()) {
      const depth = index + 1;
      const deep = depth >= deepFrom;
      it.skipIf(deep && !DEEP)(`${name} to depth ${depth}`, { timeout: 600_000 }, () => {
        expect(perft(positionOf(fen), depth)).toBe(expected);
      });
    }
  }
});
