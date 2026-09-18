import { describeVariantConformance } from '@chaturanga/rules-core/testing';
import { shogi } from './variant';

describeVariantConformance(shogi, {
  fens: [
    'ln2k1s2/r1s1g1gbl/ppppp1pp1/5p3/3P3np/4PS3/PPP2PPPL/1BG4R1/LN1KGS1N1[p] b - - 7 19',
    '5ks1b/lrss2g2/1pnpg1p1l/p1p1p2p1/3P3Np/P2N1p2L/1PP2P1P1/1B1GKGS2/LN1R5[ppp] w - - 12 38',
    '8b/lrssgkg1P/1pnp2psN/p1N1P2pl/1b1P1SP1L/P8/1PP4P1/2G1p4/LNK2+p3[Gpppr] b - - 0 56',
  ],
  invalidFens: ['', '4k4/9/9/9/9/9/9/9/9/4K4[] w - - 0 1', '4k4/9/9/9/9/9/9/4K4[] w - - 0 1'],
  illegalMoves: ['a1a3', 'e9e8', 'zz', 'P@e4'],
  checkmate: {
    fen: '8b/lrssgkg1P/1pnp2psN/p1N1P2pl/1b1P1SP1L/P8/1PP4P1/2G3+p2/LNg1K4[ppppr] b - - 1 54',
    move: 'R@d1',
    winner: 'b',
  },
});
