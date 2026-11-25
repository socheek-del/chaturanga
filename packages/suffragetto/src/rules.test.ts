import { describeVariantConformance } from '@chaturanga/rules-core/testing';
import { describe, expect, it } from 'vitest';
import {
  Game,
  HOSPITAL,
  POLICE_START_FEN,
  PRISON,
  START_FEN,
  parseFen,
  square,
  squareName,
  suffragetto,
} from './index';
import { FILES, RANKS } from './layout';

function fen(pieces: Record<string, string>, turn = 'w'): string {
  const rows = Array.from({ length: RANKS }, () => Array<string>(FILES).fill('.'));
  for (const [name, token] of Object.entries(pieces)) {
    const target = square(name);
    rows[RANKS - 1 - Math.floor(target / FILES)]![target % FILES] = token;
  }
  const placement = rows.map((row) => row.join('').replace(/\.+/g, (empty) => String(empty.length))).join('/');
  return `${placement} ${turn}`;
}

const goalWin = fen({
  g12: 'S', h14: 'S', i14: 'S', j14: 'S', i13: 'S', j13: 'S',
  o17: 'p',
});

describeVariantConformance(suffragetto, {
  fens: [START_FEN, POLICE_START_FEN, fen({ e5: 'S', f6: 'p', o15: 'i' }), goalWin],
  invalidFens: [
    '', 'not a position', `${START_FEN} extra`,
    fen({ a1: 'S', q1: 'S', e5: 'P' }),
    fen({ a1: 'p', e5: 'S' }),
    fen({ h13: 'p', o15: 'S' }),
    fen({ h5: 'S', o15: 'p' }),
    fen({ q1: 'p', q2: 'p', q3: 'p', q4: 'p', q5: 'p', q6: 'p', q7: 'p', q8: 'p', q9: 'p', q10: 'p', q11: 'p', q12: 'p', q13: 'p', q14: 'p', q15: 'p', q16: 'p', q17: 'p', p1: 'p', p2: 'p', p3: 'p', p4: 'p', p5: 'p', e5: 'S' }),
  ],
  illegalMoves: ['a1b2', 'q17q16', 'e5f6'],
  terminal: { fen: goalWin, move: 'g12h13', status: { kind: 'goal-square', winner: 'w' } },
});

