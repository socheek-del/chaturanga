import { describeVariantConformance } from '@chaturanga/rules-core/testing';
import { chess } from './variant';

describeVariantConformance(chess, {
  fens: [
    'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1',
    'rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8',
    '8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1',
  ],
  invalidFens: ['', '4k3/8/8/8/8/8/8/8 w - - 0 1', 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNX w KQkq - 0 1'],
  illegalMoves: ['a1a3', 'e2e5', 'zz', 'e1g1'],
  checkmate: {
    fen: '6k1/5ppp/8/8/8/8/8/3R2K1 w - - 0 1',
    move: 'd1d8',
    winner: 'w',
  },
});
