import { describeVariantConformance } from '@chaturanga/rules-core/testing';
import { START_FENS } from './fen';
import { janggi } from './variant';

describeVariantConformance(janggi, {
  fens: [...START_FENS, '3k5/4a4/5R3/9/9/9/9/3c5/4A4/4K1C2 w - - 4 31', '4k4/9/9/9/9/9/9/9/9/4K4 b - - 2 40'],
  invalidFens: ['', '4k4/9/9/9/9/9/9/9/9/4KQ3 w - - 0 1', '9/9/9/4k4/9/9/9/9/9/4K4 w - - 0 1', '3k5/3R5/9/9/9/9/9/9/9/4K4 w - - 0 1'],
  illegalMoves: ['b3b6', 'a1a5', 'e2e1e', 'zz', 'a1a1'],
  checkmate: { fen: '3k5/R8/9/9/9/9/9/9/4K4/7R1 w - - 0 1', move: 'h1h10', winner: 'w' },
});
