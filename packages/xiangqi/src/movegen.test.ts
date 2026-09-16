import { describe, expect, it } from 'vitest';
import { Game, moveToUci } from './game';

const allUci = (fen: string) => new Game(fen).legalUci().sort();
/** Destination squares of moves from `from`. */
const targets = (fen: string, from: string) =>
  allUci(fen)
    .filter((u) => u.startsWith(from) && u.length - from.length <= 3)
    .map((u) => u.slice(from.length))
    .sort();
const sanOf = (fen: string, uci: string) => new Game(fen).move(uci).san;

// The black general sits at a10 in every fixture below unless the test is specifically about the
// flying-general rule, so an unrelated white piece placed on the e-file never triggers it by accident.

// Every expectation below was probed against Fairy-Stockfish's xiangqi variant (ffish 0.7.10).
describe('piece movement (xq-001)', () => {
  it('General moves one step orthogonally, confined to its palace', () => {
    expect(targets('k8/9/9/9/9/9/9/9/9/4K4 w - - 0 1', 'e1')).toEqual(['d1', 'e2', 'f1']);
    expect(targets('k8/9/9/9/9/9/9/9/3K5/9 w - - 0 1', 'd2')).toEqual(['d1', 'd3', 'e2'].sort());
  });

  it('Advisor moves one diagonal step, confined to its palace', () => {
    expect(targets('k8/9/9/9/9/9/9/9/4A4/4K4 w - - 0 1', 'e2')).toEqual(['d1', 'd3', 'f1', 'f3']);
  });

  it('Elephant moves exactly two points diagonally, never crossing the river', () => {
    expect(targets('k8/9/9/9/9/4B4/9/9/9/4K4 w - - 0 1', 'e5')).toEqual(['c3', 'g3']);
  });

  it('Elephant is blocked by an occupier of its "eye"', () => {
    expect(targets('k8/9/9/9/9/4B4/3p5/9/9/4K4 w - - 0 1', 'e5')).toEqual(['g3']);
  });

  it('Horse leaps like a knight', () => {
    expect(targets('k8/9/9/9/4N4/9/9/9/9/4K4 w - - 0 1', 'e6')).toEqual(
      ['c5', 'c7', 'd4', 'd8', 'f4', 'f8', 'g5', 'g7'].sort(),
    );
  });

  it('Horse is blocked by a piece on its "leg"', () => {
    // A blocker at e7 (the leg for the two "upward" leaps) removes d8 and f8, leaving the other six.
    expect(targets('k8/9/9/4p4/4N4/9/9/9/9/4K4 w - - 0 1', 'e6')).toEqual(['c5', 'c7', 'd4', 'f4', 'g5', 'g7'].sort());
  });

  it('Chariot slides orthogonally, unblocked in every direction', () => {
    expect(targets('k8/9/9/9/4R4/9/9/9/9/4K4 w - - 0 1', 'e6')).toHaveLength(16);
  });

  it('Chariot stops at the first blocker, capturing an enemy but not a friend', () => {
    expect(targets('k8/9/9/9/1p2R4/9/9/9/9/4K4 w - - 0 1', 'e6')).toEqual(
      ['b6', 'c6', 'd6', 'e10', 'e2', 'e3', 'e4', 'e5', 'e7', 'e8', 'e9', 'f6', 'g6', 'h6', 'i6'].sort(),
    );
  });

  it('Cannon slides like a chariot when not capturing, but jumps exactly one screen to capture', () => {
    // e8 is the screen; e9 is the enemy piece the cannon captures by jumping it.
    const fen = 'k8/4p4/4p4/9/4C4/9/9/9/9/4K4 w - - 0 1';
    const moves = targets(fen, 'e6');
    expect(moves).toContain('e5');
    expect(moves).toContain('e7');
    expect(moves).not.toContain('e8');
    expect(moves).toContain('e9');
    expect(moves).not.toContain('e10');
  });

  it('Cannon cannot capture without exactly one screen in between', () => {
    // With no screen, a direct approach onto an enemy piece is illegal for a cannon.
    expect(targets('k8/9/9/9/9/9/9/9/4p4/4C1K2 w - - 0 1', 'e1')).not.toContain('e2');
  });

  it('Soldier moves one step forward before crossing the river', () => {
    expect(targets('k8/9/9/9/9/4P4/9/9/9/4K4 w - - 0 1', 'e5')).toEqual(['e6']);
  });

  it('Soldier gains sideways moves (never backward) after crossing the river', () => {
    expect(targets('k8/9/9/4P4/9/9/9/9/9/4K4 w - - 0 1', 'e7')).toEqual(['d7', 'e8', 'f7'].sort());
  });

  it('Soldier captures by moving into the target square like any other piece', () => {
    expect(sanOf('k8/9/9/9/9/9/4p4/4P4/9/4K4 w - - 0 1', 'e3e4')).toBe('Pxe4');
  });
});

describe('the flying-general rule (xq-001)', () => {
  it('a general may not step onto a file with a clear line to the enemy general', () => {
    // The white general is on file d, not currently facing black's on file e; stepping to e1 would
    // face it with a clear line, so only the other in-palace step (d2) is legal.
    expect(targets('4k4/9/9/9/9/9/9/9/9/3K5 w - - 0 1', 'd1')).toEqual(['d2']);
  });

  it('a piece may not move off the file it uses to block the two generals from facing', () => {
    const fen = '4k4/9/9/9/9/4p4/9/9/9/4K4 b - - 0 1';
    const g = new Game(fen);
    expect(g.legalUci().filter((u) => u.startsWith('e5'))).toEqual(['e5e4']);
  });
});

describe('legality (xq-001)', () => {
  it('a pinned piece cannot make a move that leaves its own general in check', () => {
    // A rook pins the advisor to the general along the e-file: the advisor has nowhere legal to go.
    expect(targets('k8/4r4/9/9/9/9/9/9/4A4/4K4 w - - 0 1', 'e2')).toEqual([]);
  });

  it('only check-escaping moves are legal when the general is in check', () => {
    // A white horse checks the black general; the soldier on the e-file only blocks the two generals
    // from facing and takes no other part. Both palace-corner escapes are legal, nothing else is.
    const fen = '4k4/4p4/3N5/9/9/9/9/9/9/4K4 b - - 0 1';
    expect(new Game(fen).legalUci().sort()).toEqual(['e10d10', 'e10f10']);
  });
});

describe('checkmate (xq-001)', () => {
  it('reports checkmate and leaves no legal moves', () => {
    // Reached by seeded random self-play against Fairy-Stockfish (ffish 0.7.10), which agrees: "Pxd8#", 1-0.
    const fen = 'r2a2r2/3k4n/3aP4/9/n1b6/8p/P5p2/4R3B/3KA4/2B6 w - - 8 29';
    const g = new Game(fen);
    expect(g.isGameOver()).toBe(false);
    const record = g.move('e8d8');
    expect(record.san).toBe('Pxd8#');
    expect(g.status()).toEqual({ kind: 'checkmate', winner: 'w' });
    expect(g.isGameOver()).toBe(true);
    expect(g.legalUci()).toEqual([]);
  });
});

describe('moveToUci', () => {
  it('formats a plain move as fromTo', () => {
    expect(moveToUci({ from: 0, to: 9 })).toBe('a1a2');
  });
});
