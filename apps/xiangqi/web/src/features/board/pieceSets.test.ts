import { Game } from '@chaturanga/xiangqi';
import { describe, expect, it } from 'vitest';
import { DIRECTION_VECTOR, PIECE_LETTERS, PIECE_MOVES } from './pieceSets';

/**
 * The symbol set draws a piece's moves, so the diagrams must be the moves the engine actually generates
 * (xq-012). Each piece is probed from a point where nothing blocks it and none of the board's own rules
 * (the palace, the river, a blocked leg or eye) take a move away, so the diagram and the engine can be
 * compared directly.
 */
const FILES = 9;
const squareIndex = (name: string): number => {
  const file = name.charCodeAt(0) - 97;
  return (Number(name.slice(1)) - 1) * FILES + file;
};
const fileOf = (sq: number) => sq % FILES;
const rankOf = (sq: number) => Math.floor(sq / FILES);

/** Where each piece is probed: its point, and a position where it is free to do everything it can. */
const PROBES: ReadonlyArray<[string, string, string]> = [
  // Both generals stand off each other's files, and out of the way of whatever is being probed. The
  // Soldier on f7 keeps the f-file closed, so the flying-general rule does not take f2 from the General.
  ['k', 'e2', '5k3/9/9/5p3/9/9/9/9/4K4/9 w - - 0 1'],
  ['a', 'e2', '5k3/9/9/9/9/9/9/9/4A4/4K4 w - - 0 1'],
  // An Elephant on its own point, both diagonals inside its own half and empty.
  ['b', 'c3', '5k3/9/9/9/9/9/9/2B6/9/3K5 w - - 0 1'],
  // A Horse in the open, no leg blocked.
  ['n', 'e5', '5k3/9/9/9/9/4N4/9/9/9/3K5 w - - 0 1'],
  ['r', 'e5', '5k3/9/9/9/9/4R4/9/9/9/3K5 w - - 0 1'],
  ['c', 'e5', '5k3/9/9/9/9/4C4/9/9/9/3K5 w - - 0 1'],
  // A Soldier that has not crossed the river: forward only.
  ['p', 'e4', '5k3/9/9/9/9/9/4P4/9/9/3K5 w - - 0 1'],
];

/** Destinations of the piece on `at`, as (file, rank) offsets. */
function offsets(fen: string, at: string): Array<[number, number]> {
  const game = new Game(fen);
  const from = squareIndex(at);
  return game.legalUci().flatMap((uci) => {
    if (!uci.startsWith(at)) return [];
    const to = squareIndex(uci.slice(at.length));
    return [[fileOf(to) - fileOf(from), rankOf(to) - rankOf(from)] as [number, number]];
  });
}

/** The offsets a diagram claims: one point per step, the whole ray per slide, plus any leaps. */
function claimed(key: string): Array<[number, number]> {
  const moves = PIECE_MOVES[key]!;
  const out: Array<[number, number]> = [];
  for (const dir of moves.steps) {
    const [dx, dy] = DIRECTION_VECTOR[dir];
    // North on the diagram is forward for the owner, which is +1 rank for Red.
    out.push([dx, -dy]);
  }
  for (const dir of moves.slides) {
    const [dx, dy] = DIRECTION_VECTOR[dir];
    for (let n = 1; n <= 9; n++) out.push([dx * n, -dy * n]);
  }
  for (const [dx, dy] of moves.jumps ?? []) out.push([dx, dy]);
  return out;
}

const sorted = (pairs: Array<[number, number]>) => pairs.map(([a, b]) => `${a},${b}`).sort();

describe('the symbol set draws what the engine allows (xq-012)', () => {
  it.each(PROBES)('%s', (key, at, fen) => {
    const engine = offsets(fen, at);
    const claim = claimed(key);
    // Every move the engine has is on the diagram…
    expect(sorted(claim)).toEqual(expect.arrayContaining(sorted(engine)));
    // …and the diagram claims nothing the engine refuses, once moves off the board are dropped.
    const onBoard = claim.filter(([dx, dy]) => {
      const from = squareIndex(at);
      const file = fileOf(from) + dx;
      const rank = rankOf(from) + dy;
      return file >= 0 && file < FILES && rank >= 0 && rank < 10;
    });
    expect(sorted(engine)).toEqual(expect.arrayContaining(sorted(onBoard)));
  });
});

describe('the letter set (xq-012)', () => {
  it('uses the letters this site already writes in the move list', () => {
    expect(PIECE_LETTERS).toMatchObject({ k: 'K', a: 'A', b: 'E', n: 'H', r: 'R', c: 'C', p: 'P' });
  });
});
