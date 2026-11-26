import { describe, expect, it } from 'vitest';
import { describeVariantConformance } from '@chaturanga/rules-core/testing';
import { Game, fourchess } from './game';
import { FILES, RANKS, isPlayable, parseSquare, squareAt, squareName } from './layout';
import type { FourPiece, Player, PieceType } from './types';

interface PositionPiece {
  square: string;
  color: Player;
  type: PieceType;
  promoted?: boolean;
  moved?: boolean;
}

interface PositionOptions {
  turn?: Player;
  rights?: string;
  enPassant?: string;
  eliminated?: string;
  scores?: string;
  quietRounds?: number;
  checks?: string;
  result?: string;
}

function position(pieces: readonly PositionPiece[], options: PositionOptions = {}): string {
  const board: Array<FourPiece | null> = Array(FILES * RANKS).fill(null);
  for (const entry of pieces) {
    const square = parseSquare(entry.square);
    if (square === null) throw new Error(`Test fixture uses invalid square ${entry.square}`);
    board[square] = {
      color: entry.color,
      type: entry.type,
      promoted: entry.promoted ?? false,
      moved: entry.moved ?? false,
    };
  }
  const rows = Array.from({ length: RANKS }, (_, displayRank) => {
    const rank = RANKS - displayRank - 1;
    return Array.from({ length: FILES }, (_, file) => {
      if (!isPlayable(file, rank)) return '.';
      const piece = board[squareAt(file, rank)];
      return piece ? `${piece.color}${piece.type}${piece.promoted ? '~' : ''}${piece.moved ? '!' : ''}` : '-';
    }).join(',');
  }).join('/');
  return [
    rows,
    options.turn ?? 'r',
    options.rights ?? '-',
    options.enPassant ?? '-',
    options.eliminated ?? 'yg',
    options.scores ?? 'r=0,b=0,y=0,g=0',
    String(options.quietRounds ?? 0),
    options.checks ?? '----',
    options.result ?? '-',
  ].join(' ');
}

const TWO_KINGS = [
  { square: 'h1', color: 'r', type: 'k' },
  { square: 'a11', color: 'b', type: 'k' },
] as const satisfies readonly PositionPiece[];

describe('four-handed chess board and seat setup', () => {
  it('uses the 160-square cross board and gives each seat a full army', () => {
    expect(Array.from({ length: FILES * RANKS }, (_, square) => square).filter((square) => isPlayable(square % FILES, Math.floor(square / FILES))))
      .toHaveLength(160);
    const game = new Game();
    expect(game.pieces()).toHaveLength(64);
    for (const player of ['r', 'b', 'y', 'g'] as const) {
      expect(game.pieces().filter(({ piece }) => piece.color === player)).toHaveLength(16);
    }
    const queens = game.pieces().filter(({ piece }) => piece.type === 'q');
    expect(queens.map(({ square }) => (square % FILES + Math.floor(square / FILES)) % 2)).toEqual([0, 0, 0, 0]);
    expect(game.pieceAt(parseSquare('g1')!)?.type).toBe('q');
    expect(game.pieceAt(parseSquare('a7')!)?.type).toBe('q');
    expect(game.pieceAt(parseSquare('h14')!)?.type).toBe('q');
    expect(game.pieceAt(parseSquare('n8')!)?.type).toBe('q');
  });

  it('plays a pawn move for each seat in clockwise order', () => {
    const game = new Game();
    const sequence = ['d2d3', 'b11c11', 'k13k12', 'm4l4'];
    for (const [index, move] of sequence.entries()) {
      expect(game.turn).toBe(['r', 'b', 'y', 'g'][index]);
      expect(game.legalUci()).toContain(move);
      game.move(move);
    }
    expect(game.turn).toBe('r');
  });

  it('clips knight moves to playable cells and rejects corner coordinates', () => {
    const game = new Game();
    expect(game.legalUci()).toContain('e1d3');
    expect(game.legalUci()).toContain('e1f3');
    expect(game.legalUci()).not.toContain('e1c2');
    expect(parseSquare('c2')).toBeNull();
    expect(squareName(parseSquare('d4')!)).toBe('d4');
  });
});

describe('four-direction pawn rules', () => {
  it('reports a pawn capture attack in each seat orientation', () => {
    const game = fourchess.createGame(position([
      { square: 'h1', color: 'r', type: 'k' }, { square: 'a11', color: 'b', type: 'k' },
      { square: 'g14', color: 'y', type: 'k' }, { square: 'n7', color: 'g', type: 'k' },
      { square: 'e4', color: 'r', type: 'p' }, { square: 'd4', color: 'b', type: 'p' },
      { square: 'k11', color: 'y', type: 'p' }, { square: 'm7', color: 'g', type: 'p' },
    ], { eliminated: '-' }));
    const attacks = new Map<Player, Set<string>>();
    for (const player of ['r', 'b', 'y', 'g'] as const) {
      attacks.set(player, new Set(game.attackedSquares(player).map(squareName)));
    }
    expect([...attacks.get('r')!]).toEqual(expect.arrayContaining(['d5', 'f5']));
    expect([...attacks.get('b')!]).toEqual(expect.arrayContaining(['e3', 'e5']));
    expect([...attacks.get('y')!]).toEqual(expect.arrayContaining(['j10', 'l10']));
    expect([...attacks.get('g')!]).toEqual(expect.arrayContaining(['l6', 'l8']));
  });

  it('promotes automatically on the eighth rank', () => {
    const game = fourchess.createGame(position([
      ...TWO_KINGS,
      { square: 'd7', color: 'r', type: 'p' },
    ]));
    expect(game.legalUci()).toContain('d7d8q');
    game.move('d7d8q');
    expect(game.pieceAt(parseSquare('d8')!)).toMatchObject({ color: 'r', type: 'q', promoted: true });
  });

  it('allows en passant only on the immediately following seat turn', () => {
    const game = fourchess.createGame(position([
      ...TWO_KINGS,
      { square: 'e2', color: 'r', type: 'p' },
      { square: 'd4', color: 'b', type: 'p' },
    ]));
    game.move('e2e4');
    expect(game.legalUci()).toContain('d4e3');
    game.move('d4e3');
    expect(game.pieceAt(parseSquare('e4')!)).toBeNull();
    expect(game.pieceAt(parseSquare('e3')!)).toMatchObject({ color: 'b', type: 'p' });
    expect(game.score('b')).toBe(1);
  });
});

