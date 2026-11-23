import { Game } from '@chaturanga/janggi';
import { describe, expect, it } from 'vitest';
import { DIRECTION_VECTOR, PIECE_LETTERS, PIECE_MOVES } from './pieceSets';

/**
 * The symbol set draws a piece's moves, so the diagrams must be the moves the engine actually generates
 * (jg-004). Each piece is probed from a point where nothing blocks it and none of the board's own rules
 * (the palace's edge, a blocked leg) take a move away, so the diagram and the engine can be
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
  ['k', 'e2', '5k3/9/9/9/9/9/9/9/4K4/9 w - - 0 1'],
  ['a', 'e2', '5k3/9/9/9/9/9/9/9/4A4/3K5 w - - 0 1'],
  ['b', 'e5', '5k3/9/9/9/9/4B4/9/9/9/3K5 w - - 0 1'],
  ['n', 'e5', '5k3/9/9/9/9/4N4/9/9/9/3K5 w - - 0 1'],
  ['r', 'e5', '5k3/9/9/9/9/4R4/9/9/9/3K5 w - - 0 1'],
  // Something to jump in every direction.
  ['c', 'e5', '5k3/9/9/9/4P4/3PCP3/4P4/9/9/3K5 w - - 0 1'],
  ['p', 'e4', '5k3/9/9/9/9/9/4P4/9/9/3K5 w - - 0 1'],
];

/** Destinations of the piece on `at`, as (file, rank) offsets. */
function offsets(fen: string, at: string): Array<[number, number]> {
  const game = new Game(fen);
  const from = squareIndex(at);
  return game.legalUci().flatMap((uci) => {
    if (!uci.startsWith(at)) return [];
    const to = squareIndex(uci.slice(at.length));
    if (to === from) return []; // the pass
    return [[fileOf(to) - fileOf(from), rankOf(to) - rankOf(from)] as [number, number]];
  });
}

/** The offsets a diagram claims: one point per step, the whole ray per slide, plus any leaps. */
function claimed(key: string): Array<[number, number]> {
  const moves = PIECE_MOVES[key]!;
  const out: Array<[number, number]> = [];
  for (const dir of moves.steps) {
    const [dx, dy] = DIRECTION_VECTOR[dir];
    // North on the diagram is forward for the owner, which is +1 rank for Cho.
    out.push([dx, -dy]);
  }
  for (const dir of moves.slides) {
    const [dx, dy] = DIRECTION_VECTOR[dir];
    for (let n = moves.screen ? 2 : 1; n <= 9; n++) out.push([dx * n, -dy * n]);
  }
  for (const [dx, dy] of moves.jumps ?? []) out.push([dx, dy]);
  return out;
}

const sorted = (pairs: Array<[number, number]>) => pairs.map(([a, b]) => `${a},${b}`).sort();

describe('the symbol set draws what the engine allows (jg-004)', () => {
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
      // A point holding the side's own general (it has to stand in the palace somewhere) is taken.
      const own = file >= 0 && file < FILES && rank >= 0 && rank < 10 ? new Game(fen).pieceAt(rank * FILES + file) : null;
      return file >= 0 && file < FILES && rank >= 0 && rank < 10 && own?.type !== 'k';
    });
    expect(sorted(engine)).toEqual(expect.arrayContaining(sorted(onBoard)));
  });
});

describe('the letter set (jg-004)', () => {
  it('uses the letters this site already writes in the move list', () => {
    expect(PIECE_LETTERS).toMatchObject({ k: 'K', a: 'A', b: 'E', n: 'H', r: 'R', c: 'C', p: 'P' });
  });
});
