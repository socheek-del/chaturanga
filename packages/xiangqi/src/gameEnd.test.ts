/**
 * One named test per game-end ruling (xq-002). Every case is also played on Fairy-Stockfish, so each
 * test is its own probe: ffish's `isGameOver(true)` and `result(true)` must agree with the status this
 * engine reports. RULES.md lists these cases.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { Game } from './game';
import type { GameStatus } from './types';
import { type Ffish, loadFfish } from './testing/ffish';

let ffish: Ffish;
beforeAll(async () => {
  ffish = await loadFfish();
});

function resultString(status: GameStatus): string {
  if (status.kind === 'ongoing') return '*';
  if ('winner' in status && status.winner) return status.winner === 'w' ? '1-0' : '0-1';
  return '1/2-1/2';
}

/** Plays `moves` from `fen` on both engines and returns this engine's status after every ply. */
function play(fen: string | undefined, moves: string[]): GameStatus[] {
  const game = new Game(fen);
  const ref = fen ? new ffish.Board('xiangqi', fen) : new ffish.Board('xiangqi');
  try {
    const statuses: GameStatus[] = [];
    const check = () => {
      const status = game.status();
      expect(resultString(status), `ffish result after ${game.moves().length} plies`).toBe(ref.result(true));
      expect(status.kind !== 'ongoing').toBe(ref.isGameOver(true));
      statuses.push(status);
    };
    check();
    for (const uci of moves) {
      game.move(uci);
      ref.push(uci);
      check();
    }
    return statuses;
  } finally {
    ref.delete();
  }
}

const cycle = (moves: string[], times: number): string[] => Array.from({ length: times }, () => moves).flat();

