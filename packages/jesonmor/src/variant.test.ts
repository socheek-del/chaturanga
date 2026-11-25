import { describeVariantConformance } from '@chaturanga/rules-core/testing';
import { describe, expect, it } from 'vitest';
import { BLACK_TO_MOVE_FEN } from './fen';
import { Game } from './game';
import { jesonMor } from './variant';

describeVariantConformance(
  jesonMor,
  {
    fens: [
      'n8/9/9/9/9/2N6/9/9/9 w - - 7 19 -',
      'n8/9/9/9/4N4/9/9/9/8n b - - 0 56 w',
      'n8/9/9/9/9/9/9/9/7N1 w - - 0 1 gw',
    ],
    invalidFens: [
      '',
      '8/9/9/9/9/9/9/9/NNNNNNNNN w - - 0 1 -',
      'nnnnnnnnn/9/9/9/9/9/9/9/NNNNNNNNN w KQ - 0 1 -',
      'nnnnnnnnn/9/9/9/9/9/9/9/NNNNNNNNN w - e3 0 1 -',
      'nnnnnnnnn/9/9/9/9/9/9/9/NNNNNNNNN w - - 0 1 queen',
      'n8/9/9/9/9/9/9/9/NNNNNNNNN w - - 0 1 w',
    ],
    illegalMoves: ['a1a3', 'a1b4', 'zz', 'N@e5'],
    terminal: {
      fen: 'n8/9/9/9/4N4/9/9/9/9 w - - 0 1 w',
      move: 'e5f7',
      status: { kind: 'goal-square', winner: 'w' },
    },
  },
  { seededGamesMs: 20_000, attackedSquaresMs: 20_000 },
);

describe('Jeson Mor start positions', () => {
  it('has nine horses per side on opposite home ranks and supports either first player', () => {
    const whiteFirst = new Game();
    const blackFirst = new Game(BLACK_TO_MOVE_FEN);
    expect(whiteFirst.pieces()).toHaveLength(18);
    expect(whiteFirst.turn).toBe('w');
    expect(blackFirst.turn).toBe('b');
    expect(whiteFirst.fen().split(' ')[0]).toBe('nnnnnnnnn/9/9/9/9/9/9/9/NNNNNNNNN');
    expect(whiteFirst.pieces().filter(({ piece }) => piece.color === 'w')).toHaveLength(9);
    expect(whiteFirst.pieces().filter(({ piece }) => piece.color === 'b')).toHaveLength(9);
  });
});
