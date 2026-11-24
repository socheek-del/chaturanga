import { Game, hexAt, RADIUS, SIZE, parseSquare, type Player } from '@chaturanga/threechess';
import { describe, expect, it } from 'vitest';
import { chooseMove } from './index';

const seats = ['w', 'b', 'r'] as const;

function matePosition(player: Player, victim: Player, eliminated: Player): string {
  const cells = Array.from({ length: SIZE * SIZE }, (_, square): string =>
    hexAt(square % SIZE - RADIUS, Math.floor(square / SIZE) - RADIUS) === null ? '.' : '-');
  cells[parseSquare('f1')!] = victim + 'k';
  cells[parseSquare('h1')!] = player + 'k';
  cells[parseSquare('i1')!] = player + 'q';
  const rows = Array.from({ length: SIZE }, (_, row) => cells.slice(row * SIZE, (row + 1) * SIZE).join(','));
  return `${rows.join('/')} ${player} - ${eliminated} -`;
}

describe('Three-player Chess bots', () => {
  it('uses a legal fallback at a zero node budget', () => {
    const game = new Game();
    expect(game.legalUci()).toContain(chooseMove(game.fen(), { maxNodes: 0 }));
  });

  it('plays legal moves for all seats in a deterministic opening', () => {
    const game = new Game();
    const positions = [game.fen()];
    for (let ply = 0; ply < 9; ply++) {
      const move = chooseMove(game.fen(), { maxNodes: 200, earlierFens: positions });
      expect(game.legalUci()).toContain(move);
      game.move(move!);
      positions.push(game.fen());
    }
    expect(game.moves().slice(0, 3).map(({ color }) => color)).toEqual(seats);
  });

  it.each(seats)('wins a forced mate as %s and stops at the result', (human) => {
    const index = seats.indexOf(human);
    const fen = matePosition(human, seats[(index + 1) % 3]!, seats[(index + 2) % 3]!);
    const game = new Game(fen);
    const move = chooseMove(fen, { maxNodes: 500 });
    expect(move).not.toBeNull();
    game.move(move!);
    expect(game.status()).toEqual({ kind: 'checkmate', winner: human });
    expect(chooseMove(game.fen())).toBeNull();
  });
});
