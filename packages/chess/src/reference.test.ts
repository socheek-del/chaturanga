/**
 * Plays seeded random chess games in lock-step with Fairy-Stockfish (ffish) and compares legal moves, SAN,
 * FEN and the game result after every ply (ch-001, ch-002). Some games are repetition-biased, so threefold
 * draws happen instead of only mates, and some start from positions full of castling, promotions and
 * captures in passing.
 */
import { describe, expect, it } from 'vitest';
import { Game } from './game';
import type { GameStatus } from './types';
import { type FfishBoard, loadFfish, mulberry32 } from './testing/ffish';

const DEEP = process.env.PERFT_DEEP === '1';
const GAMES = DEEP ? 400 : 60;
const MAX_PLIES = 300;

/** Positions that make the awkward moves common; the last one is Kiwipete. */
const OPENINGS = [
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1',
  'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1',
  '4k3/PPP3PP/8/8/8/8/ppp3pp/4K3 w - - 0 1',
];

/** What ffish's `result(true)` prints for a status. */
function resultString(status: GameStatus): string {
  if (status.kind === 'ongoing') return '*';
  if ('winner' in status && status.winner) return status.winner === 'w' ? '1-0' : '0-1';
  return '1/2-1/2';
}

function compare(game: Game, ref: FfishBoard, context: () => string): GameStatus {
  expect(game.legalUci().sort(), `legal moves ${context()}`).toEqual(ref.legalMoves().split(' ').filter(Boolean).sort());
  expect(game.fen(), `fen ${context()}`).toBe(ref.fen());
  const status = game.status();
  // claimDraw: this engine ends a game on the third repetition and the fiftieth move itself (D11).
  expect(status.kind !== 'ongoing', `game over (${status.kind}) ${context()}`).toBe(ref.isGameOver(true));
  expect(resultString(status), `result (${status.kind}) ${context()}`).toBe(ref.result(true));
  return status;
}

const MOVE = /^([a-h][1-8])([a-h][1-8])$/;

/** The same move played backwards; undefined for a promotion or a capture, which cannot be undone. */
function reverse(game: Game, uci: string): string | undefined {
  const m = MOVE.exec(uci);
  if (!m) return undefined;
  const back = m[2]! + m[1]!;
  return game.legalUci().includes(back) ? back : undefined;
}

function pickMove(game: Game, played: readonly string[], rand: () => number, biased: boolean): string {
  const legal = game.legalUci();
  if (biased) {
    const own = played.at(-2);
    const back = own && reverse(game, own);
    if (back && rand() < 0.7) return back;
  }
  return legal[Math.floor(rand() * legal.length)]!;
}

describe('lock-step random games vs Fairy-Stockfish (ch-001, ch-002)', () => {
  it(`${GAMES} seeded games agree on every ply, including the game result`, { timeout: 1_800_000 }, async () => {
    const ffish = await loadFfish();
    let captures = 0;
    let castles = 0;
    let promotions = 0;
    const endings = new Map<string, number>();

    for (let seed = 1; seed <= GAMES; seed++) {
      const rand = mulberry32(seed);
      const biased = seed % 3 === 0;
      const fen = OPENINGS[seed % OPENINGS.length]!;
      const game = new Game(fen);
      const ref = new ffish.Board('chess', fen);
      const played: string[] = [];
      const context = () => `seed=${seed} fen=${fen} moves=${played.join(' ')}`;
      try {
        let status = compare(game, ref, context);
        while (status.kind === 'ongoing' && played.length < MAX_PLIES) {
          const uci = pickMove(game, played, rand, biased);
          const san = ref.sanMove(uci);
          const record = game.move(uci);
          expect(record.san, `san of ${uci} ${context()}`).toBe(san);
          ref.push(uci);
          played.push(uci);
          if (record.captured) captures++;
          if (record.promotion) promotions++;
          if (record.san.startsWith('O-O')) castles++;
          status = compare(game, ref, context);
        }
        endings.set(status.kind, (endings.get(status.kind) ?? 0) + 1);
      } finally {
        ref.delete();
      }
    }

    const tally = JSON.stringify([...endings]);
    expect(captures, tally).toBeGreaterThan(0);
    expect(promotions, tally).toBeGreaterThan(0);
    expect(castles, tally).toBeGreaterThan(0);
    expect(endings.get('checkmate'), tally).toBeGreaterThan(0);
    expect(endings.get('repetition'), tally).toBeGreaterThan(0);
    expect(endings.get('stalemate'), tally).toBeGreaterThan(0);
    expect(endings.get('insufficient-material'), tally).toBeGreaterThan(0);
  });
});
