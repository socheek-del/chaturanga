import { describe, expect, it } from 'vitest';
import { squareOf } from '@chaturanga/rules-core';
import { describeVariantConformance } from '@chaturanga/rules-core/testing';
import { Game, FenError, parseFen, serializeFen } from './game';
import { pieceCode, type PieceType } from './board';
import { arimaa } from './variant';

interface FixturePiece {
  type: PieceType;
  color: 'w' | 'b';
  square: string;
}

function fenFromPieces(pieces: readonly FixturePiece[], turn: 'w' | 'b' = 'w'): string {
  const board = new Uint8Array(64);
  for (const piece of pieces) {
    const square = squareOf(piece.square, 8);
    if (square === null || board[square]) throw new Error(`Invalid fixture square ${piece.square}`);
    board[square] = pieceCode(piece.type, piece.color);
  }
  return serializeFen({ board, hands: { w: [], b: [] }, turn, halfmove: 0, fullmove: 1 });
}

describe('Arimaa setup and FEN', () => {
  it('starts empty with both full armies in hand and Gold to place first', () => {
    const game = new Game();
    expect(game.fen()).toBe(arimaa.startFen);
    expect(game.pieces()).toEqual([]);
    expect(game.hand('w')).toHaveLength(16);
    expect(game.hand('b')).toHaveLength(16);
    expect(game.turn).toBe('w');
    expect(game.legalUci()).toHaveLength(96);
    expect(parseFen(game.fen())).toMatchObject({ turn: 'w' });
  });

  it('keeps Gold in its setup phase until its full army is placed, then gives setup to Silver', () => {
    const game = new Game();
    const gold = ['E@a1', 'M@b1', 'H@c1', 'H@d1', 'D@e1', 'D@f1', 'C@g1', 'C@h1', ...'abcdefgh'.split('').map((file) => `R@${file}2`)];
    for (const [index, uci] of gold.entries()) {
      game.move(uci);
      expect(game.turn).toBe(index === 15 ? 'b' : 'w');
    }
    expect(game.hand('w')).toEqual([]);
    expect(game.hand('b')).toHaveLength(16);
    expect(game.legalUci().every((uci) => /@[a-h][78]$/.test(uci))).toBe(true);
    const silver = ['E@a8', 'M@b8', 'H@c8', 'H@d8', 'D@e8', 'D@f8', 'C@g8', 'C@h8', ...'abcdefgh'.split('').map((file) => `R@${file}7`)];
    for (const [index, uci] of silver.entries()) {
      game.move(uci);
      expect(game.turn).toBe(index === 15 ? 'w' : 'b');
    }
    expect(game.hand('b')).toEqual([]);
    expect(game.pieces()).toHaveLength(32);
    expect(game.fen()).toBe(serializeFen(parseFen(game.fen())));
    expect(game.status()).toEqual({ kind: 'ongoing' });
  });

  it('round-trips a partial setup and undoes the last placement', () => {
    const game = new Game();
    game.move('E@a1');
    const partial = game.fen();
    expect(new Game(partial).fen()).toBe(partial);
    expect(game.undo()?.uci).toBe('E@a1');
    expect(game.fen()).toBe(arimaa.startFen);
    expect(game.turn).toBe('w');
  });

  it('rejects out-of-order setup and wrong-side home-rank pieces', () => {
    expect(() => new Game(arimaa.startFen.replace(' w ', ' b '))).toThrow(FenError);
    const badRank = '8/8/8/8/8/7R/8/8[EMHHDDCCRRRRRRRremhhddccrrrrrrrr] w - - 0 1';
    expect(() => new Game(badRank)).toThrow(FenError);
  });
});

