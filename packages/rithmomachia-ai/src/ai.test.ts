import { Game, START_FEN } from '@chaturanga/rithmomachia';
import { BOARD_SIZE, pieceFromType, parseFen, serializeFen, squareAt, type Position } from '@chaturanga/rithmomachia/core';
import { describe, expect, it } from 'vitest';
import { BOTS, bestMove, chooseMove, positionKey, RithmomachiaSearch } from './index';

function emptyPosition(turn: 'w' | 'b' = 'w'): Position {
  return { board: Array(BOARD_SIZE).fill(null), turn, hands: { w: [], b: [] }, capturePlies: 0 };
}

function put(position: Position, color: 'w' | 'b', type: string, file: string, rank: number): void {
  position.board[squareAt(file, rank)] = pieceFromType(color, type, 'fixture');
}

const fen = (position: Position) => serializeFen(position);

describe('six bounded Rithmomachia bot levels', () => {
  it.each(BOTS.flatMap((bot) => [
    [`${bot.key} as Black`, bot.id, START_FEN] as const,
    [`${bot.key} as White`, bot.id, serializeFen({ ...parseFen(START_FEN), turn: 'w' })] as const,
  ]))('%s chooses a legal action within a fixed node budget', (_label, id, position) => {
    const game = new Game(position);
    const choice = chooseMove(position, id, {
      rng: () => 0.999,
      ignoreTime: true,
      maxDepth: 1,
      maxNodes: 400,
    });
    expect(choice).not.toBeNull();
    expect(game.legalUci()).toContain(choice!.uci);
    expect(choice!.nodes).toBeLessThan(1_200);
  });

  it('takes an immediate great-victory progression and a winning capture', () => {
    const progression = emptyPosition();
    put(progression, 'w', 'c2', 'a', 9);
    put(progression, 'w', 'c6', 'c', 9);
    put(progression, 'w', 'c4', 'a', 8);
    put(progression, 'b', 'c2', 'h', 16);
    expect(bestMove(fen(progression), { maxDepth: 1, maxNodes: 1_000, ignoreTime: true })?.uci).toBe('a8b9');

    const capture = emptyPosition();
    put(capture, 'w', 'c2', 'a', 1);
    put(capture, 'b', 'c2', 'b', 2);
    put(capture, 'b', 'c6', 'h', 16);
    expect(bestMove(fen(capture), { maxDepth: 1, maxNodes: 1_000, ignoreTime: true })?.uci).toBe('a1b2');
  });

  it('keeps search position identity independent of the counting plies', () => {
    const fresh = parseFen(START_FEN);
    const later = serializeFen({ ...fresh, capturePlies: 199 });
    expect(positionKey(later)).toBe(positionKey(START_FEN));
  });

  it('preserves full action strings and restores a supplied game after search', () => {
    const position = emptyPosition();
    position.hands.w.push('c2');
    const start = fen(position);
    const game = new Game(start);
    const adapter = new RithmomachiaSearch(game);
    const drop = adapter.legalMoves().map((move) => adapter.decode(move)).find((uci) => uci === 'C2@a1');
    expect(drop).toBe('C2@a1');
    const choice = bestMove(start, { game, maxDepth: 2, maxNodes: 800, ignoreTime: true });
    expect(new Game(start).legalUci()).toContain(choice?.uci);
    expect(game.fen()).toBe(start);
    expect(() => bestMove(START_FEN, { game })).toThrow('options.game is not on the given position');
  });

  it('chooses reproducibly and returns null when the game is already over', () => {
    const first = chooseMove(START_FEN, 3, { ignoreTime: true, maxDepth: 1, maxNodes: 600 });
    const second = chooseMove(START_FEN, 3, { ignoreTime: true, maxDepth: 1, maxNodes: 600 });
    expect(first?.uci).toBe(second?.uci);

    const ended = emptyPosition('b');
    put(ended, 'w', 'c2', 'a', 1);
    expect(chooseMove(fen(ended), 3, { ignoreTime: true })).toBeNull();
  });
});
