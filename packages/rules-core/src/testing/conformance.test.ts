import { describe, expect, it } from 'vitest';
import { FenError, IllegalMoveError } from '../errors';
import type { Color, Piece } from '../types';
import { type Variant, type VariantGame, type VariantMoveRecord } from '../variant';
import { describeVariantConformance } from './conformance';

const START = 'w|1,1:w:k;8,8:b:k';
type InfiniteRecord = VariantMoveRecord<Color, string>;

class SparseGame implements VariantGame<Color, string> {
  private side: Color = 'w';
  private board = new Map<string, Piece<string, Color>>();
  private history: InfiniteRecord[] = [];
  private snapshots: Array<{ side: Color; board: Map<string, Piece<string, Color>> }> = [];

  constructor(fen = START) {
    const match = /^([wb])\|(.*)$/.exec(fen);
    if (!match) throw new FenError('Invalid sparse fixture FEN', fen);
    this.side = match[1] as Color;
    if (match[2]) {
      for (const entry of match[2].split(';')) {
        const pieceMatch = /^(-?\d+,-?\d+):([wb]):([a-z])$/.exec(entry);
        if (!pieceMatch || this.board.has(pieceMatch[1]!)) throw new FenError('Invalid sparse fixture piece', fen);
        this.board.set(pieceMatch[1]!, { color: pieceMatch[2] as Color, type: pieceMatch[3]!, promoted: false });
      }
    }
    if (![...this.board.values()].some((piece) => piece.type === 'k' && piece.color === 'w') ||
        ![...this.board.values()].some((piece) => piece.type === 'k' && piece.color === 'b'))
      throw new FenError('Both fixture kings are required', fen);
  }

  get turn(): Color { return this.side; }
  fen(): string {
    const entries = [...this.board].sort(([a], [b]) => a.localeCompare(b))
      .map(([square, piece]) => `${square}:${piece.color}:${piece.type}`);
    return `${this.side}|${entries.join(';')}`;
  }
  pieceAt(square: string): Piece<string, Color> | null { return this.board.get(square) ?? null; }
  pieces(): Array<{ square: string; piece: Piece<string, Color> }> {
    return [...this.board].map(([square, piece]) => ({ square, piece }));
  }
  hand(): readonly string[] { return []; }
  legalUciIn(squares: readonly string[]): string[] {
    const from = this.pieces().find(({ piece }) => piece.color === this.side)?.square;
    if (!from) return [];
    const [x, y] = from.split(',').map(BigInt) as [bigint, bigint];
    const dx = this.side === 'w' ? 1n : -1n;
    const to = `${x + dx},${y}`;
    return squares.includes(to) && !this.board.has(to) ? [`${from}>${to}`] : [];
  }
  move(uci: string): InfiniteRecord {
    const match = /^(-?\d+,-?\d+)>(-?\d+,-?\d+)$/.exec(uci);
    if (!match || !this.legalUciIn([match[2]!]).includes(uci)) throw new IllegalMoveError(uci);
    const piece = this.board.get(match[1]!)!;
    this.snapshots.push({ side: this.side, board: new Map(this.board) });
    this.board.delete(match[1]!);
    this.board.set(match[2]!, piece);
    const record: InfiniteRecord = {
      uci,
      san: uci,
      color: this.side,
      piece,
      captured: null,
      action: 'move',
      to: match[2]!,
      fenAfter: '',
    };
    this.side = this.side === 'w' ? 'b' : 'w';
    record.fenAfter = this.fen();
    this.history.push(record);
    return record;
  }
  undo(): InfiniteRecord | null {
    const record = this.history.pop() ?? null;
    const snapshot = this.snapshots.pop();
    if (snapshot) { this.side = snapshot.side; this.board = snapshot.board; }
    return record;
  }
  moves(): InfiniteRecord[] { return [...this.history]; }
  lastMove(): InfiniteRecord | null { return this.history.at(-1) ?? null; }
  status() { return { kind: 'ongoing' as const }; }
  isGameOver(): boolean { return false; }
  inCheck(): boolean { return false; }
  checkedKingSquare(): string | null { return null; }
  isAttackedAt(color: Color, square: string): boolean {
    return color === 'w' ? square === '9007199254740993,4' : square === '-9007199254740993,-4';
  }
  counting(): null { return null; }
}

const sparseVariant = {
  id: 'sparse-conformance',
  files: 0,
  ranks: 0,
  boardTopology: 'unbounded',
  startFen: START,
  pieceTypes: ['k'],
  hasHands: false,
  createGame: (fen?: string) => new SparseGame(fen),
} satisfies Variant<SparseGame>;

describeVariantConformance(sparseVariant, {
  fens: ['b|1,1:w:k;8,8:b:k'],
  invalidFens: ['broken'],
  illegalMoves: ['not-a-coordinate-move'],
  sampleSquares: (game) => [
    ...game.pieces().map(({ square }) => square),
    '9007199254740993,-9007199254740993',
  ],
  destinationOfMove: (uci) => uci.split('>')[1]!,
  sampleLegalMove: (game) => {
    const from = game.pieces().find(({ piece }) => piece.color === game.turn)?.square;
    if (!from) return null;
    const [x, y] = from.split(',').map(BigInt) as [bigint, bigint];
    const target = `${x + (game.turn === 'w' ? 1n : -1n)},${y}`;
    return game.legalUciIn([target])[0] ?? null;
  },
  attackSamples: () => [
    { color: 'w', square: '9007199254740993,4', attacked: true },
    { color: 'w', square: '-9007199254740993,4', attacked: false },
    { color: 'b', square: '-9007199254740993,-4', attacked: true },
    { color: 'b', square: '9007199254740993,-4', attacked: false },
  ],
});

describe('unbounded square contract (plat-024)', () => {
  it('keeps finite numeric squares as the default type', () => {
    const game = sparseVariant.createGame();
    expect(game.pieceAt('9007199254740993,-9007199254740993')).toBeNull();
    expect(game.pieces().map(({ square }) => square)).toEqual(['1,1', '8,8']);
  });
});
