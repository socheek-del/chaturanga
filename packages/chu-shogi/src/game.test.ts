import { describeVariantConformance } from '@chaturanga/rules-core/testing';
import { describe, expect, it } from 'vitest';
import { Game, chuShogi, START_FEN } from './index';
import { fenOf, makePiece, square, startingPosition, type Position } from './position';

describeVariantConformance(chuShogi, {
  fens: [fenOf({ ...startingPosition(), turn: 'b' })],
  invalidFens: ['', `${START_FEN} trailing`, START_FEN.replace(' w ', ' x ')],
  illegalMoves: ['a1a3', 'a1a1', '???', 'P@a1'],
});

describe('Chu Shogi game session', () => {
  it('plays, records, serializes, and undoes a complete move', () => {
    const game = new Game();
    const record = game.move('a4a5');
    expect(record).toMatchObject({ uci: 'a4a5', san: 'a4–a5', color: 'w', to: square('a5'), captured: null });
    expect(game.turn).toBe('b');
    expect(game.pieceAt(square('a4'))).toBeNull();
    expect(game.pieceAt(square('a5'))).toMatchObject({ type: 'pawn', color: 'w' });
    expect(game.lastMove()).toBe(record);
    expect(game.moves()).toEqual([record]);

    const replayed = new Game();
    replayed.move(record.uci);
    expect(replayed.fen()).toBe(game.fen());

    expect(game.undo()).toBe(record);
    expect(game.fen()).toBe(START_FEN);
    expect(game.undo()).toBeNull();
  });

  it('does not restrict a move that leaves the King under attack', () => {
    const position: Position = { board: Array.from({ length: 144 }, () => null), turn: 'w', counterstrike: null, ply: 0 };
    position.board[square('f1')] = makePiece('w', 'king');
    position.board[square('a1')] = makePiece('w', 'pawn');
    position.board[square('g12')] = makePiece('b', 'king');
    position.board[square('f12')] = makePiece('b', 'rook');
    const game = new Game(fenOf(position));
    expect(game.inCheck()).toBe(true);
    expect(game.legalUci()).toContain('f1f2');
  });

  it('keeps attack-map squares unique, sorted, and on the 12×12 board', () => {
    const game = new Game();
    const attacks = game.attackedSquares('w');
    expect(attacks).toEqual([...new Set(attacks)].sort((a, b) => a - b));
    expect(attacks.every((square) => square >= 0 && square < 144)).toBe(true);
  });

  it('includes defended friendly squares and intermediate Lion captures in the attack map', () => {
    const position: Position = { board: Array.from({ length: 144 }, () => null), turn: 'w', counterstrike: null, ply: 0 };
    position.board[square('f6')] = makePiece('w', 'lion');
    position.board[square('g6')] = makePiece('b', 'pawn');
    position.board[square('f5')] = makePiece('w', 'gold-general');
    const game = new Game(fenOf(position));
    const attacks = game.attackedSquares('w');
    expect(attacks).toContain(square('f6')); // The Gold General defends the friendly Lion.
    expect(attacks).toContain(square('g6')); // The Lion captures here, then returns to f6.
  });
});
