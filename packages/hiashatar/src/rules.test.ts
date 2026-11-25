import { describeVariantConformance, mulberry32 } from '@chaturanga/rules-core/testing';
import { squareOf as parseSquare } from '@chaturanga/rules-core';
import { describe, expect, it } from 'vitest';
import { Game, hiashatar } from './index';
import { FILES, PIECE_TYPES, RANKS, START_FEN, squareName, type PieceType } from './position';

interface Man { square: string; type: PieceType; color: 'w' | 'b' }
function makeFen(men: readonly Man[], turn: 'w' | 'b' = 'w', ep = '-'): string {
  const board = Array.from({ length: FILES * RANKS }, () => '');
  for (const man of men) {
    const file = man.square.charCodeAt(0) - 97;
    const rank = Number(man.square.slice(1)) - 1;
    board[rank * FILES + file] = man.color === 'w' ? man.type.toUpperCase() : man.type;
  }
  const rows: string[] = [];
  for (let rank = RANKS - 1; rank >= 0; rank--) {
    let row = '';
    let empty = 0;
    for (let file = 0; file < FILES; file++) {
      const piece = board[rank * FILES + file];
      if (!piece) { empty++; continue; }
      if (empty) row += empty;
      empty = 0;
      row += piece;
    }
    rows.push(row + (empty || ''));
  }
  return `${rows.join('/')} ${turn} - ${ep} 0 1`;
}
const man = (square: string, type: PieceType, color: 'w' | 'b'): Man => ({ square, type, color });
const afterBlackTriple = makeFen([
  man('a1', 'k', 'w'), man('j10', 'k', 'b'), man('e9', 'p', 'b'), man('d6', 'p', 'w'), man('d7', 'p', 'w'),
], 'b');
const mateBefore = makeFen([man('c8', 'k', 'w'), man('b8', 'q', 'w'), man('a10', 'k', 'b')]);

describeVariantConformance(hiashatar, {
  fens: [mateBefore, makeFen([man('a1', 'k', 'w'), man('j10', 'k', 'b'), man('e6', 'p', 'b'), man('d6', 'p', 'w')], 'w', 'e7,e8')],
  invalidFens: ['', '8k/10/10/10/10/10/10/10/10/K9 w - - 0 1', START_FEN.replace(' w - - ', ' w K - ')],
  illegalMoves: ['a2a6', 'a1a4', 'e2e6', 'e1g1'],
  checkmate: { fen: mateBefore, move: 'b8b9', winner: 'w' },
});

