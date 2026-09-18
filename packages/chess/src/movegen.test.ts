import { describe, expect, it } from 'vitest';
import { Game, IllegalMoveError } from './game';

const movesFrom = (game: Game, square: string): string[] =>
  game
    .legalUci()
    .filter((uci) => uci.startsWith(square))
    .sort();

describe('move generation (ch-001)', () => {
  it('a knight jumps to eight squares from the middle and two from a corner', () => {
    expect(movesFrom(new Game('4k3/8/8/8/3N4/8/8/4K3 w - - 0 1'), 'd4')).toEqual([
      'd4b3',
      'd4b5',
      'd4c2',
      'd4c6',
      'd4e2',
      'd4e6',
      'd4f3',
      'd4f5',
    ]);
    expect(movesFrom(new Game('4k3/8/8/8/8/8/8/N3K3 w - - 0 1'), 'a1')).toEqual(['a1b3', 'a1c2']);
  });

  it('a bishop slides diagonally until something blocks it, and may take the blocker', () => {
    expect(movesFrom(new Game('4k3/8/8/8/3B4/8/1p6/4K3 w - - 0 1'), 'd4')).toEqual([
      'd4a7',
      'd4b2',
      'd4b6',
      'd4c3',
      'd4c5',
      'd4e3',
      'd4e5',
      'd4f2',
      'd4f6',
      'd4g1',
      'd4g7',
      'd4h8',
    ]);
  });

  it('a rook slides on the file and rank, and a queen does both', () => {
    const rook = movesFrom(new Game('4k3/8/8/8/3R4/8/8/4K3 w - - 0 1'), 'd4');
    const queen = movesFrom(new Game('4k3/8/8/8/3Q4/8/8/4K3 w - - 0 1'), 'd4');
    expect(rook).toHaveLength(14);
    expect(queen).toHaveLength(27);
    expect(queen).toEqual(expect.arrayContaining(rook));
  });

  it('a pawn steps one square, two from its own rank, and captures diagonally', () => {
    expect(movesFrom(new Game('4k3/8/8/8/8/8/4P3/4K3 w - - 0 1'), 'e2')).toEqual(['e2e3', 'e2e4']);
    expect(movesFrom(new Game('4k3/8/8/8/8/3p1p2/4P3/4K3 w - - 0 1'), 'e2')).toEqual(['e2d3', 'e2e3', 'e2e4', 'e2f3']);
    // A piece straight ahead stops both steps.
    expect(movesFrom(new Game('4k3/8/8/8/8/4n3/4P3/4K3 w - - 0 1'), 'e2')).toEqual([]);
  });

  it('a king steps one square and never onto an attacked one', () => {
    expect(movesFrom(new Game('4k3/8/8/8/8/8/8/4K3 w - - 0 1'), 'e1')).toEqual(['e1d1', 'e1d2', 'e1e2', 'e1f1', 'e1f2']);
    // The rook on f2 covers the f-file and the second rank, so the king may only step to d1 or take it.
    expect(movesFrom(new Game('4k3/8/8/8/8/8/5r2/4K3 w - - 0 1'), 'e1')).toEqual(['e1d1', 'e1f2']);
  });

  it('castles on both sides, as a king move of two squares', () => {
    expect(movesFrom(new Game('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1'), 'e1')).toContain('e1g1');
    expect(movesFrom(new Game('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1'), 'e1')).toContain('e1c1');
    expect(movesFrom(new Game('r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1'), 'e8')).toContain('e8g8');
    expect(movesFrom(new Game('r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1'), 'e8')).toContain('e8c8');
  });

  it('never castles out of, through or into check, over a piece, or without the right', () => {
    const cases: Array<[string, string]> = [
      ['r3k2r/8/8/8/8/8/8/R3K2R w - - 0 1', 'the right is gone'],
      ['r3k2r/8/8/8/8/8/8/RN2K1NR w KQkq - 0 1', 'a piece is in the way'],
      ['r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1'.replace('8/8/8/8/8/8', '8/8/8/8/4r3/8'), 'the king is in check'],
      ['r3k2r/8/8/8/8/8/5r2/R3K2R w KQkq - 0 1', 'the king would pass through check'],
      ['r3k2r/8/8/8/8/8/6r1/R3K2R w KQkq - 0 1', 'the king would land in check'],
    ];
    for (const [fen, why] of cases) {
      const castles = movesFrom(new Game(fen), 'e1').filter((uci) => uci === 'e1g1' || uci === 'e1c1');
      expect(castles, why).not.toContain('e1g1');
    }
  });

  it('castling queenside is allowed with the b-file square attacked, because the king does not pass it', () => {
    expect(movesFrom(new Game('r3k2r/8/8/8/8/8/1r6/R3K2R w KQkq - 0 1'), 'e1')).toContain('e1c1');
  });

  it('moves the rook as well when it castles', () => {
    const game = new Game('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
    game.move('e1g1');
    expect(game.fen()).toBe('r3k2r/8/8/8/8/8/8/R4RK1 b kq - 1 1');
    const queenside = new Game('r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1');
    queenside.move('e8c8');
    expect(queenside.fen()).toBe('2kr3r/8/8/8/8/8/8/R3K2R w KQ - 1 2');
  });

  it('takes in passing, and only on the move right after the double step', () => {
    const game = new Game('rnbqkbnr/pppppppp/8/4P3/8/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1');
    game.move('d7d5');
    expect(game.legalUci()).toContain('e5d6');
    const record = game.move('e5d6');
    expect(record.san).toBe('exd6');
    expect(record.captured?.type).toBe('p');
    expect(game.fen()).toBe('rnbqkbnr/ppp1pppp/3P4/8/8/8/PPPP1PPP/RNBQKBNR b KQkq - 0 2');

    const late = new Game('rnbqkbnr/pppppppp/8/4P3/8/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1');
    late.move('d7d5');
    late.move('b1c3');
    late.move('b8c6');
    expect(late.legalUci()).not.toContain('e5d6');
  });

  it('will not take in passing when that would expose its own king', () => {
    // White king e1, black rook e8: the e5 pawn is pinned along the file once e5 empties.
    const game = new Game('4r2k/5p2/8/4P3/8/8/8/4K3 b - - 0 1');
    game.move('f7f5');
    expect(game.fen()).toContain(' f6 ');
    expect(game.legalUci()).not.toContain('e5f6');
  });

  it('offers all four promotions, and a capture promotes too', () => {
    const game = new Game('r3k3/1P6/8/8/8/8/8/4K3 w - - 0 1');
    const promotions = game.legalUci().filter((uci) => uci.startsWith('b7'));
    expect(promotions.sort()).toEqual(['b7a8b', 'b7a8n', 'b7a8q', 'b7a8r', 'b7b8b', 'b7b8n', 'b7b8q', 'b7b8r']);
    expect(game.move('b7b8n').san).toBe('b8=N');
  });

  it('a piece pinned to its own king may not move away', () => {
    const game = new Game('4r2k/8/8/8/8/8/4N3/4K3 w - - 0 1');
    expect(movesFrom(game, 'e2')).toEqual([]);
  });

  it('rejects a move that is not legal, and a string that is not a move', () => {
    const game = new Game();
    expect(() => game.move('e2e5')).toThrow(IllegalMoveError);
    expect(() => game.move('zz')).toThrow(IllegalMoveError);
    expect(() => game.move('e1g1')).toThrow(IllegalMoveError);
  });

  it('undoes every kind of move back to the starting position', () => {
    for (const [fen, uci] of [
      ['r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1', 'e1g1'],
      ['r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1', 'e8c8'],
      ['r3k3/1P6/8/8/8/8/8/4K3 w - - 0 1', 'b7a8q'],
      ['rnbqkbnr/pppppppp/8/4P3/8/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1', 'd7d5'],
    ] as const) {
      const game = new Game(fen);
      game.move(uci);
      game.undo();
      expect(game.fen(), `${fen} after ${uci}`).toBe(fen);
      expect(game.moves()).toEqual([]);
    }
  });
});
