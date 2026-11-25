import {
  IllegalMoveError,
  type Color,
  type GameStatus,
  type Square,
  type VariantMoveRecord,
} from '@chaturanga/rules-core';
import { ALBERT_HALL, HOUSE_OF_COMMONS } from './layout';
import { attackedSquares, applyMove, legalMoves, type Move } from './movement';
import {
  FILES,
  PIECE_TYPES,
  POLICE_START_FEN,
  RANKS,
  START_FEN,
  keyOf,
  opposite,
  parseFen,
  placementOf,
  squareName,
  type Piece,
  type Position,
} from './position';

interface HistoryEntry {
  readonly position: Position;
  readonly record: VariantMoveRecord;
}

function goalIsFull(position: Position, color: Color): boolean {
  const goal = color === 'w' ? HOUSE_OF_COMMONS : ALBERT_HALL;
  return goal.every((target) => position.board[target]?.color === color);
}

function routeSan(from: Square, move: Extract<Move, { kind: 'route' }>): string {
  const capturedAt = new Set(move.captures.map((capture) => capture.atPathIndex));
  let san = squareName(from);
  for (const [index, target] of move.path.entries())
    san += `${capturedAt.has(index) ? '×' : '–'}${squareName(target)}`;
  return san;
}

export class Game {
  private position: Position;
  private readonly history: HistoryEntry[] = [];
  private readonly keys: string[];
  private readonly candidates = new WeakMap<Position, Move[]>();

  constructor(fen: string = START_FEN) {
    this.position = parseFen(fen);
    this.keys = [keyOf(this.position)];
  }

  get turn(): Color { return this.position.turn; }

  fen(): string {
    return `${placementOf(this.position.board)} ${this.position.turn}`;
  }

  pieceAt(target: Square): Piece | null {
    const piece = this.position.board[target];
    return piece ? { ...piece } : null;
  }

  pieces(): Array<{ square: Square; piece: Piece }> {
    return this.position.board.flatMap((piece, target) => piece ? [{ square: target, piece: { ...piece } }] : []);
  }

  hand(): readonly string[] { return []; }
  counting(): null { return null; }
  moves(): VariantMoveRecord[] { return this.history.map(({ record }) => record); }
  lastMove(): VariantMoveRecord | null { return this.history.at(-1)?.record ?? null; }
  inCheck(): boolean { return false; }
  checkedKingSquare(): null { return null; }
  attackedSquares(color: Color): Square[] { return attackedSquares(this.position.board, color); }
  isGameOver(): boolean { return this.status().kind !== 'ongoing'; }

  legalUci(): string[] {
    if (this.status().kind !== 'ongoing') return [];
    return this.availableMoves().map((move) => move.uci);
  }

  status(): GameStatus {
    if (goalIsFull(this.position, 'w')) return { kind: 'goal-square', winner: 'w' };
    if (goalIsFull(this.position, 'b')) return { kind: 'goal-square', winner: 'b' };
    if (this.availableMoves().length === 0) return { kind: 'stalemate', winner: opposite(this.turn) };
    if (this.keys.filter((key) => key === this.keys.at(-1)).length >= 3) return { kind: 'repetition' };
    return { kind: 'ongoing' };
  }

  private availableMoves(): Move[] {
    const cached = this.candidates.get(this.position);
    if (cached) return cached;
    const moves = legalMoves(this.position);
    this.candidates.set(this.position, moves);
    return moves;
  }

  move(uci: string): VariantMoveRecord {
    if (this.status().kind !== 'ongoing') throw new IllegalMoveError(uci);
    const move = this.availableMoves().find((candidate) => candidate.uci === uci);
    if (!move) throw new IllegalMoveError(uci);

    const before = this.position;
    this.position = applyMove(before, move);
    this.keys.push(keyOf(this.position));

    const record = this.recordMove(before, move);
    this.history.push({ position: before, record });
    return record;
  }

  private recordMove(before: Position, move: Move): VariantMoveRecord {
    if (move.kind === 'exchange') {
      const piece = move.releasedOwn[0]!.piece;
      const pairs = move.smallPairs + move.largePairs;
      const san = `Exchange ${pairs} pair${pairs === 1 ? '' : 's'} (${move.smallPairs} small, ${move.largePairs} large)`;
      return {
        color: move.color,
        piece: { ...piece },
        captured: null,
        captures: [],
        movedPieceRemoved: false,
        to: move.to,
        uci: move.uci,
        fenAfter: this.fen(),
        san,
      };
    }

    const piece = before.board[move.from]!;
    const captures = move.captures.map(({ piece: captured }) => ({ ...captured }));
    return {
      color: move.color,
      piece: { ...piece },
      captured: captures[0] ?? null,
      captures,
      movedPieceRemoved: false,
      to: move.to,
      uci: move.uci,
      fenAfter: this.fen(),
      san: routeSan(move.from, move),
    };
  }

  undo(): VariantMoveRecord | null {
    const entry = this.history.pop();
    if (!entry) return null;
    this.position = entry.position;
    this.keys.pop();
    return entry.record;
  }
}

export const suffragetto = {
  id: 'suffragetto',
  files: FILES,
  ranks: RANKS,
  startFen: START_FEN,
  startFens: [START_FEN, POLICE_START_FEN],
  pieceTypes: PIECE_TYPES,
  hasHands: false,
  createGame: (fen?: string) => new Game(fen),
} as const;

export const suffragettoVariant = suffragetto satisfies import('@chaturanga/rules-core').Variant<Game>;
