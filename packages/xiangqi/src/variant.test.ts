import { describeVariantConformance } from '@chaturanga/rules-core/testing';
import { xiangqi } from './variant';

describeVariantConformance(xiangqi, {
  fens: [
    '1nbakabnr/2C6/r6c1/pC2p1p1p/2p6/9/P1P1P1P1P/8B/9/RNBAKA1NR b - - 2 6',
    '2bakabnr/3r5/2n1c4/2p1p1p1p/3P5/p5P2/P3P1C1P/5C3/9/RNBAKABNR b - - 0 11',
    '2b1k4/R8/4b1n2/3r5/9/6R2/7N1/9/4K4/2B2c3 w - - 0 21',
  ],
  invalidFens: ['', '4k4/9/9/9/9/9/9/9/9/4K4 w - - 0 1', '4k4/9/9/9/9/9/9/9/9/4KQ3 w - - 0 1'],
  illegalMoves: ['e3e4', 'a1a5', 'zz'],
  checkmate: {
    fen: 'r2a2r2/3k4n/3aP4/9/n1b6/8p/P5p2/4R3B/3KA4/2B6 w - - 8 29',
    move: 'e8d8',
    winner: 'w',
  },
});
