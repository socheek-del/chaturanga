/** One named test per Janggi rule. Every case is also played on ffish, so each doubles as a probe. */
import { squareNameOf } from '@chaturanga/rules-core';
import { describe, expect, it } from 'vitest';
import { setupFen, START_FENS } from './fen';
import { Game } from './game';
import { loadFfish } from './testing/ffish';
import { janggi } from './variant';

async function movesFrom(fen: string, from: string): Promise<string[]> {
  const ffish = await loadFfish();
  const ref = new ffish.Board('janggi', fen);
  const legal = new Game(fen).legalUci().sort();
  expect(legal).toEqual(ref.legalMoves().split(' ').filter(Boolean).sort());
  ref.delete();
  return legal.filter((m) => new RegExp(`^${from}[a-i]`).test(m)).map((m) => m.slice(from.length)).sort();
}

async function play(fen: string, moves: string[]): Promise<Game> {
  const ffish = await loadFfish();
  const game = new Game(fen);
  const ref = new ffish.Board('janggi', fen);
  for (const uci of moves) {
    expect(game.status().kind, uci).toBe('ongoing');
    game.move(uci);
    ref.push(uci);
  }
  const status = game.status();
  expect(ref.isGameOver(true)).toBe(status.kind !== 'ongoing');
  const winner = 'winner' in status ? status.winner : undefined;
  expect(ref.result(true)).toBe(status.kind === 'ongoing' ? '*' : winner === 'w' ? '1-0' : winner === 'b' ? '0-1' : '1/2-1/2');
  ref.delete();
  return game;
}

describe('piece moves (jg-001)', () => {
  it('the general and advisors follow the palace lines, diagonals only from the marked points', async () => {
    expect(await movesFrom('3k5/9/9/9/9/9/9/9/4K4/9 w - - 0 1', 'e2')).toEqual(['d1', 'd2', 'd3', 'e1', 'e2', 'e3', 'f1', 'f2', 'f3']);
    expect(await movesFrom('5k3/9/9/9/9/9/9/3A5/4K4/9 w - - 0 1', 'd3')).toEqual(['d2', 'e3']);
    // e1 is not on a diagonal.
    expect(await movesFrom('3k5/9/9/9/9/9/9/9/4K4/4A4 w - - 0 1', 'e1')).toEqual(['d1', 'f1']);
  });

  it('the horse is blocked by its leg', async () => {
    expect(await movesFrom('3k5/9/9/9/9/4p4/4N4/9/9/5K3 w - - 0 1', 'e4')).toEqual(['c3', 'c5', 'd2', 'f2', 'g3', 'g5']);
  });

  it('the elephant goes one straight and two diagonal, and either point blocks it', async () => {
    expect(await movesFrom('3k5/9/9/9/9/4B4/9/9/9/5K3 w - - 0 1', 'e5')).toEqual(['b3', 'b7', 'c2', 'c8', 'g2', 'g8', 'h3', 'h7']);
    expect(await movesFrom('3k5/9/9/5p3/4p4/4B4/9/9/9/5K3 w - - 0 1', 'e5')).not.toContain('g8');
    expect(await movesFrom('3k5/9/9/5p3/9/4B4/9/9/9/5K3 w - - 0 1', 'e5')).toEqual(['b3', 'b7', 'c2', 'c8', 'g2', 'h3', 'h7']);
  });

  it('the cannon must jump exactly one piece, even to move, and never a cannon', async () => {
    expect(await movesFrom('3k5/9/9/9/1p7/9/1C7/9/9/5K3 w - - 0 1', 'b4')).toEqual(['b10', 'b7', 'b8', 'b9']);
    expect(await movesFrom('3k5/9/9/9/1c7/9/1C7/9/9/5K3 w - - 0 1', 'b4')).toEqual([]);
    // It may not take a cannon either: it stops short of b9.
    expect(await movesFrom('3k5/1c7/9/9/1p7/9/1C7/9/9/5K3 w - - 0 1', 'b4')).toEqual(['b7', 'b8']);
  });

  it('chariots and cannons travel the palace diagonals', async () => {
    expect(await movesFrom('4k4/9/5R3/9/9/9/9/9/9/3K5 w - - 0 1', 'f8')).toEqual(expect.arrayContaining(['e9', 'd10']));
    expect(await movesFrom('5k3/9/9/9/9/9/9/5A3/4K4/3C5 w - - 0 1', 'd1')).toEqual([]);
    expect(await movesFrom('5k3/9/9/9/9/9/9/9/4K4/3C5 w - - 0 1', 'd1')).toEqual(['f3']);
  });

  it('soldiers step sideways from the start and diagonally forward inside the palace', async () => {
    expect(await movesFrom('3k5/9/9/9/9/9/P8/9/9/5K3 w - - 0 1', 'a4')).toEqual(['a5', 'b4']);
    expect(await movesFrom('4k4/9/5P3/9/9/9/9/9/9/3K5 w - - 0 1', 'f8')).toEqual(['e8', 'e9', 'f9', 'g8']);
  });

  it('the attack map includes palace steps and leaves out a cannon aimed at a cannon', () => {
    const own = janggi.createGame().attackedSquares('w').map((sq) => squareNameOf(sq, 9));
    expect(own).toEqual(expect.arrayContaining(['e1', 'd1', 'b4', 'a5']));
    const aimed = janggi.createGame('3k5/1c7/9/9/1p7/9/1C7/9/9/5K3 w - - 0 1').attackedSquares('w').map((sq) => squareNameOf(sq, 9));
    expect(aimed).toContain('b8');
    expect(aimed).not.toContain('b9');
  });
});