describe('Xiangqi game end (xq-002)', () => {
  it('stalemate loses for the side that cannot move', () => {
    // Black's general on d10: e10 faces Red's general, d9 is covered by the chariot.
    const statuses = play('3k5/9/8R/9/9/9/9/9/9/4K4 w - - 0 1', ['i8i9']);
    expect(statuses.at(-1)).toEqual({ kind: 'stalemate', winner: 'w' });
  });

  it('checkmate still wins', () => {
    const statuses = play('r2a2r2/3k4n/3aP4/9/n1b6/8p/P5p2/4R3B/3KA4/2B6 w - - 8 29', ['e8d8']);
    expect(statuses.at(-1)).toEqual({ kind: 'checkmate', winner: 'w' });
  });

  it('an idle repetition is a draw at the third occurrence', () => {
    const statuses = play(undefined, cycle(['b1c3', 'b10c8', 'c3b1', 'c8b10'], 2));
    expect(statuses[4]).toEqual({ kind: 'ongoing' });
    expect(statuses.slice(0, -1).every((s) => s.kind === 'ongoing')).toBe(true);
    expect(statuses.at(-1)).toEqual({ kind: 'repetition' });
  });

  it('perpetual check loses at the third occurrence, not before', () => {
    // Red's chariot checks along ranks 10 and 9 while Black's general steps between d10 and d9.
    const statuses = play('3k5/R8/9/9/9/9/9/9/9/4K4 w - - 0 1', cycle(['a9a10', 'd10d9', 'a10a9', 'd9d10'], 2));
    expect(statuses[4]).toEqual({ kind: 'ongoing' });
    expect(statuses.slice(0, -1).every((s) => s.kind === 'ongoing')).toBe(true);
    expect(statuses.at(-1)).toEqual({ kind: 'perpetual-check', winner: 'b' });
  });

  it('perpetual chase of an undefended piece loses', () => {
    // Red's chariot follows Black's cannon between the a and b files, attacking it after every move.
    const statuses = play('3k5/9/9/9/c8/9/9/9/9/1R2K4 w - - 0 1', cycle(['b1a1', 'a6b6', 'a1b1', 'b6a6'], 2));
    expect(statuses[4]).toEqual({ kind: 'ongoing' });
    expect(statuses.at(-1)).toEqual({ kind: 'perpetual-chase', winner: 'b' });
  });

  it('attacking a defended piece every other move is not a chase: draw', () => {
    // Same cycle, but Black's chariot on a10 defends the cannon whenever it stands on a6.
    const statuses = play('r2k5/9/9/9/c8/9/9/9/9/1R2K4 w - - 0 1', cycle(['b1a1', 'a6b6', 'a1b1', 'b6a6'], 2));
    expect(statuses.at(-1)).toEqual({ kind: 'repetition' });
  });

  it('a soldier that has crossed the river can be chased', () => {
    // Black's soldier on Red's side steps sideways between a4 and b4; Red's chariot follows it.
    const statuses = play('3k5/9/9/9/9/9/p8/9/9/1R2K4 w - - 0 1', cycle(['b1a1', 'a4b4', 'a1b1', 'b4a4'], 2));
    expect(statuses.at(-1)).toEqual({ kind: 'perpetual-chase', winner: 'b' });
  });

  it('a chariot attacking a chariot is a mutual attack, not a chase: draw', () => {
    const statuses = play('3k5/9/9/9/r8/9/9/9/9/1R2K4 w - - 0 1', cycle(['b1a1', 'a6b6', 'a1b1', 'b6a6'], 2));
    expect(statuses.at(-1)).toEqual({ kind: 'repetition' });
  });

  it('the 50-move rule draws once 100 plies pass without a capture', () => {
    const statuses = play('3k5/9/9/9/9/9/9/9/9/R3K4 w - - 98 60', ['a1a2', 'd10d9']);
    expect(statuses[1]).toEqual({ kind: 'ongoing' });
    expect(statuses.at(-1)).toEqual({ kind: 'fifty-move' });
  });

  it('the 50-move rule waits 2 plies per check beyond 10 by the checking side (AXF offset)', () => {
    // Found by probing ffish without repeating a position: Red gives 14 checks in the 38 plies played,
    // so the draw comes at 108 plies (100 + 2 x 4), not at 100.
    const moves = (
      'a1a2 a6c5 a2d2 c5d3 e1f1 d10e10 d2e2 d3e5 e2d2 e5f3 d2e2 e10f10 e2e10 f10f9 e10e9 f9f10 e9f9 f10e10 ' +
      'f9e9 e10d10 e9d9 d10e10 d9d10 e10e9 d10d9 e9e8 d9d8 e8e9 d8d6 e9f9 d6f6 f9e9 f6e6 e9d9 e6d6 d9e9 d6d7 f3g1'
    ).split(' ');
    const statuses = play('3k5/9/9/9/n8/9/9/9/9/R3K4 w - - 70 60', moves);
    // statuses[k] is at halfmove clock 70 + k.
    expect(statuses.slice(0, 38).every((s) => s.kind === 'ongoing')).toBe(true);
    expect(statuses[38]).toEqual({ kind: 'fifty-move' });
  });

  it('only generals, advisors and elephants left is insufficient material', () => {
    expect(play('2bak4/4a4/9/9/9/9/9/4B4/4A4/3AK4 w - - 0 1', []).at(-1)).toEqual({ kind: 'insufficient-material' });
  });

  it('a capture that leaves only generals, advisors and elephants ends the game', () => {
    const statuses = play('5k3/4a4/9/9/9/9/9/9/4A4/3nK4 w - - 0 1', ['e2d1']);
    expect(statuses[0]).toEqual({ kind: 'ongoing' });
    expect(statuses.at(-1)).toEqual({ kind: 'insufficient-material' });
  });

  it('a single soldier is enough material to play on', () => {
    expect(play('3ak4/9/9/9/9/9/9/9/4A4/p3K4 w - - 0 1', []).at(-1)).toEqual({ kind: 'ongoing' });
  });

  it('undo restores the repetition history', () => {
    const game = new Game();
    for (const uci of cycle(['b1c3', 'b10c8', 'c3b1', 'c8b10'], 2)) game.move(uci);
    expect(game.status()).toEqual({ kind: 'repetition' });
    game.undo();
    expect(game.status()).toEqual({ kind: 'ongoing' });
    game.move('c8b10');
    expect(game.status()).toEqual({ kind: 'repetition' });
  });
});