describe('four-handed chess special moves and standings', () => {
  it('does not allow a move that leaves the moving King attacked', () => {
    const game = fourchess.createGame(position([
      { square: 'h1', color: 'r', type: 'k' },
      { square: 'a11', color: 'b', type: 'k' },
      { square: 'h14', color: 'b', type: 'r' },
    ]));
    expect(game.inCheck()).toBe(true);
    expect(game.legalUci()).not.toContain('h1h2');
    expect(game.legalUci()).toContain('h1g1');
  });

  it('supports two-square castling for the Red seat and moves its Rook', () => {
    const game = fourchess.createGame(position([
      { square: 'h1', color: 'r', type: 'k' },
      { square: 'd1', color: 'r', type: 'r' },
      { square: 'k1', color: 'r', type: 'r' },
      { square: 'a11', color: 'b', type: 'k' },
    ], { rights: 'rLR' }));
    expect(game.legalUci()).toContain('h1j1');
    game.move('h1j1');
    expect(game.pieceAt(parseSquare('j1')!)).toMatchObject({ color: 'r', type: 'k' });
    expect(game.pieceAt(parseSquare('i1')!)).toMatchObject({ color: 'r', type: 'r' });
    expect(game.fen().split(' ')[2]).toBe('-');
  });

  it('keeps eliminated pieces as blockers and awards no points for capturing them', () => {
    const game = fourchess.createGame(position([
      { square: 'h1', color: 'r', type: 'k' }, { square: 'a11', color: 'b', type: 'k' },
      { square: 'd4', color: 'r', type: 'r' }, { square: 'd8', color: 'y', type: 'q' },
    ]));
    game.move('d4d8');
    expect(game.pieceAt(parseSquare('d8')!)).toMatchObject({ color: 'r', type: 'r' });
    expect(game.score('r')).toBe(0);
  });

  it('scores a newly created two-King check by Queen', () => {
    const game = fourchess.createGame(position([
      { square: 'h1', color: 'r', type: 'k' }, { square: 'a8', color: 'b', type: 'k' },
      { square: 'n8', color: 'y', type: 'k' }, { square: 'a11', color: 'g', type: 'k' },
      { square: 'h7', color: 'r', type: 'q' },
    ], { eliminated: '-' }));
    game.move('h7h8');
    expect(game.score('r')).toBe(1);
    expect(game.playerStatus('b')).toBe('check');
    expect(game.playerStatus('y')).toBe('check');
  });

  it('awards mate and self-stalemate points, then preserves the full standings', () => {
    const mate = fourchess.createGame(position([
      { square: 'h1', color: 'r', type: 'k' }, { square: 'a11', color: 'b', type: 'k' },
      { square: 'h14', color: 'b', type: 'r' }, { square: 'g14', color: 'b', type: 'r' },
      { square: 'i14', color: 'b', type: 'r' },
    ], { checks: 'b---' }));
    expect(mate.isGameOver()).toBe(true);
    expect(mate.score('b')).toBe(20);

    const stalemate = fourchess.createGame(position([
      { square: 'h1', color: 'r', type: 'k' },
      { square: 'a11', color: 'b', type: 'k' },
      { square: 'g14', color: 'b', type: 'r' },
      { square: 'i14', color: 'b', type: 'r' },
      { square: 'j3', color: 'b', type: 'n' },
    ]));
    expect(stalemate.status()).toMatchObject({ kind: 'points', reason: 'elimination', winners: ['r'], scores: { r: 20, b: 10 } });
    expect(stalemate.isEliminated('r')).toBe(true);
  });

  it('detects threefold repetition despite moved markers on returned Knights', () => {
    const game = new Game();
    const cycle = ['e1f3', 'a10c9', 'j14i12', 'n5l6', 'f3e1', 'c9a10', 'i12j14', 'l6n5'];
    for (let repetition = 0; repetition < 2; repetition++) {
      for (const move of cycle) game.move(move);
    }
    expect(game.status()).toMatchObject({ kind: 'points', reason: 'repetition', winners: ['r', 'b', 'y', 'g'] });
    expect(game.allScores()).toEqual({ r: 10, b: 10, y: 10, g: 10 });
  });
});

describeVariantConformance(fourchess, {
  fens: [],
  invalidFens: ['', `${fourchess.startFen} extra`, fourchess.startFen.replace('r=0,b=0,y=0,g=0', 'r=0,b=0,b=0,g=0')],
  illegalMoves: ['a1a2', 'e1c2', 'e1e1', 'zz', 'a1n14'],
  sampleLegalMove: (game, rng) => {
    const moves = game.legalUci();
    return moves[Math.floor(rng() * moves.length)] ?? null;
  },
}, { seededGamesMs: 120_000, attackedSquaresMs: 120_000 });
