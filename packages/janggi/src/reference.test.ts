/**
 * Plays seeded random Janggi games in lock-step with Fairy-Stockfish (ffish) and compares legal moves, SAN,
 * FEN and the game result after every ply (jg-001, jg-002), from all sixteen start positions. Half the games
 * use a picker that steps back and forth, gives check, passes and faces the generals far more often than
 * chance, so repetitions, perpetual checks, double passes and bikjang actually happen.
 */
import { describe, expect, it } from 'vitest';
import { START_FENS } from './fen';
import { Game, PASS_SAN } from './game';
import type { GameStatus } from './types';
import { type FfishBoard, loadFfish, mulberry32 } from './testing/ffish';

const GAMES = process.env.PERFT_DEEP === '1' ? 400 : 60;
const ENDGAMES = process.env.PERFT_DEEP === '1' ? 2000 : 300;
const MAX_PLIES = 400;

/** What ffish's `result(true)` prints for a status. */
function resultString(status: GameStatus): string {
  if (status.kind === 'ongoing') return '*';
  if ('winner' in status && status.winner) return status.winner === 'w' ? '1-0' : '0-1';
  return '1/2-1/2';
}

function compare(game: Game, ref: FfishBoard, context: () => string): GameStatus {
  const status = game.status();
  expect(status.kind !== 'ongoing', `game over (${status.kind}) ${context()}`).toBe(ref.isGameOver(true));
  expect(resultString(status), `result (${status.kind}) ${context()}`).toBe(ref.result(true));
  // ffish lists no moves once a game has ended immediately.
  if (status.kind !== 'bikjang' && status.kind !== 'double-pass')
    expect(game.legalUci().sort(), `legal moves ${context()}`).toEqual(ref.legalMoves().split(' ').filter(Boolean).sort());
  expect(game.fen(), `fen ${context()}`).toBe(ref.fen());
  return status;
}

const reverse = (uci: string): string => {
  const m = /^([a-i]\d{1,2})([a-i]\d{1,2})$/.exec(uci)!;
  return m[2]! + m[1]!;
};

function pickMove(game: Game, played: readonly string[], rand: () => number, biased: boolean): string {
  const legal = game.legalUci();
  const any = (list: readonly string[]) => list[Math.floor(rand() * list.length)]!;
  if (biased) {
    const own = played.at(-2);
    if (own && rand() < 0.5 && legal.includes(reverse(own))) return reverse(own);
    const roll = rand();
    if (roll < 0.06) return game.passMove() ?? any(legal);
    if (roll < 0.4) {
      const wanted = legal.filter((uci) => {
        const record = game.move(uci);
        const hit = record.san.includes('+') || (!uci.startsWith(uci.slice(uci.length / 2)) && game.isBikjang());
        game.undo();
        return hit;
      });
      if (wanted.length) return any(wanted);
    }
  }
  return any(legal);
}

describe('lock-step games vs Fairy-Stockfish (jg-001, jg-002)', () => {
  const endings = new Map<string, number>();

  async function playOut(fen: string, seed: number, biased: boolean): Promise<void> {
    const ffish = await loadFfish();
    const rand = mulberry32(seed);
    const game = new Game(fen);
    const ref = new ffish.Board('janggi', fen);
    const played: string[] = [];
    const context = () => `seed=${seed} fen=${fen} moves=${played.join(' ')}`;
    try {
      let status = compare(game, ref, context);
      while (status.kind === 'ongoing' && played.length < MAX_PLIES) {
        const uci = pickMove(game, played, rand, biased);
        const san = ref.sanMove(uci);
        const record = game.move(uci);
        if (record.san.startsWith(PASS_SAN)) expect(san).toMatch(/^Ke?\w+/);
        else expect(record.san, `san of ${uci} ${context()}`).toBe(san);
        ref.push(uci);
        played.push(uci);
        status = compare(game, ref, context);
      }
      endings.set(status.kind, (endings.get(status.kind) ?? 0) + 1);
    } finally {
      ref.delete();
    }
  }

  it(`${GAMES} games from the opening arrangements agree on every ply`, { timeout: 1_800_000 }, async () => {
    for (let seed = 1; seed <= GAMES; seed++) await playOut(START_FENS[seed % 16]!, seed, seed % 2 === 0);
  });

  it(`${ENDGAMES} games from sparse random positions agree on every ply`, { timeout: 1_800_000 }, async () => {
    const ffish = await loadFfish();
    for (let seed = 1; seed <= ENDGAMES; seed++) {
      const rand = mulberry32(seed * 7919);
      // A capture-heavy opening thins the board so mates, checks and facing generals are near.
      const ref = new ffish.Board('janggi') as FfishBoard & { isCapture(uci: string): boolean };
      const plies = 30 + Math.floor(rand() * 60);
      for (let i = 0; i < plies && !ref.isGameOver(true); i++) {
        const legal = ref.legalMoves().split(' ');
        const captures = legal.filter((uci) => ref.isCapture(uci));
        const pool = captures.length && rand() < 0.8 ? captures : legal;
        ref.push(pool[Math.floor(rand() * pool.length)]!);
      }
      const over = ref.isGameOver(true);
      const fen = ref.fen();
      ref.delete();
      if (!over) await playOut(fen, seed, true);
    }
  });

  it('reached every kind of ending', () => {
    const tally = JSON.stringify([...endings]);
    for (const kind of ['checkmate', 'bikjang', 'double-pass', 'repetition', 'perpetual-check', 'fifty-move']) {
      expect(endings.get(kind), `${kind} in ${tally}`).toBeGreaterThan(0);
    }
    console.log(tally);
  });
});
