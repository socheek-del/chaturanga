/**
 * Plays seeded random Shogi games in lock-step with Fairy-Stockfish (ffish) and compares legal moves,
 * SAN, FEN and the game result after every ply (sg-001, sg-002). Half the games use a repetition-biased
 * move picker (each side often steps back and forth, and often gives check), so sennichite draws and
 * perpetual checks actually happen instead of only checkmates.
 */
import { describe, expect, it } from 'vitest';
import { Game } from './game';
import type { GameStatus } from './types';
import { type FfishBoard, loadFfish, mulberry32 } from './testing/ffish';

const GAMES = process.env.PERFT_DEEP === '1' ? 400 : 60;
const MAX_PLIES = 300;
const CYCLES = process.env.PERFT_DEEP === '1' ? 1200 : 200;

/** What ffish's `result(true)` prints for a status. */
function resultString(status: GameStatus): string {
  if (status.kind === 'ongoing') return '*';
  if ('winner' in status && status.winner) return status.winner === 'w' ? '1-0' : '0-1';
  return '1/2-1/2';
}

/**
 * Fairy-Stockfish's `shogi` variant does not implement uchifuzume, so its move list is ours plus the pawn
 * drops this engine forbids for mating. Comparing the union pins that divergence exactly: any other
 * difference still fails (RULES.md, sg-001).
 */
function compare(game: Game, ref: FfishBoard, context: () => string): GameStatus {
  const uchifuzume = game.uchifuzumeUci();
  const ours = [...game.legalUci(), ...uchifuzume].sort();
  expect(ours, `legal moves ${context()}`).toEqual(ref.legalMoves().split(' ').filter(Boolean).sort());
  expect(game.fen(), `fen ${context()}`).toBe(ref.fen());
  const status = game.status();
  // When the only moves left are forbidden pawn-drop mates, the two engines legitimately disagree about
  // whether the game is over; every other position must agree.
  if (uchifuzume.length && game.legalUci().length === 0) return status;
  expect(status.kind !== 'ongoing', `game over (${status.kind}) ${context()}`).toBe(ref.isGameOver(true));
  expect(resultString(status), `result (${status.kind}) ${context()}`).toBe(ref.result(true));
  return status;
}

const BOARD_MOVE = /^([a-i][1-9])([a-i][1-9])(\+?)$/;

/** The same board move played backwards; undefined for a drop or a promotion (neither can be undone). */
function reverse(uci: string): string | undefined {
  const m = BOARD_MOVE.exec(uci);
  return m && !m[3] ? m[2]! + m[1]! : undefined;
}

/** Random move, or (repetition-biased games) a step back along this side's last move, or a check. */
function pickMove(game: Game, played: readonly string[], rand: () => number, biased: boolean): string {
  const legal = game.legalUci();
  if (biased) {
    const own = played.at(-2);
    const back = own && reverse(own);
    if (back && rand() < 0.6 && legal.includes(back)) return back;
    if (rand() < 0.25) {
      const checks = legal.filter((uci) => {
        const check = game.move(uci).san.includes('+');
        game.undo();
        return check;
      });
      if (checks.length) return checks[Math.floor(rand() * checks.length)]!;
    }
  }
  return legal[Math.floor(rand() * legal.length)]!;
}

describe('lock-step random games vs Fairy-Stockfish (sg-001, sg-002)', () => {
  it(
    `${GAMES} seeded games agree on every ply, including the game result`,
    { timeout: 1_800_000 },
    async () => {
      const ffish = await loadFfish();
      let captures = 0;
      let drops = 0;
      let promotions = 0;
      const endings = new Map<string, number>();

      for (let seed = 1; seed <= GAMES; seed++) {
        const rand = mulberry32(seed);
        const biased = seed % 2 === 0;
        const game = new Game();
        const ref = new ffish.Board('shogi');
        const played: string[] = [];
        const context = () => `seed=${seed} moves=${played.join(' ')}`;
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
            if (record.from === null) drops++;
            if (record.promotion) promotions++;
            status = compare(game, ref, context);
          }
          endings.set(status.kind, (endings.get(status.kind) ?? 0) + 1);
        } finally {
          ref.delete();
        }
      }

      expect(captures).toBeGreaterThan(0);
      expect(drops).toBeGreaterThan(0);
      expect(promotions).toBeGreaterThan(0);
      expect(endings.get('checkmate')).toBeGreaterThan(0);
    },
  );

  /**
   * Repetition gets its own fuzz: from a random middlegame each side plays a quiet move and steps back,
   * so the same position comes up a fourth time after 12 plies. Some cycles are idle (a draw) and some
   * check every time (the checking side loses), which is the one place Shogi's repetition rule is decisive.
   */
  it(`${CYCLES} forced repetition cycles agree on every ply`, { timeout: 1_800_000 }, async () => {
    const ffish = await loadFfish();
    const endings = new Map<string, number>();

    for (let seed = 1; seed <= CYCLES; seed++) {
      const rand = mulberry32(seed * 7919);
      const game = new Game();
      const ref = new ffish.Board('shogi');
      const played: string[] = [];
      const context = () => `cycle seed=${seed} moves=${played.join(' ')}`;
      const play = (uci: string): GameStatus => {
        game.move(uci);
        ref.push(uci);
        played.push(uci);
        return compare(game, ref, context);
      };
      try {
        const opening = 10 + Math.floor(rand() * 40);
        let status = compare(game, ref, context);
        while (status.kind === 'ongoing' && played.length < opening) {
          const legal = game.legalUci();
          status = play(legal[Math.floor(rand() * legal.length)]!);
        }
        if (status.kind !== 'ongoing') continue;

        const reversible = (): string[] =>
          game.legalUci().filter((uci) => {
            const m = BOARD_MOVE.exec(uci);
            return !!m && !m[3] && game.pieceAt(squareIndex(m[2]!)) === null;
          });
        const pick = (moves: string[]): string | undefined => moves[Math.floor(rand() * moves.length)];
        const a = pick(reversible());
        if (!a) continue;
        status = play(a);
        const b = status.kind === 'ongoing' ? pick(reversible()) : undefined;
        if (!b) continue;
        status = play(b);
        const cycle = [
          reverse(a)!,
          reverse(b)!,
          a,
          b,
          reverse(a)!,
          reverse(b)!,
          a,
          b,
          reverse(a)!,
          reverse(b)!,
        ];
        for (const uci of cycle) {
          if (status.kind !== 'ongoing' || !game.legalUci().includes(uci)) break;
          status = play(uci);
        }
        endings.set(status.kind, (endings.get(status.kind) ?? 0) + 1);
      } finally {
        ref.delete();
      }
    }

    const tally = JSON.stringify([...endings]);
    expect(endings.get('repetition'), tally).toBeGreaterThan(0);
  });
});

/** Square index of a coordinate name on the 9x9 board, for the quiet-move filter. */
function squareIndex(name: string): number {
  return (Number(name[1]) - 1) * 9 + (name.charCodeAt(0) - 97);
}
