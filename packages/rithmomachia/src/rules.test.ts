import { describe, expect, it } from 'vitest';
import { describeVariantConformance } from '@chaturanga/rules-core/testing';
import { BOARD_SIZE, squareAt } from './layout';
import { Game } from './game';
import { type Position, PIECE_TYPES, pieceFromType, serializeFen, START_FEN } from './position';
import { rithmomachia } from './variant';

const blank = (turn: 'w' | 'b' = 'w', capturePlies = 0): Position => ({
  board: Array(BOARD_SIZE).fill(null),
  turn,
  hands: { w: [], b: [] },
  capturePlies,
});

function put(position: Position, color: 'w' | 'b', type: string, file: string, rank: number): void {
  position.board[squareAt(file, rank)] = pieceFromType(color, type, 'fixture');
}

const fen = (position: Position) => serializeFen(position);

describeVariantConformance(rithmomachia, {
  fens: [START_FEN],
  invalidFens: ['r1.A.w.0.-.-', 'not-rithmomachia'],
  illegalMoves: ['a1a2', 'A2@a1', 'a1b2'],
});

describe('Rithmomachia (the common rules family)', () => {
  it('has a compact canonical start position with Black moving first', () => {
    const game = new Game();
    expect(game.turn).toBe('b');
    expect(game.pieces()).toHaveLength(48);
    expect(START_FEN.length).toBeLessThan(200);
    expect(new Game(START_FEN).fen()).toBe(START_FEN);
    expect(new Set(PIECE_TYPES).size).toBe(PIECE_TYPES.length);
    expect(PIECE_TYPES.length).toBeLessThanOrEqual(256);
  });

  it('moves circles one diagonal, triangles two orthogonal, and squares three orthogonal cells without jumping', () => {
    const position = blank();
    put(position, 'w', 'c2', 'a', 1);
    put(position, 'w', 't6', 'c', 3);
    put(position, 'w', 's15', 'a', 5);
    const game = new Game(fen(position));
    const legal = game.legalUci();
    expect(legal).toContain('a1b2');
    expect(legal).not.toContain('a1a2');
    expect(legal).toContain('c3c5');
    expect(legal).not.toContain('c3c4');
    expect(legal).toContain('a5a8');
    expect(legal).not.toContain('a5a7');

    position.board[squareAt('a', 6)] = pieceFromType('w', 'c2', 'fixture');
    expect(new Game(fen(position)).legalUci()).not.toContain('a5a8');
  });

  it('makes a meeting capture as a separate turn and transfers the captured piece', () => {
    const position = blank();
    put(position, 'w', 'c2', 'a', 1);
    put(position, 'b', 'c2', 'b', 2);
    const game = new Game(fen(position));
    const record = game.move('a1b2');
    expect(record.action).toBe('capture');
    expect(record.captured).toMatchObject({ color: 'b', type: 'c2' });
    expect(game.pieceAt(squareAt('a', 1))?.color).toBe('w');
    expect(game.pieceAt(squareAt('b', 2))).toBeNull();
    expect(game.hand('w')).toEqual(['c2']);
    expect(game.turn).toBe('b');
    game.undo();
    expect(game.fen()).toBe(fen(position));
  });

  it('captures by an unobstructed assault and by a two-piece ambuscade', () => {
    const assault = blank();
    put(assault, 'w', 'c2', 'a', 1);
    put(assault, 'b', 'c4', 'd', 1);
    const assaultGame = new Game(fen(assault));
    expect(assaultGame.legalUci()).toContain('a1d1');
    expect(assaultGame.move('a1d1').action).toBe('capture');

    const ambush = blank();
    put(ambush, 'w', 'c2', 'a', 1);
    put(ambush, 'w', 'c4', 'c', 1);
    put(ambush, 'b', 't6', 'b', 2);
    const ambushGame = new Game(fen(ambush));
    expect(ambushGame.legalUci()).toContain('a1b2');
    expect(ambushGame.move('a1b2').action).toBe('capture');
  });

  it('captures a surrounded target by siege', () => {
    const position = blank();
    put(position, 'w', 'c2', 'a', 2);
    put(position, 'w', 'c4', 'c', 2);
    put(position, 'w', 't6', 'b', 1);
    put(position, 'w', 't9', 'b', 3);
    put(position, 'b', 's15', 'b', 2);
    const game = new Game(fen(position));
    expect(game.legalUci()).toContain('b1b2');
    expect(game.move('b1b2').captured?.type).toBe('s15');
  });

  it('captures one pyramid component while preserving the remaining stack, or all components by siege', () => {
    const partial = blank('b');
    put(partial, 'b', 's36', 'd', 5);
    put(partial, 'w', 'p1r', 'g', 5);
    const game = new Game(fen(partial));
    expect(game.legalUci()).toContain('d5g5a');
    const record = game.move('d5g5a');
    expect(record.captured).toMatchObject({ color: 'w', type: 's36' });
    expect(game.pieceAt(squareAt('g', 5))?.type).toBe('p1q');
    expect(game.hand('b')).toEqual(['s36']);

    const siege = blank('w');
    put(siege, 'w', 'c2', 'a', 2);
    put(siege, 'w', 'c4', 'c', 2);
    put(siege, 'w', 't6', 'b', 1);
    put(siege, 'w', 't9', 'b', 3);
    const blackPyramid = `p${(1984).toString(36)}`;
    put(siege, 'b', blackPyramid, 'b', 2);
    const siegeGame = new Game(fen(siege));
    expect(siegeGame.legalUci()).toContain('b1b2z');
    const siegeRecord = siegeGame.move('b1b2z');
    expect(siegeRecord.captures).toHaveLength(5);
    expect(siegeGame.hand('w')).toHaveLength(5);
    expect(siegeGame.pieceAt(squareAt('b', 2))).toBeNull();
  });

  it('drops an exact value from reserve only on the owner’s home rank', () => {
    const position = blank();
    position.hands.w.push('c2');
    const game = new Game(fen(position));
    expect(game.legalUci()).toContain('C2@a1');
    expect(game.legalUci()).not.toContain('C2@a2');
    expect(game.move('C2@a1').action).toBe('drop');
    expect(game.pieceAt(squareAt('a', 1))).toMatchObject({ type: 'c2', color: 'w' });
    expect(game.hand('w')).toEqual([]);
  });

  it('awards the great victory for an arithmetic progression in the opponent’s half', () => {
    const before = blank();
    put(before, 'w', 'c2', 'a', 9);
    put(before, 'w', 'c6', 'c', 9);
    put(before, 'w', 'c4', 'a', 8);
    const game = new Game(fen(before));
    expect(game.status()).toEqual({ kind: 'ongoing' });
    game.move('a8b9');
    expect(game.status()).toEqual({ kind: 'progression', winner: 'w' });
  });

  it('accepts any equal spacing on a straight progression line', () => {
    const position = blank();
    put(position, 'w', 'c2', 'b', 9);
    put(position, 'w', 'c4', 'd', 9);
    put(position, 'w', 'c6', 'f', 9);
    expect(new Game(fen(position)).status()).toEqual({ kind: 'progression', winner: 'w' });
  });

  it('adjudicates repetition and the 200-ply non-capture limit, and awards a blocked side loss', () => {
    const repeat = blank();
    put(repeat, 'w', 'c2', 'a', 1);
    put(repeat, 'b', 'c2', 'h', 16);
    const game = new Game(fen(repeat));
    for (let cycle = 0; cycle < 2; cycle++) {
      game.move('a1b2');
      game.move('h16g15');
      game.move('b2a1');
      game.move('g15h16');
    }
    expect(game.status()).toEqual({ kind: 'repetition' });

    const counting = blank('w', 199);
    put(counting, 'w', 'c2', 'a', 1);
    const countGame = new Game(fen(counting));
    countGame.move('a1b2');
    expect(countGame.status()).toEqual({ kind: 'counting' });

    const blocked = blank('b');
    put(blocked, 'w', 'c2', 'a', 1);
    expect(new Game(fen(blocked)).status()).toEqual({ kind: 'stalemate', winner: 'w' });
  });
});
