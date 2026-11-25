import { describe, expect, it } from 'vitest';
import { type FfishBoard, loadFfish, mulberry32 } from '@chaturanga/rules-core/testing';
import { Game } from './game';
import { START_FEN } from './fen';

const RESULT: Record<string, string> = {
  ongoing: '*',
  stalemate: '1/2-1/2',
  repetition: '1/2-1/2',
  'fifty-move': '1/2-1/2',
};

function result(status: ReturnType<Game['status']>): string {
  if (status.kind === 'checkmate') return status.winner === 'w' ? '1-0' : '0-1';
  return RESULT[status.kind] ?? '1/2-1/2';
}

function compare(game: Game, reference: FfishBoard): void {
  expect(game.legalUci().slice().sort()).toEqual(reference.legalMoves().split(' ').filter(Boolean).sort());
  expect(game.fen()).toBe(reference.fen());
  expect(reference.isGameOver(true)).toBe(game.isGameOver());
  expect(reference.result(true)).toBe(result(game.status()));
}

describe('Crazyhouse rules against Fairy-Stockfish 0.7.10', () => {
  it('matches castling, en passant, promotion, drops, check evasion and promoted captures', async () => {
    const ffish = await loadFfish();
    const scenarios: Array<{ fen: string; moves: string[] }> = [
      { fen: 'r3k2r/8/8/8/8/8/8/R3K2R[] w KQkq - 0 1', moves: ['e1g1', 'e8c8'] },
      { fen: '4k3/8/8/3pP3/8/8/8/4K3[] w - d6 0 1', moves: ['e5d6'] },
      { fen: '4k3/P7/8/8/8/8/8/4K3[] w - - 0 1', moves: ['a7a8q', 'e8d7'] },
      { fen: '4k3/8/8/8/8/8/8/4K3[P] w - - 0 1', moves: ['P@e2', 'e8d8', 'e2e4'] },
      { fen: '4k3/8/8/8/8/8/8/4K3[B] w - - 0 1', moves: ['B@e4'] },
      { fen: 'k3r3/8/8/8/8/8/8/4K3[B] w - - 0 1', moves: ['B@e4'] },
      { fen: '4k3/8/8/3q~4/3R4/8/8/4K3[] w - - 0 1', moves: ['d4d5'] },
      { fen: '5N1k/8/4BK2/8/8/8/8/8[P] w - - 0 1', moves: ['P@g7'] },
    ];

    for (const { fen, moves } of scenarios) {
      const game = new Game(fen);
      const reference = new ffish.Board('crazyhouse', fen);
      try {
        compare(game, reference);
        for (const uci of moves) {
          expect(game.legalUci(), `${fen}: ${uci}`).toContain(uci);
          const san = reference.sanMove(uci);
          expect(game.move(uci).san, `${fen}: ${uci} SAN`).toBe(san);
          expect(reference.push(uci), `${fen}: ${uci} reference push`).toBe(true);
          compare(game, reference);
        }
      } finally {
        reference.delete();
      }
    }
  });

  it('matches 16 seeded games through captures, drops and endings', { timeout: 180_000 }, async () => {
    const ffish = await loadFfish();
    let drops = 0;
    let captures = 0;
    for (let seed = 1; seed <= 16; seed++) {
      const rand = mulberry32(seed);
      const game = new Game(START_FEN);
      const reference = new ffish.Board('crazyhouse', START_FEN);
      try {
        compare(game, reference);
        let plies = 0;
        while (!game.isGameOver() && plies < 180) {
          const legal = game.legalUci();
          const uci = legal[Math.floor(rand() * legal.length)]!;
          const san = reference.sanMove(uci);
          const record = game.move(uci);
          expect(san).toBe(record.san);
          if (uci.includes('@')) drops++;
          if (record.captured) captures++;
          const pushed = reference.push(uci);
          expect(pushed, `seed ${seed}, ply ${plies}, ${uci}`).toBe(true);
          compare(game, reference);
          plies++;
        }
      } finally {
        reference.delete();
      }
    }
    expect(drops).toBeGreaterThan(0);
    expect(captures).toBeGreaterThan(0);
  });
});
