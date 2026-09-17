/**
 * Plays seeded random Xiangqi games in lock-step with Fairy-Stockfish (ffish) and compares legal
 * moves, SAN, FEN and the game result after every ply (xq-001, xq-002). Half the games use a
 * repetition-biased move picker (each side often steps back and forth, and often gives check), so
 * idle repetitions, perpetual checks and perpetual chases actually happen instead of only checkmates.
 */
import { describe, expect, it } from 'vitest';
import { Game } from './game';
import type { GameStatus } from './types';
import { type FfishBoard, loadFfish, mulberry32, normalizeFen } from './testing/ffish';

const GAMES = process.env.PERFT_DEEP === '1' ? 400 : 60;
const MAX_PLIES = 400;
const CYCLES = process.env.PERFT_DEEP === '1' ? 4000 : 400;
const SEARCHES = process.env.PERFT_DEEP === '1' ? 1000 : 60;

/** What ffish's `result(true)` prints for a status. */
function resultString(status: GameStatus): string {
  if (status.kind === 'ongoing') return '*';
  if ('winner' in status && status.winner) return status.winner === 'w' ? '1-0' : '0-1';
  return '1/2-1/2';
}

function compare(game: Game, ref: FfishBoard, context: () => string): GameStatus {
  const ours = game.legalUci().slice().sort();
  expect(ours, `legal moves ${context()}`).toEqual(ref.legalMoves().split(' ').filter(Boolean).sort());
  expect(normalizeFen(game.fen()), `fen ${context()}`).toBe(ref.fen());
  const status = game.status();
  expect(status.kind !== 'ongoing', `game over (${status.kind}) ${context()}`).toBe(ref.isGameOver(true));
  expect(resultString(status), `result (${status.kind}) ${context()}`).toBe(ref.result(true));
  return status;
}

function squareOfUciTarget(uci: string): number {
  const m = /^[a-i]\d{1,2}([a-i])(\d{1,2})$/.exec(uci)!;
  return (Number(m[2]) - 1) * 9 + (m[1]!.charCodeAt(0) - 97);
}

function reverse(uci: string): string {
  const m = /^([a-i]\d{1,2})([a-i]\d{1,2})$/.exec(uci)!;
  return m[2]! + m[1]!;
}

