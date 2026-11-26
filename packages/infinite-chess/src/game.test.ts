import { describe, expect, it } from 'vitest';
import { FenError, IllegalMoveError } from './game';
import { Game } from './game';
import { START_FEN } from './fen';
import { infiniteChess } from './variant';
import { describeVariantConformance } from '@chaturanga/rules-core/testing';

describeVariantConformance(infiniteChess, {
  fens: [
    'K-9007199254740993,0|k9007199254740993,0|r-4,100 w - - 6 12',
    'R-5,0|K0,0|k10,10 b - - 0 1',
  ],
  invalidFens: ['broken', 'K0,0|k1,1 w - - 0 1', 'K0,0|k10,10|P4,8 w - - 0 1'],
  illegalMoves: ['not-a-coordinate-move', '1,2>1,5', '1,2>1,8q'],
  sampleSquares: (game) => [
    ...game.pieces().map(({ square }) => square),
    '9007199254740993,-9007199254740993',
    '-9007199254740993,9007199254740993',
  ],
  destinationOfMove: (uci) => uci.split('>')[1]!.replace(/[qrbn]$/, ''),
  sampleLegalMove: (game) => {
    for (const { square, piece } of game.pieces()) {
      if (piece.color !== game.turn) continue;
      const [x, y] = square.split(',').map(BigInt) as [bigint, bigint];
      const offsets: readonly (readonly [bigint, bigint])[] = piece.type === 'n'
        ? [[1n, 2n], [2n, 1n], [-1n, 2n], [-2n, 1n], [1n, -2n], [2n, -1n], [-1n, -2n], [-2n, -1n]]
        : [[1n, 0n], [-1n, 0n], [0n, 1n], [0n, -1n], [1n, 1n], [1n, -1n], [-1n, 1n], [-1n, -1n]];
      const targets = offsets.map(([dx, dy]) => `${x + dx},${y + dy}`);
      if (piece.type === 'p') targets.push(`${x},${y + (piece.color === 'w' ? 1n : -1n)}`);
      const move = game.legalUciIn(targets)[0];
      if (move) return move;
    }
    return null;
  },
  attackSamples: (game) => game.pieces()
    .filter(({ piece }) => piece.type === 'k')
    .map(({ square, piece }) => ({
      color: piece.color === 'w' ? 'b' : 'w',
      square,
      attacked: game.isAttackedAt(piece.color === 'w' ? 'b' : 'w', square),
    })),
});

