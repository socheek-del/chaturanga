/**
 * Plays seeded random Xiangqi games in lock-step with Fairy-Stockfish (ffish) and compares legal
 * moves, SAN and FEN after every ply (xq-001). Full game-end adjudication (stalemate, perpetual
 * check/chase, the 60-move rule) is xq-002, so the loop stops as soon as ffish considers the game
 * over rather than asserting anything about this engine's own (not yet complete) status().
 */
import { describe, expect, it } from 'vitest';
import { Game } from './game';
import { type FfishBoard, loadFfish, mulberry32, normalizeFen } from './testing/ffish';

const GAMES = process.env.PERFT_DEEP === '1' ? 400 : 60;
const MAX_PLIES = 300;

function compare(game: Game, ref: FfishBoard, context: () => string): void {
  const ours = game.legalUci().slice().sort();
  expect(ours, `legal moves ${context()}`).toEqual(ref.legalMoves().split(' ').filter(Boolean).sort());
  expect(normalizeFen(game.fen()), `fen ${context()}`).toBe(ref.fen());
}

describe('lock-step random games vs Fairy-Stockfish (xq-001)', () => {
  it(`${GAMES} seeded games agree on every ply`, { timeout: 600_000 }, async () => {
    const ffish = await loadFfish();
    let captures = 0;
    let checks = 0;

    for (let seed = 1; seed <= GAMES; seed++) {
      const rand = mulberry32(seed);
      const game = new Game();
      const ref = new ffish.Board('xiangqi');
      const played: string[] = [];
      const context = () => `seed=${seed} moves=${played.join(' ')}`;
      try {
        compare(game, ref, context);
        while (!ref.isGameOver(true) && played.length < MAX_PLIES) {
          const legal = game.legalUci();
          const uci = legal[Math.floor(rand() * legal.length)]!;
          const san = ref.sanMove(uci);
          const record = game.move(uci);
          expect(record.san, `san of ${uci} ${context()}`).toBe(san);
          ref.push(uci);
          played.push(uci);
          if (record.captured) captures++;
          if (record.san.includes('+') || record.san.includes('#')) checks++;
          compare(game, ref, context);
        }
      } finally {
        ref.delete();
      }
    }

    expect(captures).toBeGreaterThan(0);
    expect(checks).toBeGreaterThan(0);
  });
});
