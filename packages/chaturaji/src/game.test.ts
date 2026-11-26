import { describe, expect, it } from 'vitest';
import { describeVariantConformance } from '@chaturanga/rules-core/testing';
import { chaturaji, createSeededStartFen, diceForSeed, Game, parseSquare, squareName } from './game';
import { PIECE_TYPES, PLAYERS, type PieceType, type Player } from './types';

interface TestFenOptions {
  pieces: Array<[string, Player, PieceType, boolean?]>;
  turn?: Player;
  army?: Player;
  dice?: string;
  dieIndex?: number;
  scores?: Partial<Record<Player, number>>;
  pools?: Partial<Record<Player, string>>;
  controllers?: Partial<Record<Player, Player>>;
  kingTakers?: Partial<Record<Player, Player | null>>;
  result?: string;
}

function testFen(options: TestFenOptions): string {
  const board = Array(64).fill('-') as string[];
  for (const [name, color, type, promoted = false] of options.pieces) {
    const square = parseSquare(name);
    if (square === null) throw new Error(`Bad fixture square ${name}`);
    board[square] = `${color}${type}${promoted ? '~' : ''}`;
  }
  const rows = Array.from({ length: 8 }, (_, displayRank) => {
    const rank = 7 - displayRank;
    return Array.from({ length: 8 }, (_, file) => board[rank * 8 + file]).join(',');
  }).join('/');
  const turn = options.turn ?? 'r';
  const army = options.army ?? 'r';
  const scores = PLAYERS.map((player) => `${player}=${options.scores?.[player] ?? 0}`).join(',');
  const pools = PLAYERS.map((player) => `${player}=${options.pools?.[player] ?? '-'}`).join(',');
  const controllers = PLAYERS.map((player) => `${player}=${options.controllers?.[player] ?? player}`).join(',');
  const takers = PLAYERS.map((player) => `${player}=${options.kingTakers?.[player] ?? 'none'}`).join(',');
  return [rows, turn, army, options.dice ?? '41', options.dieIndex ?? 0, scores, pools, controllers, takers, options.result ?? '-'].join(' ');
}

function passTurn(game: Game, turn: Player): void {
  expect(game.turn).toBe(turn);
  game.prepareTurn(0x7777 + PLAYERS.indexOf(turn));
  game.move('pass');
  game.move('pass');
}

