import { describe, expect, it } from 'vitest';
import { FenError, parseFen, serializeFen, START_FEN } from './fen';

const roundTrip = (fen: string) => serializeFen(parseFen(fen));

describe('FEN round trip', () => {
  // Positions from real Fairy-Stockfish (ffish 0.7.10) games, plus the start position.
  const positions = [
    START_FEN,
    '1nbakabnr/2C6/r6c1/pC2p1p1p/2p6/9/P1P1P1P1P/8B/9/RNBAKA1NR b - - 2 6',
    'rnb1kabnr/1c2a4/9/p1p1p1pc1/8p/4P4/P1P3P1P/B3C4/7C1/RN1AKABNR w - - 16 9',
    '2bakabnr/3r5/2n1c4/2p1p1p1p/3P5/p5P2/P3P1C1P/5C3/9/RNBAKABNR b - - 0 11',
    'r2akabn1/3nc4/8r/2p3p1p/1Pb1p4/p2c2P2/P3P2CP/3CB3R/4K4/RN1A1ABN1 w - - 26 14',
    '1nbk1abnr/r3a4/4c3C/2p1p1p2/8p/p3P4/2P3P1P/8N/2Nc3R1/R1BAKAB1C b - - 11 16',
    '1nbk1ab1r/9/1Cra3cn/4p4/pC4P1p/P4c3/2P1P3P/8B/5K3/RN1A1ABNR w - - 5 19',
    '3a1k3/3n5/9/4p3r/p5b2/6P2/P1P1P4/B4A2p/4R4/4KA3 b - - 1 21',
    '2ba1a3/4k4/9/R5p2/9/2P6/9/8N/4r4/2BAK1B2 w - - 0 22',
    '1nb1k4/4a4/9/8R/9/2p3P2/5C2P/9/9/4KAB2 b - - 1 22',
    '2bk5/4a4/r7b/4p1p2/p7p/P5P2/8P/2NA3N1/4K4/5AB2 w - - 0 23',
    '2b1k4/R8/4b1n2/3r5/9/6R2/7N1/9/4K4/2B2c3 w - - 0 21',
    'r8/4k4/n8/1C2p4/R8/9/8r/3A5/3K5/1RB6 b - - 0 21',
    // Checkmate fixture (also used by movegen.test.ts and variant.test.ts).
    'r2a2r2/3k4n/3aP4/9/n1b6/8p/P5p2/4R3B/3KA4/2B6 w - - 8 29',
  ];

  it.each(positions)('%s', (fen) => {
    expect(roundTrip(fen)).toBe(fen);
  });

  it('fills in missing trailing fields', () => {
    expect(roundTrip('rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w')).toBe(START_FEN);
  });
});

describe('invalid FEN', () => {
  const invalid: Array<[string, string]> = [
    ['empty', ''],
    ['one field', START_FEN.split(' ')[0]!],
    ['nine ranks', '9/9/9/9/9/9/9/9/9 w - - 0 1'],
    ['ten squares in a rank', '4k5/9/9/9/9/9/9/9/9/4K4 w - - 0 1'],
    ['short rank', '4k3/9/9/9/9/9/9/9/9/4K4 w - - 0 1'],
    ['unknown piece letter', '4k4/9/9/9/9/9/9/9/9/4KQ3 w - - 0 1'],
    ['no red general', '4k4/9/9/9/9/9/9/9/9/9 w - - 0 1'],
    ['no black general', '9/9/9/9/9/9/9/9/9/4K4 w - - 0 1'],
    ['two red generals', '4k4/9/9/9/9/9/9/9/9/3KK4 w - - 0 1'],
    ['bad side to move', '4k4/9/9/9/9/9/9/9/9/4K4 x - - 0 1'],
    ['castling field present', '4k4/9/9/9/9/9/9/9/9/4K4 w KQ - 0 1'],
    ['en passant field present', '4k4/9/9/9/9/9/9/9/9/4K4 w - e3 0 1'],
    ['non-numeric halfmove', '4k4/9/9/9/9/9/9/9/9/4K4 w - - x 1'],
    ['non-numeric fullmove', '4k4/9/9/9/9/9/9/9/9/4K4 w - - 0 x'],
    // The two generals face each other on the open e-file: whichever side is not to move is in check.
    ['generals facing', '4k4/9/9/9/9/9/9/9/9/4K4 w - - 0 1'],
  ];

  it.each(invalid)('rejects %s', (_name, fen) => {
    expect(() => parseFen(fen)).toThrow(FenError);
  });
});