describe('Hiashatar rules', () => {
  it('uses the mirrored ten-file setup with two bodyguards per side', () => {
    const game = new Game();
    expect(game.fen()).toBe(START_FEN);
    expect(game.pieces()).toHaveLength(40);
    expect(game.pieces().filter(({ piece }) => piece.type === 'h')).toHaveLength(4);
    expect(game.pieceAt(parseSquare('e1', FILES)!)?.type).toBe('k');
    expect(game.pieceAt(parseSquare('f1', FILES)!)?.type).toBe('q');
    expect(game.pieceAt(parseSquare('e10', FILES)!)?.type).toBe('q');
    expect(game.pieceAt(parseSquare('f10', FILES)!)?.type).toBe('k');
    expect(PIECE_TYPES).toEqual(['p', 'n', 'b', 'h', 'q', 'r', 'k']);
    expect(squareName(parseSquare('j10', FILES)!)).toBe('j10');
  });

  it('lets starting pawns choose one, two or three clear squares', () => {
    const moves = new Game().legalUci();
    expect(moves).toEqual(expect.arrayContaining(['e2e3', 'e2e4', 'e2e5']));
    expect(moves).not.toContain('e2e6');
  });

  it('stops sliding pieces on first entering an opposing bodyguard zone', () => {
    const game = new Game(makeFen([man('a1', 'k', 'w'), man('j10', 'k', 'b'), man('e1', 'r', 'w'), man('e5', 'h', 'b')]));
    const moves = game.legalUci();
    expect(moves).toContain('e1e4');
    expect(moves).not.toContain('e1e5');
    expect(moves).not.toContain('e1e10');
  });

  it('limits pieces that start inside an enemy zone to one square', () => {
    const game = new Game(makeFen([man('a1', 'k', 'w'), man('j10', 'k', 'b'), man('e4', 'r', 'w'), man('e5', 'h', 'b')]));
    const moves = game.legalUci();
    expect(moves).toContain('e4e3');
    expect(moves).toContain('e4e5');
    expect(moves).not.toContain('e4e6');
  });

  it('gives the hia a two-square queen-like move', () => {
    const game = new Game(makeFen([man('a1', 'k', 'w'), man('j10', 'k', 'b'), man('e4', 'h', 'w')]));
    const moves = game.legalUci();
    expect(moves).toEqual(expect.arrayContaining(['e4e6', 'e4g4', 'e4c4', 'e4g6']));
    expect(moves).not.toContain('e4e7');
  });

  it('does not slow friendly pieces and exempts horses from hostile zones', () => {
    const friendly = new Game(makeFen([
      man('a1', 'k', 'w'), man('j10', 'k', 'b'), man('e1', 'r', 'w'), man('d5', 'h', 'w'),
    ]));
    expect(friendly.legalUci()).toContain('e1e10');
    const horse = new Game(makeFen([
      man('a1', 'k', 'w'), man('j10', 'k', 'b'), man('c3', 'n', 'w'), man('e5', 'h', 'b'),
    ]));
    expect(horse.legalUci()).toContain('c3d5');
  });

  it('does not let a bodyguard check or capture the opposing king', () => {
    const game = new Game(makeFen([man('a1', 'k', 'w'), man('e5', 'k', 'b'), man('d4', 'h', 'w')]));
    expect(game.inCheck()).toBe(false);
    expect(game.attackedSquares('w')).not.toContain(parseSquare('e5', FILES));
    expect(game.legalUci()).not.toContain('d4e5');
  });

  it('offers both en passant destinations after a triple advance and removes the same pawn', () => {
    for (const [move, target] of [['d6e7', 'e7'], ['d7e8', 'e8']] as const) {
      const game = new Game(afterBlackTriple);
      game.move('e9e6');
      expect(game.fen().split(' ')[3]).toBe('e8,e7');
      expect(game.legalUci()).toContain(move);
      const record = game.move(move);
      expect(record.captured).toEqual({ color: 'b', type: 'p', promoted: false });
      expect(record.to).toBe(parseSquare(target, FILES));
      expect(game.pieceAt(parseSquare('e6', FILES)!)).toBeNull();
      expect(game.pieceAt(parseSquare(target, FILES)!)?.color).toBe('w');
      const saved = new Game(game.fen());
      expect(saved.fen()).toBe(game.fen());
      expect(game.undo()?.uci).toBe(move);
      expect(game.pieceAt(parseSquare('e6', FILES)!)?.color).toBe('b');
      expect(game.fen().split(' ')[3]).toBe('e8,e7');
    }
  });

  it('stores the single intermediate square after a double advance', () => {
    const game = new Game(makeFen([man('a1', 'k', 'w'), man('j10', 'k', 'b'), man('e9', 'p', 'b'), man('d7', 'p', 'w')], 'b'));
    game.move('e9e7');
    expect(game.fen().split(' ')[3]).toBe('e8');
    expect(game.legalUci()).toContain('d7e8');
  });

  it('offers both mirrored en passant destinations after a white triple advance', () => {
    const game = new Game(makeFen([
      man('a1', 'k', 'w'), man('j10', 'k', 'b'), man('e2', 'p', 'w'), man('d4', 'p', 'b'), man('d5', 'p', 'b'),
    ]));
    game.move('e2e5');
    expect(game.fen().split(' ')[3]).toBe('e3,e4');
    expect(game.legalUci()).toEqual(expect.arrayContaining(['d4e3', 'd5e4']));
    for (const move of ['d4e3', 'd5e4']) {
      const copy = new Game(game.fen());
      copy.move(move);
      expect(copy.pieceAt(parseSquare('e5', FILES)!)).toBeNull();
      expect(copy.moves()[0]!.captured?.type).toBe('p');
    }
  });

  it('rejects en passant when removing its victim exposes the king', () => {
    const game = new Game(makeFen([
      man('j6', 'k', 'w'), man('j10', 'k', 'b'), man('a6', 'r', 'b'), man('e9', 'p', 'b'), man('d6', 'p', 'w'),
    ], 'b'));
    game.move('e9e6');
    expect(game.legalUci()).not.toContain('d6e7');
  });

  it('promotes to a bers on the far rank', () => {
    const game = new Game(makeFen([man('j1', 'k', 'w'), man('a10', 'k', 'b'), man('e9', 'p', 'w')]));
    expect(game.legalUci()).toContain('e9e10q');
    game.move('e9e10q');
    expect(game.pieceAt(parseSquare('e10', FILES)!)).toMatchObject({ type: 'q', promoted: true });
  });

  it('replays, undoes and serializes seeded games', () => {
    for (let seed = 1; seed <= 4; seed++) {
      const random = mulberry32(seed);
      const game = new Game();
      const fens = [game.fen()];
      for (let ply = 0; ply < 90 && !game.isGameOver(); ply++) {
        const moves = game.legalUci();
        game.move(moves[Math.floor(random() * moves.length)]!);
        fens.push(game.fen());
      }
      const replay = new Game();
      for (const { uci } of game.moves()) replay.move(uci);
      expect(replay.fen()).toBe(game.fen());
      expect(replay.status()).toEqual(game.status());
      for (let i = fens.length - 1; i > 0; i--) {
        expect(game.fen()).toBe(fens[i]);
        expect(game.undo()).not.toBeNull();
      }
      expect(game.fen()).toBe(fens[0]);
    }
  });
});
