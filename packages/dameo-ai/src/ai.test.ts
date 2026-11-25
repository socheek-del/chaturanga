import { Game, START_FEN, square } from '@chaturanga/dameo';
import { describe, expect, it } from 'vitest';
import { BOTS, bestMove, chooseMove, DameoSearch, mulberry32 } from './index';

function fen(pieces: Record<string, string>, turn = 'w'): string {
  const rows = Array.from({ length: 8 }, () => Array<string>(8).fill('.'));
  for (const [name, token] of Object.entries(pieces)) {
    const file = name.charCodeAt(0) - 97;
    const rank = Number(name.slice(1)) - 1;
    rows[7 - rank]![file] = token;
  }
  const placement = rows.map((row) => row.join('').replace(/\.+/g, (empty) => String(empty.length))).join('/');
  return `${placement} ${turn}`;
}

const forcedWin = fen({ e4: 'M', e5: 'm' });
const majorityCapture = fen({ e4: 'M', a1: 'M', e5: 'm', e7: 'm', a2: 'm' });
const noMoves = fen({ a8: 'M', h1: 'm' });

describe('six bounded Dameo bot levels', () => {
  it.each(BOTS.flatMap((bot) => [
    [`${bot.key} as White`, bot.id, START_FEN] as const,
    [`${bot.key} as Black`, bot.id, START_FEN.replace(/ w$/, ' b')] as const,
  ]))('%s chooses a legal route within a fixed node budget', (_label, id, position) => {
    const game = new Game(position);
    const move = chooseMove(position, id, {
      rng: () => 0.999,
      ignoreTime: true,
      maxDepth: 2,
      maxNodes: 700,
    });
    expect(move).not.toBeNull();
    expect(game.legalUci()).toContain(move!.uci);
    expect(move!.nodes).toBeLessThan(1_600);
  });

  it('finds an immediate elimination and obeys mandatory maximum captures', () => {
    const winning = bestMove(forcedWin, { maxDepth: 1, maxNodes: 1_200 });
    expect(winning?.uci).toBe('e4e6');
    expect(new Game(forcedWin).legalUci()).toEqual(['e4e6']);

    const game = new Game(majorityCapture);
    const search = new DameoSearch(game);
    expect(search.legalMoves().map((move) => search.decode(move))).toEqual(['e4e6e8']);
    expect(bestMove(majorityCapture, { maxDepth: 1, maxNodes: 1_200 })?.uci).toBe('e4e6e8');
    expect(game.pieceAt(square('e5'))).toMatchObject({ color: 'b', type: 'm' });
  });

  it('preserves complete line and capture routes in search move identifiers', () => {
    const position = fen({ b2: 'M', c3: 'M', h8: 'm' });
    const search = new DameoSearch(new Game(position));
    const decoded = search.legalMoves().map((move) => search.decode(move));
    expect(decoded).toContain('b2c3d4');
    expect(decoded).toContain('c3d4');
  });

  it('uses seeded choices reproducibly and restores a supplied live game after search', () => {
    const first = chooseMove(START_FEN, 3, { rng: mulberry32(42), ignoreTime: true, maxNodes: 1_200 });
    const second = chooseMove(START_FEN, 3, { rng: mulberry32(42), ignoreTime: true, maxNodes: 1_200 });
    expect(first?.uci).toBe(second?.uci);

    const game = new Game(START_FEN);
    const before = game.fen();
    const choice = bestMove(before, { game, maxDepth: 2, maxNodes: 1_500 });
    expect(new Game(before).legalUci()).toContain(choice?.uci);
    expect(game.fen()).toBe(before);
    expect(() => bestMove(forcedWin, { game })).toThrow('options.game is not on the given position');
  });

  it('returns a legal blunder when a beginner bot blunders and null when play has ended', () => {
    const legal = new Game(START_FEN).legalUci();
    const blunder = chooseMove(START_FEN, 1, { rng: () => 0, ignoreTime: true });
    expect(legal).toContain(blunder?.uci);
    expect(chooseMove(noMoves, 3, { ignoreTime: true })).toBeNull();
  });
});