describe('Infinite Chess Classical', () => {
  it('uses the official 32-piece setup with White to move and no finite move or attack arrays', () => {
    const game = infiniteChess.createGame();
    expect(game.fen()).toBe(START_FEN);
    expect(game.turn).toBe('w');
    expect(game.pieces()).toHaveLength(32);
    expect(game.legalUciIn(['1,3', '1,4', '2,3', '2,4'])).toContain('1,2>1,3');
    expect(game.legalUciIn(['1,3', '1,4', '2,3', '2,4'])).toContain('1,2>1,4');
    expect('legalUci' in game).toBe(false);
    expect('attackedSquares' in game).toBe(false);
  });

  it('keeps exact integer coordinates beyond JavaScript safe integers', () => {
    const game = new Game('K-9007199254740993,0|R-9007199254740993,1|k9007199254740993,0 w - - 0 1');
    const uci = '-9007199254740993,1>-9007199254740992,1';
    expect(game.legalUciIn(['-9007199254740992,1'])).toContain(uci);
    expect(game.move(uci).to).toBe('-9007199254740992,1');
    expect(game.pieceAt('-9007199254740992,1')?.type).toBe('r');
    expect(game.fen()).toContain('R-9007199254740992,1');
    expect(game.undo()?.uci).toBe(uci);
    expect(game.fen()).toContain('R-9007199254740993,1');
  });

  it('validates arbitrarily long rook rays by sparse blocker queries', () => {
    const game = new Game('K0,0|R0,1|k20,20 w - - 0 1');
    expect(game.legalUciIn(['0,1000000000000'])).toContain('0,1>0,1000000000000');
    const blocked = new Game('K0,0|R0,1|N0,100|k20,20 w - - 0 1');
    expect(blocked.legalUciIn(['0,1000000000000'])).not.toContain('0,1>0,1000000000000');
    expect(blocked.legalUciIn(['0,99'])).toContain('0,1>0,99');
    expect(blocked.legalUciIn(['0,101'])).not.toContain('0,1>0,101');
  });

  it('keeps a pinned piece on the king ray and rejects moves that uncover check', () => {
    const game = new Game('K0,0|R0,1|r0,10|k10,12 w - - 0 1');
    expect(game.inCheck()).toBe(false);
    expect(game.legalUciIn(['0,5', '1,1'])).toContain('0,1>0,5');
    expect(game.legalUciIn(['0,5', '1,1'])).not.toContain('0,1>1,1');
    expect(() => game.move('0,1>1,1')).toThrow(IllegalMoveError);
  });

  it('finds a legal interposition across a million empty squares', () => {
    const game = new Game('K0,0|R-1,500000|r0,1000000|k10,10 w - - 0 1');
    expect(game.inCheck()).toBe(true);
    expect(game.status()).toEqual({ kind: 'ongoing' });
    expect(game.legalUciIn(['0,500000'])).toContain('-1,500000>0,500000');
    expect(game.move('-1,500000>0,500000').color).toBe('w');
    expect(game.inCheck()).toBe(false);
  });

  it('recognizes stalemate and checkmate without enumerating empty rays', () => {
    const stalemate = new Game('K0,0|r1,2|r2,1|r-1,2|r-2,1|r1,-2|r2,-1|r-1,-2|r-2,-1|k20,20 w - - 0 1');
    expect(stalemate.inCheck()).toBe(false);
    expect(stalemate.status()).toEqual({ kind: 'stalemate' });

    const mate = new Game('k0,0|Q0,2|R1,2|R2,1|R-1,2|R-2,1|R1,-2|R2,-1|R-1,-2|R-2,-1|K20,20 b - - 0 1');
    expect(mate.inCheck()).toBe(true);
    expect(mate.status()).toEqual({ kind: 'checkmate', winner: 'w' });
  });

  it('supports orthodox castling only across clear and unattacked squares', () => {
    const game = new Game('K5,1|R1,1|R8,1|k5,8 w KQ - 0 1');
    expect(game.legalUciIn(['7,1', '3,1'])).toContain('5,1>7,1');
    expect(game.legalUciIn(['7,1', '3,1'])).toContain('5,1>3,1');
    game.move('5,1>7,1');
    expect(game.pieceAt('7,1')?.type).toBe('k');
    expect(game.pieceAt('6,1')?.type).toBe('r');
    expect(game.fen().split(' ')[2]).toBe('-');

    const attacked = new Game('K5,1|R1,1|R8,1|r6,8|k5,10 w KQ - 0 1');
    expect(attacked.legalUciIn(['7,1'])).not.toContain('5,1>7,1');
  });

  it('supports en passant, four promotion choices, and halfmove resets', () => {
    const enPassant = new Game('K5,1|P1,4|p2,4|k5,8 b - 1,3 0 1');
    const ep = enPassant.move('2,4>1,3');
    expect(ep.action).toBe('capture');
    expect(ep.captured).toMatchObject({ color: 'w', type: 'p' });
    expect(enPassant.pieceAt('1,4')).toBeNull();

    const promotion = new Game('K0,0|P0,7|k10,10 w - - 0 1');
    expect(promotion.legalUciIn(['0,8'])).toEqual(['0,7>0,8q', '0,7>0,8r', '0,7>0,8b', '0,7>0,8n']);
    expect(() => promotion.move('0,7>0,8')).toThrow(IllegalMoveError);
    promotion.move('0,7>0,8n');
    expect(promotion.pieceAt('0,8')?.type).toBe('n');

    const clock = new Game('K0,0|R1,0|k10,10 w - - 99 1');
    clock.move('1,0>2,0');
    expect(clock.halfmoveClock()).toBe(100);
    expect(clock.status()).toEqual({ kind: 'fifty-move' });
  });

  it('rejects impossible en-passant targets and double-push origins', () => {
    expect(() => new Game('K0,0|P1,4|p2,4|N2,5|k10,10 w - 2,5 0 2')).toThrow(FenError);
    expect(() => new Game('K0,0|P1,4|p2,4|N2,6|k10,10 w - 2,5 0 2')).toThrow(FenError);
  });

  it('ends on the third occurrence of a position and restores repetition history on undo', () => {
    const game = new Game('K0,0|R100,100|k10,10 w - - 0 1');
    const cycle = ['0,0>0,1', '10,10>10,11', '0,1>0,0', '10,11>10,10'];
    for (const uci of [...cycle, ...cycle]) game.move(uci);
    expect(game.status()).toEqual({ kind: 'repetition' });
    game.undo();
    expect(game.status()).toEqual({ kind: 'ongoing' });
    for (let i = 0; i < 7; i++) game.undo();
    expect(game.status()).toEqual({ kind: 'ongoing' });
  });

  it('rejects impossible positions and preserves the current FEN after bad moves', () => {
    expect(() => new Game('K0,0|k1,1 w - - 0 1')).toThrow(FenError);
    const game = new Game();
    const before = game.fen();
    expect(() => game.move('1,2>1,7')).toThrow(IllegalMoveError);
    expect(game.fen()).toBe(before);
  });
});
