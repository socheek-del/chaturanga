import { describeVariantConformance } from '@chaturanga/rules-core/testing';
import { crazyhouse } from './variant';

describeVariantConformance(crazyhouse, {
  fens: [
    '4k3/8/8/3q~4/3R4/8/8/4K3[] w - - 0 1',
    'k3r3/8/8/8/8/8/8/4K3[B] w - - 0 1',
    '4k3/8/8/8/8/8/P7/4K3[Pp] w - - 0 1',
  ],
  invalidFens: [
    '',
    '4k3/8/8/8/8/8/8/8[] w - - 0 1',
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    '4k3/8/8/8/8/8/8/4K3[K] w - - 0 1',
    '4k3/8/8/8/8/8/8/3P~K3[] w - - 0 1',
  ],
  illegalMoves: ['a1a3', 'e2e5', 'P@e4', 'zz', 'e1g1'],
  checkmate: {
    fen: '6k1/5ppp/8/8/8/8/8/3R2K1[] w - - 0 1',
    move: 'd1d8',
    winner: 'w',
  },
});