describe('Suffragetto movement and outcomes', () => {
  it('serializes the complete setup and supports either first player', () => {
    const game = new Game();
    expect(game.fen()).toBe(START_FEN);
    expect(game.pieces()).toHaveLength(42);
    expect(game.pieces().filter(({ piece }) => piece.color === 'w')).toHaveLength(21);
    expect(game.pieces().filter(({ piece }) => piece.color === 'b')).toHaveLength(21);
    expect(new Game(POLICE_START_FEN).turn).toBe('b');
    expect(new Game(game.fen()).fen()).toBe(game.fen());
    expect(parseFen(game.fen())).toEqual(parseFen(START_FEN));
  });

  it('steps to any adjacent empty cell in eight directions', () => {
    const game = new Game(fen({ i8: 'S', o15: 'p' }));
    expect(game.legalUci().filter((uci) => uci.startsWith('i8'))).toEqual(expect.arrayContaining([
      'i8h7', 'i8i7', 'i8j7', 'i8h8', 'i8j8', 'i8h9', 'i8i9', 'i8j9',
    ]));
  });

  it('allows chainable hops over either side and ends a route when a landing square repeats', () => {
    const game = new Game(fen({ e6: 'S', f6: 'p', h6: 'S', o15: 'i' }));
    expect(game.legalUci()).toContain('e6g6');
    expect(game.legalUci()).toContain('e6g6i6');
    expect(game.legalUci()).not.toContain('e6g6e6');
    const move = game.move('e6g6i6');
    expect(move.captured).toBeNull();
    expect(game.pieceAt(square('i6'))).toMatchObject({ color: 'w', type: 's' });
    expect(game.pieceAt(square('f6'))).toMatchObject({ color: 'b', type: 'p' });
    expect(game.pieceAt(square('h6'))).toMatchObject({ color: 'w', type: 's' });
  });

  it('captures only Arena pieces with the correct rank and transfers them immediately', () => {
    const diagonal = new Game(fen({ e5: 'S', f6: 'p', o15: 'i' }));
    expect(diagonal.legalUci()).toContain('e5g7');
    const capture = diagonal.move('e5g7');
    expect(capture.captured).toMatchObject({ color: 'b', type: 'p' });
    expect(capture.san).toBe('e5×g7');
    expect(diagonal.pieceAt(square('f6'))).toBeNull();
    expect(diagonal.pieceAt(square('p1'))).toMatchObject({ color: 'b', type: 'p' });

    const straightSmallHop = new Game(fen({ e5: 'S', f5: 'p', o15: 'i' }));
    const hop = straightSmallHop.move('e5g5');
    expect(hop.captured).toBeNull();
    expect(straightSmallHop.pieceAt(square('f5'))).toMatchObject({ color: 'b', type: 'p' });

    const large = new Game(fen({ e5: 'L', f5: 'p', o15: 'i' }));
    expect(large.move('e5g5').captured).toMatchObject({ color: 'b', type: 'p' });

    const policeRankAndFile = new Game(fen({ e6: 'p', f7: 'S', o15: 'S' }, 'b'));
    expect(policeRankAndFile.move('e6g8').captured).toMatchObject({ color: 'w', type: 's' });
    expect(policeRankAndFile.pieceAt(square('a1'))).toMatchObject({ color: 'w', type: 's' });

    const inspector = new Game(fen({ e6: 'i', f6: 'S', o15: 'S' }, 'b'));
    expect(inspector.move('e6g6').captured).toMatchObject({ color: 'w', type: 's' });
  });

  it('removes each captured piece immediately during a multi-capture route', () => {
    const game = new Game(fen({ e6: 'S', f7: 'p', h9: 'p', o15: 'i' }));
    expect(game.legalUci()).toContain('e6g8i10');
    const record = game.move('e6g8i10');
    expect(record.captures).toEqual([
      expect.objectContaining({ color: 'b', type: 'p' }),
      expect.objectContaining({ color: 'b', type: 'p' }),
    ]);
    expect(game.pieceAt(square('f7'))).toBeNull();
    expect(game.pieceAt(square('h9'))).toBeNull();
    expect(game.pieceAt(square('p1'))).toMatchObject({ color: 'b', type: 'p' });
    expect(game.pieceAt(square('q1'))).toMatchObject({ color: 'b', type: 'p' });
  });

  it('does not capture a jumped piece outside the pink Arena', () => {
    const game = new Game(fen({ c5: 'S', d5: 'p', o15: 'i' }));
    const move = game.move('c5e5');
    expect(move.captured).toBeNull();
    expect(game.pieceAt(square('d5'))).toMatchObject({ color: 'b', type: 'p' });
  });

  it('keeps holding and staging cells out of ordinary routes', () => {
    const game = new Game(fen({ c6: 'S', o15: 'p' }));
    expect(game.legalUci()).not.toContain('c6b6');
    expect(game.legalUci()).not.toContain('c6a6');
    const staged = new Game(fen({ b6: 'S', o15: 'p' }));
    expect(staged.legalUci()).toContain('b6c6');
    const blockedTransit = new Game(fen({ b6: 'S', c6: 'S', o15: 'p' }));
    expect(blockedTransit.legalUci()).not.toContain('c6a6');
    const prisoner = new Game(fen({ a1: 'S', o15: 'p' }));
    expect(prisoner.legalUci()).not.toContain('a1a2');
    expect(PRISON).toContain(square('a1'));
    expect(HOSPITAL).toContain(square('q17'));
  });

  it('enforces defended buildings and locks a piece inside the goal it entered', () => {
    const suffragette = new Game(fen({ g6: 'S', o15: 'p' }));
    expect(suffragette.legalUci()).not.toContain('g6h5');
    const police = new Game(fen({ g12: 'i', o5: 'S' }, 'b'));
    expect(police.legalUci()).not.toContain('g12h13');

    const inside = new Game(fen({ h13: 'S', o15: 'p' }));
    expect(inside.legalUci().filter((uci) => uci.startsWith('h13')).every((uci) => ['h13', 'i13', 'j13', 'h14', 'i14', 'j14'].includes(uci.slice(3)))).toBe(true);
  });

  it('ends when all six opposing building cells are occupied', () => {
    const game = new Game(goalWin);
    expect(game.move('g12h13').san).toBe('g12–h13');
    expect(game.status()).toEqual({ kind: 'goal-square', winner: 'w' });
    expect(game.legalUci()).toEqual([]);
  });

  it('exchanges equal ranks without consent and blocks another exchange until staging is clear', () => {
    const pieces: Record<string, string> = {};
    for (const target of PRISON.slice(0, 12)) pieces[squareName(target)] = target < 2 * FILES ? 'L' : 'S';
    for (const target of HOSPITAL.slice(0, 12)) pieces[squareName(target)] = target < 2 * FILES ? 'i' : 'p';
    const initial = fen(pieces);
    const game = new Game(initial);
    expect(game.legalUci()).toContain('X21@b1'); // two small and one large pair
    expect(game.legalUci()).not.toContain('X00@b1'); // no pairs selected
    const record = game.move('X21@b1');
    expect(record.san).toBe('Exchange 3 pairs (2 small, 1 large)');
    expect(record.to).toBe(square('b1'));
    expect(game.pieceAt(square('b1'))).toMatchObject({ color: 'w', type: 'l' });
    expect(game.pieceAt(square('b2'))).toMatchObject({ color: 'w', type: 's' });
    expect(game.pieceAt(square('p12'))).toMatchObject({ color: 'b', type: 'i' });
    expect(game.legalUci().some((uci) => uci.endsWith('x'))).toBe(false);
    expect(game.undo()?.uci).toBe('X21@b1');
    expect(game.fen()).toBe(initial);
  });

  it('draws after three repetitions and loses when the player to move has no legal action', () => {
    const repeated = new Game(fen({ c3: 'S', o15: 'p' }));
    for (let cycle = 0; cycle < 2; cycle++) {
      repeated.move('c3d3');
      repeated.move('o15n15');
      repeated.move('d3c3');
      repeated.move('n15o15');
    }
    expect(repeated.status()).toEqual({ kind: 'repetition' });
    expect(repeated.undo()?.uci).toBe('n15o15');
    expect(repeated.status()).toEqual({ kind: 'ongoing' });

    const trapped = new Game(fen({ a1: 'S', o15: 'p' }));
    expect(trapped.status()).toEqual({ kind: 'stalemate', winner: 'b' });
  });
});