describe('Chaturaji rules', () => {
  it('sets out four eight-piece armies and rotates the turn clockwise', () => {
    const game = chaturaji.createGame();
    expect(game.pieces()).toHaveLength(32);
    expect(game.turn).toBe('r');
    expect(game.pieceAt(parseSquare('h8')!)).toMatchObject({ color: 'r', type: 'b' });
    expect(game.pieceAt(parseSquare('h5')!)).toMatchObject({ color: 'r', type: 'k' });
    expect(game.pieceAt(parseSquare('e1')!)).toMatchObject({ color: 'g', type: 'k' });
    expect(game.pieceAt(parseSquare('a4')!)).toMatchObject({ color: 'y', type: 'k' });
    expect(game.pieceAt(parseSquare('d8')!)).toMatchObject({ color: 'b', type: 'k' });
    expect(PIECE_TYPES).toEqual(['p', 'b', 'h', 'e', 'k']);
  });

  it('uses the die face to restrict eligible piece types and leaves skip available', () => {
    const pieces: TestFenOptions['pieces'] = [
      ['h5', 'r', 'k'], ['d2', 'r', 'p'], ['b2', 'r', 'b'], ['c3', 'r', 'h'], ['e5', 'r', 'e'],
      ['a8', 'g', 'k'], ['h8', 'y', 'k'], ['h1', 'b', 'k'],
    ];
    const sourceType: Record<number, PieceType[]> = { 1: ['k', 'p'], 2: ['b'], 3: ['h'], 4: ['e'], 5: ['k', 'p'], 6: ['e'] };
    for (const face of [1, 2, 3, 4, 5, 6]) {
      const game = new Game(testFen({ pieces, dice: `${face}1` }));
      const legal = game.legalUci();
      expect(legal).toContain('pass');
      const movedTypes = new Set(legal.filter((uci) => uci !== 'pass').map((uci) => {
        const from = parseSquare(uci.slice(0, 2))!;
        return game.pieceAt(from)!.type;
      }));
      expect([...movedTypes].sort()).toEqual([...sourceType[face]!].sort());
    }
  });

  it('records injected dice, both actions, replay and undo without ambient randomness', () => {
    expect(diceForSeed(1234)).toEqual(diceForSeed(1234));
    const startFen = createSeededStartFen(1234);
    const game = new Game(startFen);
    game.move('pass');
    game.move('pass');
    expect(game.activeArmy).toBe('g');
    expect(game.turn).toBe('g');
    expect(game.dice).toBeNull();
    const roll = game.prepareTurn(5678);
    expect(roll?.action).toBe('roll');
    expect(roll?.uci).toBe(`ROLL${diceForSeed(5678).join('')}`);
    const replayed = new Game(startFen);
    for (const move of game.moves()) replayed.move(move.uci);
    expect(replayed.fen()).toBe(game.fen());
    expect(game.undo()?.action).toBe('roll');
    expect(game.dice).toBeNull();
  });

  it('scores captures and moves the captured type into the controller pool', () => {
    const game = new Game(testFen({
      pieces: [['h8', 'r', 'k'], ['a8', 'g', 'k'], ['h1', 'y', 'k'], ['d8', 'b', 'k'], ['a1', 'r', 'e'], ['a2', 'b', 'p']],
      dice: '41',
    }));
    const record = game.move('a1a2');
    expect(record.action).toBe('capture');
    expect(record.captured).toMatchObject({ color: 'b', type: 'p' });
    expect(game.scores.r).toBe(1);
    expect(game.capturedPools.r).toContain('p');
  });

  it('promotes at the far edge only when the mapped captured piece is available', () => {
    const game = new Game(testFen({
      pieces: [['h8', 'r', 'k'], ['a8', 'g', 'k'], ['h1', 'y', 'k'], ['d8', 'b', 'k'], ['b5', 'r', 'p']],
      pools: { r: 'b' }, dice: '11',
    }));
    game.move('b5a5');
    expect(game.pieceAt(parseSquare('a5')!)).toMatchObject({ color: 'r', type: 'b', promoted: true });
    expect(game.capturedPools.r).toEqual([]);
  });

  it('awards boat triumph for a four-color 2×2 formation', () => {
    const game = new Game(testFen({
      pieces: [
        ['a1', 'r', 'k'], ['h1', 'g', 'k'], ['a8', 'y', 'k'], ['h8', 'b', 'k'],
        ['c3', 'r', 'b'], ['e4', 'g', 'b'], ['f4', 'y', 'b'], ['f5', 'b', 'b'],
      ],
      dice: '21',
    }));
    const record = game.move('c3e5');
    expect(record.action).toBe('capture');
    expect(record.captures).toHaveLength(3);
    expect(game.scores.r).toBe(6);
    expect(game.capturedPools.r).toEqual(['b', 'b', 'b']);
    expect(game.pieceAt(parseSquare('e4')!)).toBeNull();
    expect(game.pieceAt(parseSquare('f4')!)).toBeNull();
    expect(game.pieceAt(parseSquare('f5')!)).toBeNull();
  });

  it('transfers an allied army on its throne and gives its scheduled turn to the new controller', () => {
    const game = new Game(testFen({
      pieces: [['b4', 'r', 'k'], ['e1', 'g', 'k'], ['a4', 'y', 'k'], ['d8', 'b', 'k']],
      dice: '11',
    }));
    game.move('b4a4');
    expect(game.controllers.y).toBe('r');
    expect(game.kingCaptureOwners.y).toBe('r');
    game.move('pass');
    passTurn(game, 'g');
    expect(game.activeArmy).toBe('y');
    expect(game.turn).toBe('r');
  });

  it('ends when three original Kings are captured and awards the 54-point maximum', () => {
    const game = new Game(testFen({
      pieces: [['h8', 'r', 'k'], ['a2', 'g', 'k'], ['b2', 'y', 'k'], ['c2', 'b', 'k'], ['a1', 'r', 'e']],
      dice: '44',
    }));
    game.move('a1a2');
    game.move('pass');
    passTurn(game, 'g'); passTurn(game, 'y'); passTurn(game, 'b');
    game.move('ROLL44');
    game.move('a2b2'); game.move('pass');
    passTurn(game, 'g'); passTurn(game, 'y'); passTurn(game, 'b');
    game.move('ROLL44');
    game.move('b2c2');
    expect(game.isGameOver()).toBe(true);
    expect(game.kingCaptureOwners).toMatchObject({ g: 'r', y: 'r', b: 'r' });
    expect(game.scores.r).toBe(54);
    expect(game.status()).toMatchObject({ kind: 'points', winner: 'r', winners: ['r'] });
  });
});

describeVariantConformance(chaturaji, {
  fens: [],
  invalidFens: ['not-a-fen'],
  illegalMoves: ['a1a2', 'ROLL16'],
});

describe('Chaturaji notation', () => {
  it('round-trips all board coordinates', () => {
    for (let file = 0; file < 8; file++) for (let rank = 0; rank < 8; rank++) {
      const name = `${String.fromCharCode(97 + file)}${rank + 1}`;
      expect(squareName(parseSquare(name)!)).toBe(name);
    }
  });
});
