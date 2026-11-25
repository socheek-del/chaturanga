import { describe, expect, it } from 'vitest';
import { FILES, Game, RANKS, square, START_FEN } from '@chaturanga/shatra';
import { chooseMove } from './index';

function fen(pieces: Record<string, string>, turn = 'w'): string {
  const rows = Array.from({ length: RANKS }, () => Array<string>(FILES).fill('.'));
  for (const [name, piece] of Object.entries(pieces)) {
    const target = square(name);
    const rank = Math.floor(target / FILES);
    rows[RANKS - 1 - rank]![target % FILES] = piece;
  }
  return `${rows.map((row) => row.join('').replace(/\.+/g, (empty) => String(empty.length))).join('/')} ${turn} - 0 1`;
}

describe('Shatra bot', () => {
  it('returns a legal move from the tournament start within a fixed node budget', () => {
    const game = new Game();
    const move = chooseMove(START_FEN, [], { maxNodes: 256 });
    expect(move).not.toBeNull();
    expect(game.legalUci()).toContain(move);
  });

  it('takes the opposing Biy when it is the only legal move', () => {
    const position = fen({ c1: 'K', d5: 'S', d6: 'k' });
    expect(chooseMove(position, [], { maxNodes: 64 })).toBe('d5d7');
  });

  it('replays the room move list before choosing a response', () => {
    const move = chooseMove(START_FEN, ['d6d7'], { maxNodes: 128 });
    const game = new Game(START_FEN);
    game.move('d6d7');
    expect(game.legalUci()).toContain(move);
  });
});
