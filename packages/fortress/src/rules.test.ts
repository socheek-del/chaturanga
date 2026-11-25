import { describeVariantConformance, mulberry32 } from '@chaturanga/rules-core/testing';
import { describe, expect, it } from 'vitest';
import { diagonalTouchesWall, hasWallBetween, isPlayable, parseSquare, rightFortress } from './geometry';
import { fortress, Game, START_FEN } from './game';
import type { Seat } from './types';

const square = (name: string): number => {
  const value = parseSquare(name);
  if (value === null) throw new Error(`Bad fixture square: ${name}`);
  return value;
};

function fen(pieces: Record<string, string>, turn: Seat = 'r', castle = '-'): string {
  const board: string[] = Array.from({ length: 16 * 16 }, (_, index) => isPlayable(index) ? '-' : '.');
  for (const [name, token] of Object.entries(pieces)) board[square(name)] = token;
  const rows = Array.from({ length: 16 }, (_, row) => board.slice((15 - row) * 16, (16 - row) * 16).join(','));
  return `${rows.join('/')} ${turn} - - - r:-;b:-;w:-;k:- ${castle}`;
}

const kings = { e5: 'Rk', l5: 'Bk', l12: 'Wk', e12: 'Kk' };
const wallBishop = fen({ ...kings, n2: 'Rb' });
const wallRook = fen({ ...kings, m3: 'Rr' });

describeVariantConformance(fortress, {
  fens: [wallBishop, wallRook],
  invalidFens: ['', START_FEN.replace(' r - ', ' z - '), START_FEN.replace('.', 'x')],
  illegalMoves: ['e13e10', 'a13a14', 'N@e5', 'n2m3'],
});

