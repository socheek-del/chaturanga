import { describe, expect, it } from 'vitest';
import { FenError } from '@chaturanga/rules-core';
import { Game } from './game';
import { parseFen, serializeFen, START_FEN } from './fen';
import { loadFfish, mulberry32 } from './testing/ffish';

/** Positions with the fields that only chess has: castling rights, an en passant square, a full clock. */
const POSITIONS = [
  START_FEN,
  'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1',
  'rnbqkbnr/1pp1pppp/p7/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 3',
  '8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1',
  'r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1',
  'rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8',
  '4k3/8/8/8/8/8/8/4K2R w K - 12 34',
  '4k2r/8/8/8/8/8/8/4K3 b k - 0 60',
  '8/8/6K1/8/6b1/2k5/8/5b2 w - - 0 149',
  '6k1/5ppp/8/8/8/8/5PPP/6K1 w - - 99 120',
  'r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3',
];

const INVALID = [
  '',
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq',
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP w KQkq - 0 1',
  'rnbqkbnr/pppppppp/9/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNX w KQkq - 0 1',
  '4k3/8/8/8/8/8/8/8 w - - 0 1',
  '4k3/8/8/8/8/8/8/4KK2 w - - 0 1',
  'P3k3/8/8/8/8/8/8/4K3 w - - 0 1',
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR x KQkq - 0 1',
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkqZ - 0 1',
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KK - 0 1',
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq e9 0 1',
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq e4 0 1',
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - x 1',
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 0',
  '4k3/8/8/8/8/8/4R3/4K3 w - - 0 1',
];

describe('FEN (ch-001)', () => {
  it.each(POSITIONS)('round-trips %s', (fen) => {
    expect(new Game(fen).fen()).toBe(fen);
    expect(serializeFen(parseFen(fen))).toBe(fen);
  });

  it.each(INVALID)('rejects %s', (fen) => {
    expect(() => new Game(fen)).toThrow(FenError);
  });

  it('drops castling rights whose king or rook has moved, the way Stockfish reads a FEN', () => {
    expect(new Game('r3k2r/8/8/8/8/8/8/4K2R w KQkq - 0 1').fen()).toBe('r3k2r/8/8/8/8/8/8/4K2R w Kkq - 0 1');
  });

  it('keeps the en passant square only when a pawn can take there, as Fairy-Stockfish writes it', () => {
    const noTaker = new Game();
    noTaker.move('e2e4');
    expect(noTaker.fen()).toContain(' KQkq - ');
    const taker = new Game('rnbqkbnr/pppppppp/8/4P3/8/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1');
    taker.move('d7d5');
    expect(taker.fen()).toContain(' KQkq d6 ');
  });

  it('round-trips every position of 20 seeded games against ffish', async () => {
    const ffish = await loadFfish();
    let positions = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const rand = mulberry32(seed * 31);
      const game = new Game();
      const ref = new ffish.Board('chess');
      try {
        for (let ply = 0; ply < 80; ply++) {
          const fen = ref.fen();
          expect(new Game(fen).fen(), `seed=${seed} ply=${ply}`).toBe(fen);
          positions++;
          if (ref.isGameOver(true)) break;
          const legal = game.legalUci();
          const uci = legal[Math.floor(rand() * legal.length)]!;
          game.move(uci);
          ref.push(uci);
        }
      } finally {
        ref.delete();
      }
    }
    expect(positions).toBeGreaterThan(500);
  }, 120_000);
});
