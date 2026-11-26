import { describe, expect, it } from 'vitest';
import { Game, parseSquare, PLAYERS, type Player, type PieceType } from '@chaturanga/fourchess';
import { chooseMove } from './index';

interface FixturePiece {
  square: string;
  color: Player;
  type: PieceType;
}

function fen(pieces: readonly FixturePiece[], eliminated = 'yg', checks = '----'): string {
  const board = Array.from({ length: 196 }, () => '-');
  for (let square = 0; square < 196; square++) {
    const file = square % 14;
    const rank = Math.floor(square / 14);
    if (!(file >= 3 && file <= 10) && !(rank >= 3 && rank <= 10)) board[square] = '.';
  }
  for (const piece of pieces) board[parseSquare(piece.square)!] = piece.color + piece.type;
  const rows = Array.from({ length: 14 }, (_, row) => board.slice((13 - row) * 14, (14 - row) * 14).join(','));
  return `${rows.join('/')} r - - ${eliminated} r=0,b=0,y=0,g=0 0 ${checks} -`;
}

describe('Four-handed chess bots', () => {
  it('returns a deterministic legal fallback at a zero-node budget', () => {
    const game = new Game();
    const first = chooseMove(game.fen(), { seed: 19, maxNodes: 0 });
    expect(first).toBe(chooseMove(game.fen(), { seed: 19, maxNodes: 0 }));
    expect(game.legalUci()).toContain(first);
  });

  it('chooses the available Queen capture with a shallow search', () => {
    const board = new Game(fen([
      { square: 'h1', color: 'r', type: 'k' },
      { square: 'a11', color: 'b', type: 'k' },
      { square: 'e4', color: 'r', type: 'r' },
      { square: 'e8', color: 'b', type: 'q' },
    ]));
    expect(chooseMove(board.fen(), { seed: 3, maxNodes: 500 })).toBe('e4e8');
  });

  it('plays legal moves for each of the four seats', () => {
    const game = new Game();
    for (let ply = 0; ply < 8; ply++) {
      const current = game.turn;
      const move = chooseMove(game.fen(), { seed: 900 + ply, maxNodes: 80 });
      expect(game.legalUci()).toContain(move);
      game.move(move!);
      expect(current).toBe(PLAYERS[ply % PLAYERS.length]);
    }
  });

  it('returns no move after the game has ended', () => {
    const game = new Game(fen([
      { square: 'h1', color: 'r', type: 'k' },
      { square: 'a11', color: 'b', type: 'k' },
      { square: 'h14', color: 'b', type: 'r' },
      { square: 'g14', color: 'b', type: 'r' },
      { square: 'i14', color: 'b', type: 'r' },
    ], 'yg', 'b---'));
    expect(game.isGameOver()).toBe(true);
    expect(chooseMove(game.fen(), { seed: 1 })).toBeNull();
  });
});