describe('Russian Four-Handed Fortress Chess', () => {
  it('has 192 cells and the documented two-segment fortress walls', () => {
    expect(Array.from({ length: 256 }, (_, index) => index).filter(isPlayable)).toHaveLength(192);
    expect(rightFortress('r')).toHaveLength(16);
    expect(rightFortress('b')).toHaveLength(16);
    expect(hasWallBetween(square('m3'), square('n3'))).toBe(true);
    expect(hasWallBetween(square('m4'), square('n4'))).toBe(true);
    expect(hasWallBetween(square('m4'), square('m5'))).toBe(true);
    expect(hasWallBetween(square('n4'), square('n5'))).toBe(true);
    for (const [from, to] of [['n2', 'm3'], ['n4', 'm5'], ['m4', 'n5']]) {
      expect(diagonalTouchesWall(square(from!), square(to!))).toBe(true);
    }
  });

  it('starts with four 16-piece armies and three reserve pieces per player', () => {
    const game = new Game();
    expect(game.pieces()).toHaveLength(64);
    expect(game.turn).toBe('r');
    for (const seat of ['r', 'b', 'w', 'k'] as const) expect(game.hand(seat)).toEqual(['b', 'n', 'r']);
    expect(game.legalUci()).toContain('B@a13');
    expect(game.legalUci()).not.toContain('B@e5');
  });

  it('places each reserve in the player’s right fortress, then begins Red’s turn', () => {
    const game = new Game();
    const setup = [
      ['B@a13', 'N@b13', 'R@c13'],
      ['B@m13', 'N@n13', 'R@o13'],
      ['B@m1', 'N@n1', 'R@o1'],
      ['B@a1', 'N@b1', 'R@c1'],
    ];
    for (let seatIndex = 0; seatIndex < setup.length; seatIndex++) {
      const seat = ['r', 'b', 'w', 'k'][seatIndex];
      for (const placement of setup[seatIndex]!) {
        expect(game.turn).toBe(seat);
        expect(game.legalUci()).toContain(placement);
        game.move(placement);
      }
    }
    expect(game.turn).toBe('r');
    expect(game.isSetupPhase()).toBe(false);
    expect(game.pieces()).toHaveLength(76);
    expect(game.legalUci()).toEqual(expect.arrayContaining(['e13e12', 'e13e11']));
  });

  it('records the double-step en-passant pawn and restores setup and rights on undo', () => {
    const game = new Game();
    for (const move of [
      'B@a13', 'N@b13', 'R@c13', 'B@m13', 'N@n13', 'R@o13',
      'B@m1', 'N@n1', 'R@o1', 'B@a1', 'N@b1', 'R@c1',
    ]) game.move(move);
    const before = game.fen();
    game.move('e13e11');
    expect(game.fen().split(' ')[2]).toBe('e12r');
    expect(game.turn).toBe('b');
    game.undo();
    expect(game.fen()).toBe(before);
    expect(game.legalUci()).toContain('e13e11');
  });

  it('lets the immediately following seat capture the correct pawn en passant', () => {
    const game = new Game(fen({ a15: 'Rk', n8: 'Bk', n1: 'Wk', c8: 'Kk', e13: 'Rp', f11: 'Bp' }));
    game.move('e13e11');
    expect(game.turn).toBe('b');
    expect(game.legalUci()).toContain('f11e12');
    const capture = game.move('f11e12');
    expect(capture.captured).toEqual({ color: 'r', type: 'p', promoted: false });
    expect(game.pieceAt(square('e11'))).toBeNull();
  });

  it('casts along the seat axis and restores both king and rook on undo', () => {
    const game = new Game(fen({ ...kings, h14: 'Rk', e14: 'Rr', l14: 'Rr' }, 'r', 'rKLR'));
    expect(game.legalUci()).toEqual(expect.arrayContaining(['h14f14', 'h14j14']));
    game.move('h14f14');
    expect(game.pieceAt(square('f14'))?.type).toBe('k');
    expect(game.pieceAt(square('g14'))?.type).toBe('r');
    expect(game.pieceAt(square('e14'))).toBeNull();
    expect(game.fen().split(' ')[6]).toBe('-');
    game.undo();
    expect(game.pieceAt(square('h14'))?.type).toBe('k');
    expect(game.pieceAt(square('e14'))?.type).toBe('r');
  });

  it('removes a checkmated seat at the start of its turn', () => {
    const game = new Game(fen({
      a15: 'Rk', h8: 'Bk', n12: 'Wk', a1: 'Kk', g7: 'Rq', f7: 'Rr', h14: 'Rr', i3: 'Rr',
    }, 'b'));
    expect(game.isEliminated('b')).toBe(true);
    expect(game.pieceAt(square('h8'))).toBeNull();
    expect(game.turn).toBe('w');
    expect(game.isGameOver()).toBe(false);
  });

  it('wins only after both seats on the opposing team are removed', () => {
    const fields = fen({
      a15: 'Rk', h8: 'Bk', n12: 'Wk', g7: 'Rq', f7: 'Rr', h14: 'Rr', i3: 'Rr',
    }).split(' ');
    fields[3] = 'k';
    const game = new Game(fields.join(' '));
    game.move('a15a14');
    expect(game.isEliminated('b')).toBe(true);
    expect(game.status()).toEqual({ kind: 'checkmate', winner: 'r' });
    expect(game.legalUci()).toEqual([]);
  });

  it('stops rook, bishop and knight routes at fortress walls and their end diagonals', () => {
    expect(new Game(wallRook).legalUci()).not.toContain('m3n3');
    const bishop = new Game(wallBishop);
    expect(bishop.legalUci()).not.toContain('n2m3');
  });

  it('replays and undoes seeded setup playouts', () => {
    for (let seed = 1; seed <= 3; seed++) {
      const random = mulberry32(seed);
      const game = new Game();
      const history: string[] = [];
      for (let ply = 0; ply < 50 && !game.isGameOver(); ply++) {
        const moves = game.legalUci();
        const move = moves[Math.floor(random() * moves.length)]!;
        history.push(move);
        game.move(move);
        expect(new Game(game.fen()).fen()).toBe(game.fen());
      }
      const replay = new Game();
      for (const move of history) replay.move(move);
      expect(replay.fen()).toBe(game.fen());
      for (const move of history.reverse()) expect(game.undo()?.uci).toBe(move);
      expect(game.fen()).toBe(START_FEN);
    }
  });
});
