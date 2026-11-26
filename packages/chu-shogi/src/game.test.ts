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

  it('requires every remaining royal to be taken before capture victory', () => {
    const withPrince: Position = { board: Array.from({ length: 144 }, () => null), turn: 'w', counterstrike: null, ply: 0 };
    withPrince.board[square('a1')] = makePiece('w', 'king');
    withPrince.board[square('a2')] = makePiece('w', 'bishop');
    withPrince.board[square('h1')] = makePiece('w', 'rook');
    withPrince.board[square('h8')] = makePiece('b', 'king');
    withPrince.board[square('g8')] = makePiece('b', 'drunk-elephant', true);
    const game = new Game(fenOf(withPrince));
    game.move('h1h8');
    expect(game.status()).toEqual({ kind: 'ongoing' });

    const princeOnly: Position = { ...withPrince, board: withPrince.board.map((piece) => piece ? { ...piece } : null) };
    princeOnly.board[square('h8')] = null;
    princeOnly.board[square('h1')] = null;
    princeOnly.board[square('h8')] = makePiece('w', 'rook');
    princeOnly.turn = 'w';
    const lastRoyal = new Game(fenOf(princeOnly));
    lastRoyal.move('h8g8');
    expect(lastRoyal.status()).toEqual({ kind: 'checkmate', winner: 'w' });
  });

  it('recognizes forced royal mate when no reply prevents taking every royal', () => {
    const mate = (princeSquare: string): Position => {
      const position: Position = { board: Array.from({ length: 144 }, () => null), turn: 'b', counterstrike: null, ply: 0 };
      position.board[square('a1')] = makePiece('b', 'king');
      position.board[square(princeSquare)] = makePiece('b', 'drunk-elephant', true);
      position.board[square('c1')] = makePiece('w', 'lion');
      position.board[square('l12')] = makePiece('w', 'king');
      for (const file of 'abcdefghijkl') {
        const rankOne = `${file}1`;
        if (rankOne !== princeSquare && rankOne !== 'c1' && rankOne !== 'a1') position.board[square(rankOne)] = makePiece('b', 'pawn');
        position.board[square(`${file}2`)] = makePiece('b', 'pawn');
      }
      position.counterstrike = { forbiddenColor: 'b', protectedLion: square('c1') };
      return position;
    };

    const allRoyalsReachable = new Game(fenOf(mate('b1')));
    expect(allRoyalsReachable.legalUci()).toEqual([]);
    expect(allRoyalsReachable.status()).toEqual({ kind: 'checkmate', winner: 'w' });

    const royalsNeedSeparateMoves = new Game(fenOf(mate('d1')));
    expect(royalsNeedSeparateMoves.legalUci()).toEqual([]);
    expect(royalsNeedSeparateMoves.status()).toEqual({ kind: 'stalemate', winner: 'w' });
  });

  it('applies the narrow barren-material rule and the no-move loss convention', () => {
    const bareKings = (): Position => {
      const position: Position = { board: Array.from({ length: 144 }, () => null), turn: 'w', counterstrike: null, ply: 0 };
      position.board[square('a1')] = makePiece('w', 'king');
      position.board[square('l12')] = makePiece('b', 'king');
      return position;
    };

    const eligible = bareKings();
    eligible.board[square('f6')] = makePiece('w', 'rook');
    expect(new Game(fenOf(eligible)).status()).toEqual({ kind: 'bare-king', winner: 'w' });

    const pawnOnly = bareKings();
    pawnOnly.board[square('f6')] = makePiece('w', 'pawn');
    expect(new Game(fenOf(pawnOnly)).status().kind).not.toBe('bare-king');

    const deadPawn = bareKings();
    deadPawn.board[square('f6')] = makePiece('w', 'rook');
    deadPawn.board[square('b1')] = makePiece('b', 'pawn');
    expect(new Game(fenOf(deadPawn)).status()).toEqual({ kind: 'bare-king', winner: 'w' });

    const noMove: Position = { board: Array.from({ length: 144 }, () => null), turn: 'b', counterstrike: null, ply: 0 };
    noMove.board[square('a1')] = makePiece('b', 'king');
    noMove.board[square('c4')] = makePiece('w', 'lion');
    noMove.board[square('l12')] = makePiece('w', 'king');
    for (const file of 'bcdefghijkl') noMove.board[square(`${file}1`)] = makePiece('b', 'pawn');
    for (const file of 'abcdefghijkl') noMove.board[square(`${file}2`)] = makePiece('b', 'pawn');
    noMove.counterstrike = { forbiddenColor: 'b', protectedLion: square('c4') };
    const blocked = new Game(fenOf(noMove));
    expect(blocked.inCheck()).toBe(false);
    expect(blocked.legalUci()).toEqual([]);
    expect(blocked.status()).toEqual({ kind: 'stalemate', winner: 'w' });
  });

  it('awards a repetition to the Renmei duty-to-vary side', () => {
    const position: Position = { board: Array.from({ length: 144 }, () => null), turn: 'w', counterstrike: null, ply: 0 };
    position.board[square('a1')] = makePiece('w', 'king');
    position.board[square('b2')] = makePiece('w', 'rook');
    position.board[square('l12')] = makePiece('b', 'king');
    position.board[square('k11')] = makePiece('b', 'rook');
    const game = new Game(fenOf(position));
    for (let cycle = 0; cycle < 3; cycle++) {
      game.move('a1a2');
      game.move('l12l11');
      game.move('a2a1');
      game.move('l11l12');
    }
    expect(game.status()).toEqual({ kind: 'repetition', winner: 'b' });
  });

  it('assigns repeated Jitto turns to the first passer', () => {
    const position: Position = { board: Array.from({ length: 144 }, () => null), turn: 'w', counterstrike: null, ply: 0 };
    position.board[square('a1')] = makePiece('w', 'king');
    position.board[square('f6')] = makePiece('w', 'lion');
    position.board[square('l12')] = makePiece('b', 'king');
    position.board[square('g8')] = makePiece('b', 'lion');
    const game = new Game(fenOf(position));
    for (let cycle = 0; cycle < 3; cycle++) {
      game.move('f6g6f6');
      game.move('g8f8g8');
    }
    expect(game.status()).toEqual({ kind: 'repetition', winner: 'b' });
  });
});
