import { describe, expect, it } from 'vitest';
import { Game } from '@chaturanga/crazyhouse';
import { BOTS } from './bots';
import { bestMove, chooseMove, fenKey, mulberry32 } from './index';
import { CrazyhouseSearch } from './adapter';

describe('Crazyhouse bots', () => {
  it('every bot chooses a legal move as White and Black, with and without pockets', { timeout: 120_000 }, () => {
    const positions = [
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR[] w KQkq - 0 1',
      '4k3/8/8/8/8/8/8/4K3[QRBNPqrbnp] w - - 0 1',
      '4k3/8/8/8/8/8/8/4K3[QRBNPqrbnp] b - - 0 1',
    ];
    for (const [positionIndex, fen] of positions.entries()) {
      const game = new Game(fen);
      for (const bot of BOTS) {
        const quick = { ...bot, maxDepth: Math.min(3, bot.maxDepth), maxNodes: 2_500, timeMs: 350 };
        const chosen = chooseMove(fen, quick, { rng: mulberry32(bot.id + positionIndex), ignoreTime: true });
        expect(chosen, `${bot.key} from position ${positionIndex}`).not.toBeNull();
        expect(game.legalUci(), `${bot.key} legality`).toContain(chosen!.uci);
      }
    }
  });

  it('finds a mating pawn drop', { timeout: 30_000 }, () => {
    const fen = '5N1k/8/4BK2/8/8/8/8/8[P] w - - 0 1';
    const move = bestMove(fen, { maxDepth: 3, maxNodes: 30_000 });
    expect(move?.uci).toBe('P@g7');
    const game = new Game(fen);
    game.move(move!.uci);
    expect(game.status()).toEqual({ kind: 'checkmate', winner: 'w' });
  });

  it('uses pocket material and includes pockets and provenance in repetition keys', () => {
    const boardOnly = '4k3/8/8/8/8/8/8/4K3[] w - - 0 1';
    const withPocket = '4k3/8/8/8/8/8/8/4K3[N] w - - 0 1';
    const promoted = '4k3/8/8/8/8/8/8/3Q~K3[] w - - 0 1';
    expect(fenKey(boardOnly)).not.toBe(fenKey(withPocket));
    expect(fenKey(boardOnly)).not.toBe(fenKey(promoted));
    const adapter = new CrazyhouseSearch(withPocket);
    expect(adapter.evaluate()).toBeGreaterThan(new CrazyhouseSearch(boardOnly).evaluate());
  });

  it('respects its node budget and is deterministic under a seed', () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR[] w KQkq - 0 1';
    const persona = { ...BOTS[2]!, maxDepth: 5, maxNodes: 1_024, timeMs: 1_000 };
    const options = { rng: mulberry32(42), ignoreTime: true };
    const first = chooseMove(fen, persona, options);
    const second = chooseMove(fen, persona, { rng: mulberry32(42), ignoreTime: true });
    expect(first).toEqual(second);
    expect(first).not.toBeNull();
    expect(first!.nodes).toBeLessThan(1_536);
  });

  it('returns no move for a checkmate or stalemate', () => {
    expect(chooseMove('3R2k1/5ppp/8/8/8/8/8/6K1[] b - - 1 1', 3, { ignoreTime: true })).toBeNull();
    expect(chooseMove('7k/5Q2/8/3K4/8/8/8/8[] b - - 0 1', 3, { ignoreTime: true })).toBeNull();
  });
});
