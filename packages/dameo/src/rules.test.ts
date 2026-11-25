import { describeVariantConformance } from '@chaturanga/rules-core/testing';
import { describe, expect, it } from 'vitest';
import { Game, START_FEN, dameo, parseFen, placementOf, serializeFen, square, squareName } from './index';
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

const captureMaximum = fen({ e4: 'M', a1: 'M', e5: 'm', e7: 'm', a2: 'm' });
const noMoves = fen({ a8: 'M', h1: 'm' });

describeVariantConformance(dameo, {
  fens: [START_FEN, fen({ e4: 'M', d6: 'K', h8: 'm' }), fen({ a8: 'K', h1: 'k' }, 'b')],
  invalidFens: [
    '', 'not a position', `${START_FEN} extra`,
    '8/8/8/8/8/8/8/7 w',
    '9/8/8/8/8/8/8/8 w',
    '44/8/8/8/8/8/8/8 w',
    '8/8/8/8/8/8/8/7x w',
    '8/8/8/8/8/8/8/8 x',
  ],
  illegalMoves: ['a1a1', 'a1b2', 'a1a3', 'e2e1'],
});

describe('Dameo movement and outcomes', () => {
  it('encodes the standard 18-man setup and round-trips man and king positions', () => {
    const game = new Game();
    expect(game.fen()).toBe(START_FEN);
    expect(game.pieces()).toHaveLength(36);
    expect(game.pieces().filter(({ piece }) => piece.color === 'w')).toHaveLength(18);
    expect(game.pieces().filter(({ piece }) => piece.color === 'b')).toHaveLength(18);
    expect(game.pieces().filter(({ piece }) => piece.type === 'm')).toHaveLength(36);
    expect(serializeFen(parseFen(game.fen()))).toBe(game.fen());
    expect(placementOf(parseFen(game.fen()).board)).toBe(game.fen().split(' ')[0]);
  });

  it('moves men one square forward, straight or diagonally, and never backward', () => {
    const game = new Game(fen({ e4: 'M', h8: 'm' }));
    expect(game.legalUci()).toEqual(expect.arrayContaining(['e4e5', 'e4d5', 'e4f5']));
    expect(game.legalUci()).not.toEqual(expect.arrayContaining(['e4e3', 'e4d3', 'e4f3']));
  });

  it('slides an unbroken line of men one square and promotes only its leading man', () => {
    const line = new Game(fen({ b2: 'M', c3: 'M', d4: 'M', h8: 'm' }));
    expect(line.legalUci()).toEqual(expect.arrayContaining(['b2c3d4e5', 'c3d4e5']));
    expect(line.legalUci()).not.toContain('b2c3d4');
    line.move('b2c3d4e5');
    expect(line.pieceAt(square('c3'))).toMatchObject({ color: 'w', type: 'm' });
    expect(line.pieceAt(square('d4'))).toMatchObject({ color: 'w', type: 'm' });
    expect(line.pieceAt(square('e5'))).toMatchObject({ color: 'w', type: 'm' });
    expect(line.pieceAt(square('b2'))).toBeNull();

    const promotion = new Game(fen({ e6: 'M', f7: 'M', h1: 'm' }));
    promotion.move('e6f7g8');
    expect(promotion.pieceAt(square('f7'))).toMatchObject({ type: 'm' });
    expect(promotion.pieceAt(square('g8'))).toMatchObject({ type: 'k', promoted: true });
  });

  it('lets kings move unobstructed distances in all eight directions', () => {
    const game = new Game(fen({ c3: 'K', g7: 'm', h8: 'm' }));
    expect(game.legalUci()).toEqual(expect.arrayContaining(['c3c7', 'c3g3', 'c3f6', 'c3a5']));
    expect(game.legalUci()).not.toContain('c3g7');
    expect(game.legalUci()).not.toContain('c3h8');
  });

  it('requires a capture and keeps only routes with the global maximum number of captures', () => {
    const game = new Game(captureMaximum);
    expect(game.legalUci()).toContain('e4e6e8');
    expect(game.legalUci()).not.toContain('a1a3');
    expect(game.legalUci().every((uci) => uci.startsWith('e4'))).toBe(true);
    const record = game.move('e4e6e8');
    expect(record.captured).toMatchObject({ color: 'b', type: 'm' });
    expect(record.captures).toEqual([expect.objectContaining({ color: 'b', type: 'm' })]);
    expect(game.pieceAt(square('e5'))).toBeNull();
    expect(game.pieceAt(square('e7'))).toBeNull();
  });

  it('allows long king captures and does not capture the same still-blocking piece twice', () => {
    const game = new Game(fen({ b4: 'K', d4: 'm', h8: 'm' }));
    expect(game.legalUci()).toContain('b4e4');
    expect(game.legalUci()).not.toContain('b4e4b4');
    game.move('b4e4');
    expect(game.pieceAt(square('d4'))).toBeNull();
    expect(game.pieceAt(square('e4'))).toMatchObject({ color: 'w', type: 'k' });

    const long = new Game(fen({ e4: 'K', e6: 'm', a1: 'm' }));
    expect(long.legalUci()).toEqual(expect.arrayContaining(['e4e7', 'e4e8']));

    const delayedRemoval = new Game(fen({ d4: 'K', d6: 'm', d2: 'm' }));
    expect(delayedRemoval.legalUci()).toContain('d4d7');
    expect(delayedRemoval.legalUci()).toContain('d4d1');
    expect(delayedRemoval.legalUci()).not.toContain('d4d7d1');
  });

  it('does not promote a man that crosses the back rank during a capture route', () => {
    const game = new Game(fen({ e6: 'M', e7: 'm', f8: 'm', g7: 'm', a1: 'm' }));
    expect(game.legalUci()).toContain('e6e8g8g6');
    game.move('e6e8g8g6');
    expect(game.pieceAt(square('g6'))).toMatchObject({ color: 'w', type: 'm', promoted: false });
  });

  it('promotes after a quiet move reaches the back rank and records replayable turns', () => {
    const game = new Game(fen({ e7: 'M', h1: 'm' }));
    const before = game.fen();
    const record = game.move('e7e8');
    expect(game.pieceAt(square('e8'))).toMatchObject({ color: 'w', type: 'k', promoted: true });
    const replay = new Game(before);
    expect(replay.move(record.uci).fenAfter).toBe(game.fen());
    expect(game.undo()?.uci).toBe(record.uci);
    expect(game.fen()).toBe(before);
  });

  it('allows empty landing squares to be revisited during a multi-capture route', () => {
    const game = new Game(fen({ d4: 'K', d6: 'm', f7: 'm', g5: 'm', e4: 'm', d2: 'm' }));
    const route = 'd4d7g7g4d4d1';
    expect(game.legalUci()).toContain(route);
    const record = game.move(route);
    expect(1 + (record.captures?.length ?? 0)).toBe(5);
    expect(game.pieceAt(square('d4'))).toBeNull();
    expect(game.pieceAt(square('d2'))).toBeNull();
    expect(game.pieceAt(square('d1'))).toMatchObject({ color: 'w', type: 'k' });
  });

  it('ends on elimination or blockage, draws on threefold repetition, and undoes repetition state', () => {
    const eliminated = new Game(fen({ e4: 'M', e5: 'm' }));
    eliminated.move('e4e6');
    expect(eliminated.status()).toEqual({ kind: 'elimination', winner: 'w' });
    expect(eliminated.legalUci()).toEqual([]);

    expect(new Game(noMoves).status()).toEqual({ kind: 'stalemate', winner: 'b' });

    const repeated = new Game(fen({ c3: 'K', h8: 'k' }));
    for (let cycle = 0; cycle < 2; cycle++) {
      repeated.move('c3d3');
      repeated.move('h8g8');
      repeated.move('d3c3');
      repeated.move('g8h8');
    }
    expect(repeated.status()).toEqual({ kind: 'repetition' });
    expect(repeated.undo()?.uci).toBe('g8h8');
    expect(repeated.status()).toEqual({ kind: 'ongoing' });
  });

  it('uses standard coordinate strings for complete line and capture paths', () => {
    const game = new Game(fen({ c3: 'K', c5: 'm', a1: 'm' }));
    expect(game.legalUci()).toContain('c3c6');
    expect(game.legalUci().every((uci) => uci.match(/[a-h][1-8]/g)?.join('') === uci)).toBe(true);
    expect(squareName(square('h8'))).toBe('h8');
  });

  it('marks threatened and defended pieces in the attack map', () => {
    const man = new Game(fen({ e4: 'M', e5: 'm', h8: 'm' }));
    expect(man.attackedSquares('w')).toContain(square('e5'));

    const defended = new Game(fen({ e4: 'M', e5: 'M', h8: 'm' }));
    expect(defended.attackedSquares('w')).toContain(square('e5'));

    const blocked = new Game(fen({ e4: 'M', e5: 'm', e6: 'm', h8: 'm' }));
    expect(blocked.attackedSquares('w')).not.toContain(square('e5'));

    const king = new Game(fen({ e4: 'K', e6: 'm', h8: 'm' }));
    expect(king.attackedSquares('w')).toContain(square('e6'));
  });
});