describe('Arimaa movement and complete turns', () => {
  it('lets Rabbits advance but not retreat under their own power', () => {
    const game = new Game(fenFromPieces([
      { type: 'r', color: 'w', square: 'd4' },
      { type: 'r', color: 'b', square: 'a8' },
    ]));
    const legal = game.legalUci();
    expect(legal).toContain('d4d5');
    expect(legal).not.toContain('d4d3');
  });

  it('unfreezes a piece when a friendly neighbor supports it', () => {
    const game = new Game(fenFromPieces([
      { type: 'r', color: 'w', square: 'd4' },
      { type: 'c', color: 'w', square: 'c4' },
      { type: 'e', color: 'b', square: 'd5' },
      { type: 'r', color: 'b', square: 'h8' },
    ]));
    expect(game.legalUci()).toContain('d4e4');
  });

  it('offers legal push and pull sequences as two indivisible steps', () => {
    const game = new Game(fenFromPieces([
      { type: 'e', color: 'w', square: 'c4' },
      { type: 'r', color: 'w', square: 'a1' },
      { type: 'r', color: 'b', square: 'd4' },
      { type: 'r', color: 'b', square: 'h8' },
    ]));
    const legal = game.legalUci();
    expect(legal).toContain('d4d5c4d4');
    expect(legal).toContain('c4c5d4c4');
    expect(game.move('c4c5d4c4').multiPieceMove).toBe(true);
    expect(game.pieceAt(squareOf('c4', 8)!)).toMatchObject({ color: 'b', type: 'r' });
    expect(game.turn).toBe('b');
  });

  it('completes a pull even when the pulling piece is captured on a trap during its first step', () => {
    const game = new Game(fenFromPieces([
      { type: 'e', color: 'w', square: 'c2' },
      { type: 'r', color: 'w', square: 'a1' },
      { type: 'r', color: 'b', square: 'b2' },
      { type: 'r', color: 'b', square: 'h8' },
    ]));
    const record = game.move('c2c3b2c2');
    expect(record.captured).toMatchObject({ color: 'w', type: 'e' });
    expect(game.pieceAt(squareOf('c3', 8)!)).toBeNull();
    expect(game.pieceAt(squareOf('c2', 8)!)).toMatchObject({ color: 'b', type: 'r' });
  });

  it('enumerates unique complete turns from a fully set-up opening position', () => {
    const game = new Game('emhhddcc/rrrrrrrr/8/8/8/8/RRRRRRRR/EMHHDDCC w - - 0 1');
    const legal = game.legalUci();
    expect(legal.length).toBeGreaterThan(10_000);
    expect(new Set(legal).size).toBe(legal.length);
    expect(legal).toContain('a2a3');
    expect(legal).toContain('a2a3a3a4');
    const longTurn = legal.find((uci) => uci.length > 12);
    expect(longTurn).toBeTruthy();
    expect(() => game.move(longTurn!)).not.toThrow();
  });

  it('does not push equal-strength pieces', () => {
    const game = new Game(fenFromPieces([
      { type: 'c', color: 'w', square: 'c4' },
      { type: 'r', color: 'w', square: 'a1' },
      { type: 'c', color: 'b', square: 'd4' },
      { type: 'r', color: 'b', square: 'h8' },
    ]));
    expect(game.legalUci().some((uci) => uci.startsWith('d4d5c4d4'))).toBe(false);
  });

  it('captures a piece immediately when its last friendly trap support moves away', () => {
    const game = new Game(fenFromPieces([
      { type: 'e', color: 'w', square: 'b3' },
      { type: 'r', color: 'w', square: 'c3' },
      { type: 'r', color: 'w', square: 'a1' },
      { type: 'r', color: 'b', square: 'h8' },
    ]));
    const record = game.move('b3b2');
    expect(record.captured).toMatchObject({ color: 'w', type: 'r' });
    expect(game.pieceAt(squareOf('c3', 8)!)).toBeNull();
  });

  it('accepts up to four steps in one move and rejects a net-pass turn', () => {
    const game = new Game(fenFromPieces([
      { type: 'r', color: 'w', square: 'a2' },
      { type: 'r', color: 'b', square: 'h7' },
    ]));
    const fourSteps = 'a2a3a3a4a4a5a5a6';
    expect(game.legalUci()).toContain(fourSteps);
    expect(game.move(fourSteps).color).toBe('w');
    expect(game.turn).toBe('b');
    expect(game.moves()).toHaveLength(1);

    const pass = new Game(fenFromPieces([
      { type: 'e', color: 'w', square: 'c4' },
      { type: 'r', color: 'w', square: 'a1' },
      { type: 'r', color: 'b', square: 'h8' },
    ]));
    expect(pass.legalUci()).not.toContain('c4c5c5c4');
  });

  it('applies goal priority and rabbit-elimination endings', () => {
    const goal = new Game(fenFromPieces([
      { type: 'r', color: 'w', square: 'a8' },
      { type: 'r', color: 'b', square: 'h1' },
    ], 'b'));
    expect(goal.status()).toEqual({ kind: 'goal-square', winner: 'w' });

    const elimination = new Game(fenFromPieces([
      { type: 'e', color: 'w', square: 'a1' },
      { type: 'r', color: 'b', square: 'h8' },
    ], 'w'));
    expect(elimination.status()).toEqual({ kind: 'elimination', winner: 'b' });
  });

  it('rejects a turn that would make the same board and side-to-move occur a third time', () => {
    const game = new Game(fenFromPieces([
      { type: 'r', color: 'w', square: 'a1' },
      { type: 'e', color: 'w', square: 'c4' },
      { type: 'e', color: 'b', square: 'f4' },
      { type: 'r', color: 'b', square: 'h8' },
    ]));
    for (const uci of ['c4c5', 'f4f5', 'c5c4', 'f5f4']) game.move(uci);
    for (const uci of ['c4c5', 'f4f5', 'c5c4']) game.move(uci);
    expect(game.legalUci()).not.toContain('f5f4');
    expect(() => game.move('f5f4')).toThrow();
    expect(game.status()).toEqual({ kind: 'ongoing' });
  });

  it('awards immobilization when every piece of the side to move is frozen or blocked', () => {
    const game = new Game(fenFromPieces([
      { type: 'r', color: 'w', square: 'd4' },
      { type: 'e', color: 'b', square: 'd5' },
      { type: 'r', color: 'b', square: 'h8' },
    ]));
    expect(game.legalUci()).toEqual([]);
    expect(game.status()).toEqual({ kind: 'stalemate', winner: 'b' });
  });
});

describeVariantConformance(arimaa, {
  fens: [],
  invalidFens: ['8/8/8/8/8/8/8/8[EMHHDDCCRRRRRRRRemhhddccrrrrrrrr] b - - 0 1'],
  illegalMoves: ['a1a2', 'E@a9'],
  sampleLegalMove: (game, rng) => game.sampleLegalUci(rng),
}, { seededGamesMs: 180_000, attackedSquaresMs: 180_000 });
