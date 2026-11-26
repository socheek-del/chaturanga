import { describe, expect, it } from 'vitest';
import { Game, PLAYERS, createSeededStartFen } from '@chaturanga/chaturaji';
import { BOT_LEVELS, chooseMove } from './index';

describe('Chaturaji bots', () => {
  it('returns a reproducible legal fallback at a zero-node budget', () => {
    const game = new Game(createSeededStartFen(42));
    const options = { seed: 55, maxNodes: 0 };
    const first = chooseMove(game.fen(), options);
    expect(first).toBe(chooseMove(game.fen(), options));
    expect(game.legalUci()).toContain(first);
  });

  it('returns legal actions for every bot level and every seat', () => {
    for (let seatIndex = 0; seatIndex < PLAYERS.length; seatIndex++) {
      const game = new Game(createSeededStartFen(100 + seatIndex));
      while (game.activeArmy !== PLAYERS[seatIndex]) {
        game.move('pass'); game.move('pass');
        game.prepareTurn(500 + seatIndex);
      }
      for (const bot of BOT_LEVELS) {
        const move = chooseMove(game.fen(), { seed: 900 + seatIndex, level: bot.level });
        expect(game.legalUci(), `seat ${PLAYERS[seatIndex]}, level ${bot.level}`).toContain(move);
      }
    }
  });

  it('plays through all four seat turns, including future seeded rolls', () => {
    const game = new Game(createSeededStartFen(7));
    const seen = new Set<string>();
    for (let step = 0; step < 16; step++) {
      if (game.dice === null) game.prepareTurn(1000 + step);
      seen.add(game.activeArmy);
      const move = chooseMove(game.fen(), { seed: step * 31 + 2, level: 3, maxNodes: 180 });
      expect(game.legalUci()).toContain(move);
      game.move(move!);
    }
    expect([...seen].sort()).toEqual([...PLAYERS].sort());
  });

  it('does not ask the bot to choose a chance event or a move after game end', () => {
    const game = new Game(createSeededStartFen(18));
    game.move('pass'); game.move('pass');
    expect(chooseMove(game.fen(), { seed: 1 })).toBeNull();
  });
});
