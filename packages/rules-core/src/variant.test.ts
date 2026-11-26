import { describe, expect, it } from 'vitest';
import { IllegalMoveError } from './errors';
import { activePlayers, legalUciFor, moveFor, replayVariantMoves, type Variant, type VariantGame, type VariantMoveRecord } from './variant';

function record(color: string, uci: string): VariantMoveRecord<string> {
  return { color, uci, san: uci, piece: { color, type: 'p', promoted: false }, captured: null, to: 0, fenAfter: uci };
}

function concurrentGame() {
  let moves: VariantMoveRecord<string>[] = [];
  const game = {
    turn: 'w',
    activePlayers: () => (moves.length < 2 ? ['w', 'b'] : ['w']),
    legalUci: () => ['a1a2'],
    legalUciFor: (color: string) => (color === 'w' || color === 'b' ? ['a1a2'] : []),
    move: (uci: string) => {
      const next = record('w', uci);
      moves = [...moves, next];
      return next;
    },
    moveFor: (color: string, uci: string) => {
      if (!game.activePlayers().includes(color) || !game.legalUciFor(color).includes(uci)) throw new IllegalMoveError(uci);
      const next = record(color, uci);
      moves = [...moves, next];
      return next;
    },
    moves: () => moves,
    fen: () => String(moves.length),
    pieceAt: () => null,
    pieces: () => [],
    hand: () => [],
    undo: () => null,
    lastMove: () => moves.at(-1) ?? null,
    status: () => ({ kind: 'ongoing' as const }),
    isGameOver: () => false,
    inCheck: () => false,
    checkedKingSquare: () => null,
    attackedSquares: () => [],
    counting: () => null,
  } satisfies Partial<VariantGame<string>>;
  return game as VariantGame<string>;
}

describe('actor-aware variant helpers (plat-023)', () => {
  it('defaults active seats and legal actions to the traditional side to move', () => {
    const concurrent = concurrentGame();
    const game = { ...concurrent, activePlayers: undefined, legalUciFor: undefined, moveFor: undefined } as unknown as VariantGame<string>;
    expect(activePlayers(game)).toEqual(['w']);
    expect(legalUciFor(game, 'w')).toEqual(['a1a2']);
    expect(legalUciFor(game, 'x')).toEqual([]);
    expect(moveFor(game, 'w', 'a1a2').color).toBe('w');
    expect(() => moveFor(game, 'b', 'a1a2')).toThrow(IllegalMoveError);
  });

  it('validates an action for its acting seat and replays actor-tagged concurrent moves', () => {
    const game = concurrentGame();
    expect(moveFor(game, 'b', 'a1a2').color).toBe('b');
    expect(moveFor(game, 'w', 'a1a2').color).toBe('w');
    expect(game.moves().map((move) => move.color)).toEqual(['b', 'w']);
    expect(activePlayers(game)).toEqual(['w']);
  });

  it('replays old histories without actors and rejects misaligned actor histories', () => {
    const seed = concurrentGame();
    const variant = { createGame: () => seed, startFen: 'start' } as unknown as Variant<VariantGame<string>>;
    expect(replayVariantMoves(variant, 'start', ['a1a2']).moves().map((move) => move.color)).toEqual(['w']);
    expect(() => replayVariantMoves(variant, 'start', ['a1a2'], [])).toThrow(RangeError);
  });
});
