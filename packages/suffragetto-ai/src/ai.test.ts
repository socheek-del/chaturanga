import { ALBERT_HALL, Game, HOUSE_OF_COMMONS, POLICE_START_FEN, START_FEN, squareAt } from '@chaturanga/suffragetto';
import { describe, expect, it } from 'vitest';
import { BOTS, bestMove, chooseMove, mulberry32, SuffragettoSearch } from './index';

function fen(pieces: Record<string, string>, turn = 'w'): string {
  const rows = Array.from({ length: 17 }, () => Array<string>(17).fill('.'));
  for (const [name, token] of Object.entries(pieces)) {
    const file = name.charCodeAt(0) - 97;
    const rank = Number(name.slice(1)) - 1;
    rows[16 - rank]![file] = token;
  }
  const placement = rows.map((row) => row.join('').replace(/\.+/g, (empty) => String(empty.length))).join('/');
  return `${placement} ${turn}`;
}

const goalFinish = fen({
  g12: 'S', h14: 'S', i14: 'S', j14: 'S', i13: 'S', j13: 'S', o15: 'p',
});

describe('six bounded Suffragetto bot levels', () => {
  it.each(BOTS.flatMap((bot) => [
    [`${bot.key} as Suffragettes`, bot.id, START_FEN] as const,
    [`${bot.key} as Police`, bot.id, POLICE_START_FEN] as const,
  ]))('%s returns a legal move inside the fixed node budget', (_label, id, position) => {
    const move = chooseMove(position, id, {
      rng: () => 0.999, ignoreTime: true, maxDepth: 2, maxNodes: 600,
    });
    expect(move).not.toBeNull();
    expect(new Game(position).legalUci()).toContain(move!.uci);
    expect(move!.nodes).toBeLessThan(1_200);
  });

  it('chooses an immediate six-piece goal win', () => {
    const move = bestMove(goalFinish, { maxDepth: 1, maxNodes: 1_200 });
    expect(move?.uci).toBe('g12h13');
    const game = new Game(goalFinish);
    game.move(move!.uci);
    expect(game.status()).toEqual({ kind: 'goal-square', winner: 'w' });
  });

  it('prefers an available Arena capture and transfers the disabled piece', () => {
    const position = fen({ e5: 'S', f6: 'p', o15: 'i' });
    const move = bestMove(position, { maxDepth: 1, maxNodes: 1_200 });
    expect(move?.uci).toBe('e5g7');
    const game = new Game(position);
    game.move(move!.uci);
    expect(game.pieceAt(squareAt('p', 1))).toMatchObject({ color: 'b', type: 'p' });
  });

  it('keeps explicit exchange actions available to the search', () => {
    const pieces: Record<string, string> = {};
    for (let index = 0; index < 12; index++) {
      const prisonCell = squareAt('a', index + 1);
      const hospitalCell = squareAt('q', index + 1);
      const name = (target: number) => `${String.fromCharCode(97 + target % 17)}${Math.floor(target / 17) + 1}`;
      pieces[name(prisonCell)] = index < 5 ? 'L' : 'S';
      pieces[name(hospitalCell)] = index < 5 ? 'i' : 'p';
    }
    const position = fen(pieces);
    const search = new SuffragettoSearch(new Game(position));
    const moves = search.legalMoves().map((move) => search.decode(move));
    expect(moves).toContain('X60@b1');
  });

  it('uses a seeded choice reproducibly and restores a supplied live game', () => {
    const first = chooseMove(START_FEN, 3, { rng: mulberry32(37), ignoreTime: true, maxNodes: 1_200 });
    const second = chooseMove(START_FEN, 3, { rng: mulberry32(37), ignoreTime: true, maxNodes: 1_200 });
    expect(first?.uci).toBe(second?.uci);

    const game = new Game(START_FEN);
    const before = game.fen();
    const chosen = bestMove(before, { game, maxDepth: 2, maxNodes: 1_200 });
    expect(new Game(before).legalUci()).toContain(chosen?.uci);
    expect(game.fen()).toBe(before);
  });

  it('returns null when the position is already a goal win', () => {
    const pieces: Record<string, string> = {};
    for (const square of HOUSE_OF_COMMONS) {
      const file = String.fromCharCode(97 + square % 17);
      const rank = Math.floor(square / 17) + 1;
      pieces[`${file}${rank}`] = 'S';
    }
    pieces[`${String.fromCharCode(97 + ALBERT_HALL[0]! % 17)}${Math.floor(ALBERT_HALL[0]! / 17) + 1}`] = 'p';
    expect(chooseMove(fen(pieces), 2, { ignoreTime: true })).toBeNull();
  });
});
