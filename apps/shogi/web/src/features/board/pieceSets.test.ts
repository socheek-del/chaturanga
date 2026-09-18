import { Game, type Piece } from '@chaturanga/shogi';
import { describe, expect, it } from 'vitest';
import { DIRECTION_VECTOR, PIECE_LETTERS, PIECE_MOVES, pieceKey } from './pieceSets';

/**
 * The symbol set draws a piece's moves, so the diagrams must be the moves the engine actually generates
 * (sg-012). Every piece is put alone in the middle of an otherwise empty board and its own legal moves are
 * turned back into directions, steps and slides.
 */
const CENTRE = 'e5';
const squareIndex = (name: string): number => (Number(name[1]) - 1) * 9 + (name.charCodeAt(0) - 97);
const fileOf = (sq: number) => sq % 9;
const rankOf = (sq: number) => Math.floor(sq / 9);

/**
 * An empty board with one Sente piece on e5. Sente's own king sits in the corner, except when the piece
 * being tested is the king itself — a side has exactly one.
 */
function boardWith(fenPiece: string): string {
  const back = fenPiece === 'K' ? '9' : '2K6';
  return `2k6/9/9/9/4${fenPiece}4/9/9/9/${back}[] w - - 0 1`;
}

/** Destinations of the piece on e5, as (file, rank) offsets from it. */
function offsets(fenPiece: string): Array<[number, number]> {
  const game = new Game(boardWith(fenPiece));
  const from = squareIndex(CENTRE);
  const seen = new Set<string>();
  const out: Array<[number, number]> = [];
  for (const uci of game.legalUci()) {
    if (uci.includes('@') || !uci.startsWith(CENTRE)) continue;
    const to = squareIndex(uci.slice(2, 4));
    const key = `${fileOf(to) - fileOf(from)},${rankOf(to) - rankOf(from)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push([fileOf(to) - fileOf(from), rankOf(to) - rankOf(from)]);
  }
  return out;
}

/** The offsets a diagram claims: one square per step, the whole ray per slide, plus any jumps. */
function claimed(key: string): Array<[number, number]> {
  const moves = PIECE_MOVES[key]!;
  const out: Array<[number, number]> = [];
  for (const dir of moves.steps) {
    const [dx, dy] = DIRECTION_VECTOR[dir];
    // North on the diagram is forward for the owner, which is +1 rank for Sente.
    out.push([dx, -dy]);
  }
  for (const dir of moves.slides) {
    const [dx, dy] = DIRECTION_VECTOR[dir];
    for (let n = 1; n <= 8; n++) out.push([dx * n, -dy * n]);
  }
  for (const [dx, dy] of moves.jumps ?? []) out.push([dx, dy]);
  return out;
}

const sorted = (pairs: Array<[number, number]>) => pairs.map(([a, b]) => `${a},${b}`).sort();

const PIECES: ReadonlyArray<[string, string]> = [
  ['k', 'K'],
  ['r', 'R'],
  ['b', 'B'],
  ['g', 'G'],
  ['s', 'S'],
  ['n', 'N'],
  ['l', 'L'],
  ['p', 'P'],
  ['+r', '+R'],
  ['+b', '+B'],
  ['+s', '+S'],
  ['+n', '+N'],
  ['+l', '+L'],
  ['+p', '+P'],
];

describe('the symbol set draws what the engine allows (sg-012)', () => {
  it.each(PIECES)('%s', (key, fen) => {
    const inside = offsets(fen);
    const claim = claimed(key);
    // Every move the engine has is on the diagram…
    expect(sorted(claim)).toEqual(expect.arrayContaining(sorted(inside)));
    // …and the diagram claims nothing the engine refuses, once moves off the board are dropped.
    const onBoard = claim.filter(([dx, dy]) => Math.abs(dx) <= 4 && Math.abs(dy) <= 4);
    expect(sorted(inside)).toEqual(expect.arrayContaining(sorted(onBoard)));
  });
});

describe('the letter set (sg-012)', () => {
  it('has a letter for every face, promoted ones marked with +', () => {
    for (const [key] of PIECES) expect(PIECE_LETTERS[key], key).toBeTruthy();
    expect(PIECE_LETTERS['+p']).toBe('+P');
    expect(PIECE_LETTERS.k).toBe('K');
  });

  it('keys a piece the same way the board does', () => {
    const piece: Piece = { color: 'b', type: 's', promoted: true };
    expect(pieceKey(piece)).toBe('+s');
    expect(PIECE_MOVES[pieceKey(piece)]).toBe(PIECE_MOVES['+s']);
  });
});
