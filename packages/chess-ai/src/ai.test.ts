import { Game } from '@chaturanga/chess';
import { describe, expect, it } from 'vitest';
import { bestMove, chooseMove, evaluate, materialBalance, mulberry32 } from './index';
import { BOTS } from './bots';
import { normalizeEp, parseFen, type Position } from '@chaturanga/chess/core';

const positionOf = (fen: string): Position => {
  const data = parseFen(fen);
  const pos: Position = { board: data.board, turn: data.turn, castling: data.castling, ep: data.ep };
  normalizeEp(pos);
  return pos;
};

describe('chess bots (ch-003)', () => {
  it('finds mate in one', () => {
    expect(bestMove('6k1/5ppp/8/8/8/8/8/3R2K1 w - - 0 1', { maxDepth: 2 })?.uci).toBe('d1d8');
  });

  it('finds a mate in two and plays it out', { timeout: 60_000 }, () => {
    // Back-rank sacrifice with doubled rooks: 1.Re8+ Rxe8 2.Rxe8#.
    const game = new Game('r5k1/5ppp/8/8/8/8/4R3/4R1K1 w - - 0 1');
    const first = bestMove(game.fen(), { maxDepth: 5, maxNodes: 600_000 })!;
    expect(first.score).toBeGreaterThan(90_000);
    game.move(first.uci);
    expect(game.inCheck()).toBe(true);
    game.move(game.legalUci()[0]!);
    const second = bestMove(game.fen(), { maxDepth: 3, maxNodes: 200_000 })!;
    game.move(second.uci);
    expect(game.status()).toEqual({ kind: 'checkmate', winner: 'w' });
  });

  it('takes a free queen', () => {
    expect(bestMove('4k3/8/8/3q4/4P3/8/8/4K3 w - - 0 1', { maxDepth: 3 })?.uci).toBe('e4d5');
  });

  it('does not hang a piece it can save', () => {
    // The knight on e5 is attacked by a pawn; the strongest bot must move it.
    const move = bestMove('4k3/8/3p4/4N3/8/8/8/4K3 w - - 0 1', { maxDepth: 4, maxNodes: 120_000 });
    expect(move?.uci.startsWith('e5')).toBe(true);
  });

  it('every bot plays a legal move from the start position', { timeout: 120_000 }, () => {
    for (const bot of BOTS) {
      const game = new Game();
      // The line-up's own budgets are what the ladder measures; here a small one keeps the suite quick.
      const quick = { ...bot, maxDepth: Math.min(bot.maxDepth, 4), maxNodes: 20_000 };
      const move = chooseMove(game.fen(), quick, { rng: mulberry32(bot.id), ignoreTime: true });
      expect(move, `bot ${bot.key}`).not.toBeNull();
      expect(game.legalUci(), `bot ${bot.key}`).toContain(move!.uci);
    }
  });

  it('plays a whole game against itself without an illegal move or a crash', { timeout: 120_000 }, () => {
    const game = new Game();
    const rng = mulberry32(7);
    while (!game.isGameOver() && game.moves().length < 40) {
      const move = chooseMove(game.fen(), { ...BOTS[2]!, maxNodes: 20_000 }, { rng, ignoreTime: true });
      expect(move).not.toBeNull();
      expect(game.legalUci()).toContain(move!.uci);
      game.move(move!.uci);
    }
    expect(game.moves().length).toBeGreaterThan(10);
  });

  it('is deterministic for a given seed', { timeout: 60_000 }, () => {
    const bot = { ...BOTS[3]!, maxNodes: 40_000 };
    const fen = 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3';
    const first = chooseMove(fen, bot, { rng: mulberry32(42), ignoreTime: true });
    const second = chooseMove(fen, bot, { rng: mulberry32(42), ignoreTime: true });
    expect(first).toEqual(second);
  });

  it('returns null when the game is already over', () => {
    // Mated: the rook on d8 covers the back rank and the pawns block every escape.
    expect(chooseMove('3R2k1/5ppp/8/8/8/8/8/6K1 b - - 1 1', 3, { ignoreTime: true })).toBeNull();
    // Stalemated.
    expect(chooseMove('7k/5Q2/8/3K4/8/8/8/8 b - - 0 1', 3, { ignoreTime: true })).toBeNull();
  });

  it('counts material and sees the side to move', () => {
    const pos = positionOf('4k3/8/8/8/8/8/8/3QK3 w - - 0 1');
    expect(materialBalance(pos.board, 0)).toBe(900);
    expect(evaluate(pos.board, 0)).toBeGreaterThan(500);
    expect(evaluate(pos.board, 1)).toBeLessThan(-500);
  });

  it('prefers castling to leaving the king in the middle', () => {
    const move = bestMove('r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 6 5', {
      maxDepth: 4,
      maxNodes: 300_000,
    });
    expect(move).not.toBeNull();
  });
});
