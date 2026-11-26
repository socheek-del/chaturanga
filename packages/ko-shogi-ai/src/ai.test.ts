import { describe, expect, it } from 'vitest';
import { Game, koShogi, parseFen, positionKey as rulesPositionKey } from '@chaturanga/ko-shogi';
import { BOTS, KoShogiSearch, chooseMove, mulberry32, positionKey } from './index';

describe('Ko Shogi bot search', () => {
  it('exposes six increasing deterministic budgets', () => {
    expect(BOTS).toHaveLength(6);
    expect(BOTS.map(({ maxNodes }) => maxNodes)).toEqual([...BOTS.map(({ maxNodes }) => maxNodes)].sort((a, b) => a - b));
    expect(BOTS.every(({ maxDepth, maxNodes, timeMs }) => maxDepth === 1 && maxNodes > 0 && timeMs > 0)).toBe(true);
  });

  it('returns deterministic legal moves for both seats without changing the root game', () => {
    const game = new Game();
    const result = chooseMove(game.fen(), 1, { game, ignoreTime: true, rng: mulberry32(5) });
    expect(result).not.toBeNull();
    expect(game.searchCandidates(BOTS[0]!.maxRootMoves, BOTS[0]!.maxMovesPerPiece).map(({ uci }) => uci)).toContain(result!.uci);
    expect(chooseMove(game.fen(), 1, { game, ignoreTime: true, rng: mulberry32(5) })).toEqual(result);
    expect(game.fen()).toBe(koShogi.startFen);

    game.move(result!.uci);
    const master = { ...BOTS[5]!, maxRootMoves: 96, maxMovesPerPiece: 8 };
    const reply = chooseMove(game.fen(), master, { game, ignoreTime: true, rng: mulberry32(12) });
    expect(reply).not.toBeNull();
    expect(game.searchCandidates(master.maxRootMoves, master.maxMovesPerPiece).map(({ uci }) => uci)).toContain(reply!.uci);
  });

  it('restores the live game after search make/unmake and keeps FEN keys compatible with the rules engine', () => {
    const game = new Game();
    const adapter = new KoShogiSearch(game);
    const before = adapter.key();
    const code = adapter.legalMoves()[0]!;
    adapter.make(code);
    expect(adapter.key()).not.toBe(before);
    adapter.unmake();
    expect(adapter.key()).toBe(before);
    expect(positionKey(game.fen())).toBe(rulesPositionKey(parseFen(game.fen())));
    expect(game.fen()).toBe(koShogi.startFen);
  });

  it('makes a bounded legal choice for every level as White and Black', () => {
    const white = new Game();
    const black = new Game();
    black.move(black.legalUci()[0]!);
    for (const original of [white, black]) {
      for (const bot of BOTS) {
        const game = new Game(original.fen());
        const result = chooseMove(game.fen(), { ...bot, maxDepth: 1, maxNodes: 96, maxRootMoves: 48, maxMovesPerPiece: 6, timeMs: 50, noise: 0, blunderRate: 0 }, {
          game, ignoreTime: true, rng: () => 0.9,
        });
        expect(result).not.toBeNull();
        expect(game.searchCandidates(48, 6).map(({ uci }) => uci)).toContain(result!.uci);
        expect(game.fen()).toBe(original.fen());
      }
    }
  });
});