/** Random move, or (repetition-biased games) a step back along this side's last move, or a check. */
function pickMove(game: Game, played: readonly string[], rand: () => number, biased: boolean): string {
  const legal = game.legalUci();
  if (biased) {
    const own = played.at(-2);
    if (own && rand() < 0.55 && legal.includes(reverse(own))) return reverse(own);
    if (rand() < 0.3) {
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

describe('lock-step random games vs Fairy-Stockfish (xq-001, xq-002)', () => {
  it(`${GAMES} seeded games agree on every ply, including the game result`, { timeout: 1_800_000 }, async () => {
    const ffish = await loadFfish();
    let captures = 0;
    let checks = 0;
    const endings = new Map<string, number>();

    for (let seed = 1; seed <= GAMES; seed++) {
      const rand = mulberry32(seed);
      const biased = seed % 2 === 0;
      const game = new Game();
      const ref = new ffish.Board('xiangqi');
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
          if (record.san.includes('+') || record.san.includes('#')) checks++;
          status = compare(game, ref, context);
        }
        endings.set(status.kind, (endings.get(status.kind) ?? 0) + 1);
      } finally {
        ref.delete();
      }
    }

    expect(captures).toBeGreaterThan(0);
    expect(checks).toBeGreaterThan(0);
    expect(endings.get('checkmate')).toBeGreaterThan(0);
    expect(endings.get('repetition')).toBeGreaterThan(0);
    if (GAMES >= 400) {
      expect(endings.get('stalemate'), JSON.stringify([...endings])).toBeGreaterThan(0);
      expect((endings.get('perpetual-check') ?? 0) + (endings.get('perpetual-chase') ?? 0)).toBeGreaterThan(0);
    }
  });

  /**
   * Chasing rules get their own fuzz: from a random middlegame, one side plays a quiet move and back
   * while the other does the same, so the position repeats a third time after 8 plies. Most cycles are
   * idle, but many chase (an attack on an undefended or stronger piece repeated every cycle), some check,
   * and some are mutual, so every branch of the ported chased() gets compared with ffish.
   */
  it(`${CYCLES} forced repetition cycles agree on every ply`, { timeout: 1_800_000 }, async () => {
    const ffish = await loadFfish();
    const endings = new Map<string, number>();

    for (let seed = 1; seed <= CYCLES; seed++) {
      const rand = mulberry32(seed * 7919);
      const game = new Game();
      const ref = new ffish.Board('xiangqi');
      const played: string[] = [];
      const context = () => `cycle seed=${seed} moves=${played.join(' ')}`;
      const play = (uci: string): GameStatus => {
        game.move(uci);
        ref.push(uci);
        played.push(uci);
        return compare(game, ref, context);
      };
      try {
        // A capture-heavy random opening thins the board so pieces can reach each other.
        const opening = 16 + Math.floor(rand() * 50);
        let status = compare(game, ref, context);
        while (status.kind === 'ongoing' && played.length < opening) {
          const legal = game.legalUci();
          const captures = legal.filter((uci) => game.pieceAt(squareOfUciTarget(uci)) !== null);
          const pool = captures.length && rand() < 0.6 ? captures : legal;
          status = play(pool[Math.floor(rand() * pool.length)]!);
        }
        if (status.kind !== 'ongoing') continue;

        const quiet = (): string[] => game.legalUci().filter((uci) => game.pieceAt(squareOfUciTarget(uci)) === null);
        const pick = (moves: string[]): string | undefined => moves[Math.floor(rand() * moves.length)];
        const a = pick(quiet());
        if (!a) continue;
        status = play(a);
        const b = status.kind === 'ongoing' ? pick(quiet()) : undefined;
        if (!b) continue;
        status = play(b);
        const cycle = [reverse(a), reverse(b), a, b, reverse(a), reverse(b)];
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
    expect(endings.get('perpetual-chase'), tally).toBeGreaterThan(0);
    expect(endings.get('perpetual-check'), tally).toBeGreaterThan(0);
  });

  /**
   * The random cycles above rarely chase for real, so this search asks ffish alone (not this engine)
   * which quiet move pairs a, b make `a b a' b' a b a' b'` end decisively, then replays one such cycle
   * through both engines ply by ply. Positive chase and check cases are found independently of the
   * code under test.
   */
  it(`perpetual cycles found by ffish in ${SEARCHES} positions agree on every ply`, { timeout: 1_800_000 }, async () => {
    const ffish = await loadFfish();
    const endings = new Map<string, number>();

    for (let seed = 1; seed <= SEARCHES; seed++) {
      const rand = mulberry32(seed * 104_729);
      const game = new Game();
      const ref = new ffish.Board('xiangqi') as FfishBoard & { isCapture(uci: string): boolean };
      const played: string[] = [];
      const context = () => `search seed=${seed} moves=${played.join(' ')}`;
      const play = (uci: string): GameStatus => {
        game.move(uci);
        ref.push(uci);
        played.push(uci);
        return compare(game, ref, context);
      };
      try {
        const opening = 20 + Math.floor(rand() * 50);
        let status = compare(game, ref, context);
        while (status.kind === 'ongoing' && played.length < opening) {
          const legal = game.legalUci();
          const captures = legal.filter((uci) => ref.isCapture(uci));
          const pool = captures.length && rand() < 0.6 ? captures : legal;
          status = play(pool[Math.floor(rand() * pool.length)]!);
        }
        if (status.kind !== 'ongoing') continue;

        const quiet = (): string[] => ref.legalMoves().split(' ').filter((uci) => uci && !ref.isCapture(uci));
        const decisive: Array<[string, string]> = [];
        for (const a of quiet()) {
          ref.push(a);
          if (!ref.isGameOver(true)) {
            for (const b of quiet()) {
              let pushed = 0;
              for (const uci of [b, reverse(a), reverse(b), a, b, reverse(a), reverse(b)]) {
                if (pushed > 0 && (ref.isGameOver(true) || !ref.legalMoves().split(' ').includes(uci))) break;
                ref.push(uci);
                pushed++;
              }
              if (pushed === 7 && ref.isGameOver(true) && ref.result(true) !== '1/2-1/2') decisive.push([a, b]);
              for (; pushed > 0; pushed--) ref.pop();
            }
          }
          ref.pop();
        }
        if (!decisive.length) continue;

        const [a, b] = decisive[Math.floor(rand() * decisive.length)]!;
        for (const uci of [a, b, reverse(a), reverse(b), a, b, reverse(a), reverse(b)]) status = play(uci);
        endings.set(status.kind, (endings.get(status.kind) ?? 0) + 1);
      } finally {
        ref.delete();
      }
    }

    const tally = JSON.stringify([...endings]);
    expect(endings.get('perpetual-chase'), tally).toBeGreaterThan(0);
    expect(endings.get('perpetual-check'), tally).toBeGreaterThan(0);
  });
});