describe('opening arrangements', () => {
  it('reads each side from its own left to right, sixteen starts in all', () => {
    expect(new Set(START_FENS).size).toBe(16);
    expect(setupFen('left', 'left')).toBe('rnba1anbr/4k4/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/4K4/RBNA1ABNR w - - 0 1');
    expect(setupFen('inner', 'outer').startsWith('rbna1anbr/')).toBe(true);
  });
});

describe('game end (jg-002)', () => {
  it('bikjang: facing generals answered by a pass settle the game on points', async () => {
    // Cho is a chariot ahead: 13 against 1.5.
    const game = await play('4k4/9/9/9/9/9/9/9/3K5/R8 w - - 0 1', ['d2e2', 'e10e10']);
    expect(game.status()).toEqual({ kind: 'bikjang', winner: 'w' });
  });

  it('bikjang may be broken: then play goes on', async () => {
    const game = await play('4k4/9/9/9/9/9/9/9/3K5/R8 w - - 0 1', ['d2e2', 'e10d10']);
    expect(game.status().kind).toBe('ongoing');
  });

  it('a side in check may still pass while the generals face, and the position can be shown again', async () => {
    const plain = await play('4k4/9/9/9/9/9/9/9/3K5/R8 w - - 0 1', ['a1a10']);
    expect(plain.inCheck()).toBe(true);
    expect(plain.passMove()).toBeNull();
    const checked = await play('4k4/9/4N4/9/9/9/9/9/4K4/9 w - - 0 1', ['e8g9']);
    expect(checked.inCheck()).toBe(true);
    expect(checked.isBikjang()).toBe(true);
    expect(checked.passMove()).toBe('e10e10');
    checked.move('e10e10');
    expect(checked.status()).toEqual({ kind: 'bikjang', winner: 'w' });
    expect(new Game(checked.fen()).fen()).toBe(checked.fen());
  });

  it('two passes in a row settle the game on points; level material is a Han win by 1.5', async () => {
    const game = await play(janggi.startFen, ['e2e2', 'e9e9']);
    expect(game.points()).toEqual({ w: 72, b: 73.5 });
    expect(game.status()).toEqual({ kind: 'double-pass', winner: 'b' });
    expect(game.moves().map((m) => m.san)).toEqual(['—', '—']);
  });

  it('a threefold repetition is settled on points', async () => {
    const cycle = ['a1a2', 'a10a9', 'a2a1', 'a9a10'];
    expect((await play(janggi.startFen, [...cycle, ...cycle])).status()).toEqual({ kind: 'repetition', winner: 'b' });
  });

  it('perpetual check loses', async () => {
    const cycle = ['a9a10', 'd10d9', 'a10a9', 'd9d10'];
    const game = await play('3k5/R8/9/9/9/9/9/8r/9/4K4 w - - 0 1', [...cycle, ...cycle]);
    expect(game.status()).toEqual({ kind: 'perpetual-check', winner: 'b' });
  });

  it('a hundred plies without a capture are settled on points', async () => {
    const game = await play('3k5/9/9/9/9/9/9/9/5K3/R8 w - - 99 60', ['a1a2']);
    expect(game.status()).toEqual({ kind: 'fifty-move', winner: 'w' });
  });

  it('generals and advisors alone are a draw', async () => {
    const game = await play('3ka4/9/9/9/9/9/9/9/5K3/3A5 w - - 0 1', []);
    expect(game.status()).toEqual({ kind: 'insufficient-material' });
  });

  it('a side with no other move passes, so there is no stalemate', async () => {
    const game = await play('3k5/8R/9/9/9/9/9/9/4K4/9 b - - 0 1', []);
    expect(game.passMove()).toBe('d10d10');
    expect(game.status().kind).toBe('ongoing');
  });
});
