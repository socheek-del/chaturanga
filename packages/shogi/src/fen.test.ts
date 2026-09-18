import { describe, expect, it } from 'vitest';
import { FenError, parseFen, serializeFen, START_FEN } from './fen';
import { Game } from './game';

const VALID = [
  START_FEN,
  'ln2k1s2/r1s1g1gbl/ppppp1pp1/5p3/3P3np/4PS3/PPP2PPPL/1BG4R1/LN1KGS1N1[p] b - - 7 19',
  '5ks1b/lrss2g2/1pnpg1p1l/p1p1p2p1/3P3Np/P2N1p2L/1PP2P1P1/1B1GKGS2/LN1R5[ppp] w - - 12 38',
  '8b/lrssgkg1P/1pnp2psN/p1N1P2pl/1b1P1SP1L/P8/1PP4P1/2G1p4/LNK2+p3[Gpppr] b - - 0 56',
  '4k4/9/9/9/9/9/9/9/4K4[GNLPSRBgnlpsrb] w - - 0 1',
];

const INVALID: Array<[string, string]> = [
  ['empty', ''],
  ['one field', 'lnsgkgsnl'],
  ['eight ranks', 'lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/LNSGKGSNL[] w - - 0 1'],
  ['a rank that is too long', 'lnsgkgsnll/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL[] w - - 0 1'],
  ['an unknown piece', 'lnsqkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL[] w - - 0 1'],
  ['no Sente king', 'lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSG1GSNL[] w - - 0 1'],
  ['two Gote kings', 'lnsgkgsnl/1r2k2b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL[] w - - 0 1'],
  ['a promoted gold', '4k4/9/9/9/4+G4/9/9/9/4K4[] w - - 0 1'],
  ['a dangling +', '4k4/9/9/9/4P3+/9/9/9/4K4[] w - - 0 1'],
  ['a doubled +', '4k4/9/9/9/3++P3/9/9/9/4K4[] w - - 0 1'],
  ['a king in hand', '4k4/9/9/9/9/9/9/9/4K4[K] w - - 0 1'],
  ['no side to move', '4k4/9/9/9/9/9/9/9/4K4[] x - - 0 1'],
  ['a castling field', '4k4/9/9/9/9/9/9/9/4K4[] w KQ - 0 1'],
  ['the side not to move in check', '4k4/4R4/9/9/9/9/9/9/4K4[] w - - 0 1'],
];

describe('FEN (sg-001)', () => {
  it.each(VALID)('round-trips %s', (fen) => {
    expect(serializeFen(parseFen(fen))).toBe(fen);
    expect(new Game(fen).fen()).toBe(fen);
  });

  it.each(INVALID)('rejects %s', (_name, fen) => {
    expect(() => parseFen(fen)).toThrow(FenError);
  });

  it('writes pieces in hand in Fairy-Stockfish order, Sente first', () => {
    const fen = '4k4/9/9/9/9/9/9/9/4K4[brpslngBRPSLNG] w - - 0 1';
    expect(parseFen(fen) && serializeFen(parseFen(fen))).toBe(
      '4k4/9/9/9/9/9/9/9/4K4[GNLPSRBgnlpsrb] w - - 0 1',
    );
  });

  it('keeps promoted pieces distinct from their unpromoted form', () => {
    const game = new Game('4k4/9/9/9/4+P4/9/9/9/4K4[] w - - 0 1');
    expect(game.pieceAt(40)).toEqual({ color: 'w', type: 'p', promoted: true });
  });
});
