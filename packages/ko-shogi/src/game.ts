import {
  IllegalMoveError,
  type Color,
  type GameStatus,
  type Piece as RulesPiece,
  type Square,
  type VariantMoveRecord,
} from '@chaturanga/rules-core';
import { BOARD_SIZE, PIECE_TYPES, opposite, type PieceType, type Position, fenOf, parseFen, positionKey, startingPosition } from './position';
import { attacksSoleObjective, attackedSquares, commandOutcome, generateActions, routeSan, type Candidate } from './movement';

interface HistoryEntry {
  readonly before: Position;
  readonly afterKey: string;
  readonly record: VariantMoveRecord<Color>;
  readonly givesObjectiveAttack: boolean;
}

function clonePosition(position: Position): Position {
  return {
    board: position.board.map((piece) => piece ? { ...piece } : null),
    turn: position.turn,
    priestLost: { ...position.priestLost },
  };
}

function clonePiece(piece: import('./position').Piece): RulesPiece<PieceType, Color> {
  return { color: piece.color, type: piece.type, promoted: piece.promoted };
}

function repetitionResult(keys: readonly string[], history: readonly HistoryEntry[]): GameStatus<Color> | null {
  const current = keys.at(-1);
  if (!current) return null;
  const occurrences = keys.flatMap((key, index) => key === current ? [index] : []);
  if (occurrences.length < 4) return null;
  const start = occurrences.at(-4)!;
  const end = occurrences.at(-1)!;
  const cycle = history.slice(start, end);
  const repeatingCheckers = (['w', 'b'] as const).filter((color) => {
    const turns = cycle.filter((entry) => entry.record.color === color);
    return turns.length > 0 && turns.every((entry) => entry.givesObjectiveAttack);
  });
  if (repeatingCheckers.length === 1)
    return { kind: 'perpetual-check', winner: opposite(repeatingCheckers[0]!) };
  return { kind: 'repetition' };
}

export class Game {
  private position: Position;
  private readonly history: HistoryEntry[] = [];
  private readonly keys: string[];
  private cacheKey: string | null = null;
  private cachedCandidates: Candidate[] = [];

  constructor(fen: string = fenOf(startingPosition())) {
    this.position = parseFen(fen);
    this.keys = [positionKey(this.position)];
  }

  get turn(): Color { return this.position.turn; }

  fen(): string { return fenOf(this.position); }

  pieceAt(square: Square): RulesPiece<PieceType, Color> | null {
    const piece = Number.isInteger(square) && square >= 0 && square < BOARD_SIZE ? this.position.board[square] : null;
    return piece ? clonePiece(piece) : null;
  }

  pieces(): Array<{ square: Square; piece: RulesPiece<PieceType, Color> }> {
    return this.position.board.flatMap((piece, square) => piece ? [{ square, piece: clonePiece(piece) }] : []);
  }

  hand(_color: Color): readonly string[] { return []; }

  legalUci(): string[] {
    if (this.status().kind !== 'ongoing') return [];
    return this.availableCandidates().map(({ uci }) => uci);
  }

  move(uci: string): VariantMoveRecord<Color> {
    if (this.status().kind !== 'ongoing') throw new IllegalMoveError(uci);
    const candidate = this.availableCandidates().find((move) => move.uci === uci);
    if (!candidate) throw new IllegalMoveError(uci);

    const before = clonePosition(this.position);
    this.position = clonePosition(candidate.resulting);
    const afterKey = positionKey(this.position);
    this.keys.push(afterKey);
    const captures = candidate.captures.map((piece) => clonePiece(piece));
    const record: VariantMoveRecord<Color> = {
      uci,
      san: routeSan(candidate),
      color: candidate.color,
      piece: clonePiece(candidate.piece),
      captured: captures[0] ?? null,
      ...(captures.length > 1 ? { captures: captures.slice(1) } : {}),
      to: candidate.to,
      fenAfter: this.fen(),
    };
    this.history.push({
      before,
      afterKey,
      record,
      givesObjectiveAttack: attacksSoleObjective(this.position.board, candidate.color),
    });
    this.cacheKey = null;
    return record;
  }

  undo(): VariantMoveRecord<Color> | null {
    const entry = this.history.pop();
    if (!entry) return null;
    this.position = entry.before;
    this.keys.pop();
    this.cacheKey = null;
    return entry.record;
  }

  moves(): VariantMoveRecord<Color>[] { return this.history.map(({ record }) => record); }

  lastMove(): VariantMoveRecord<Color> | null { return this.history.at(-1)?.record ?? null; }

  inCheck(): false { return false; }

  checkedKingSquare(): null { return null; }

  attackedSquares(color: Color): Square[] { return attackedSquares(this.position.board, color); }

  counting(): null { return null; }

  isGameOver(): boolean { return this.status().kind !== 'ongoing'; }

  status(): GameStatus<Color> {
    const command = commandOutcome(this.position.board);
    if (command === 'draw') return { kind: 'stalemate' };
    if (command) return { kind: 'progression', winner: command };
    const repetition = repetitionResult(this.keys, this.history);
    if (repetition) return repetition;
    if (this.availableCandidates().length === 0) return { kind: 'stalemate', winner: opposite(this.turn) };
    return { kind: 'ongoing' };
  }

  private availableCandidates(): Candidate[] {
    const key = positionKey(this.position);
    if (this.cacheKey !== key) {
      this.cachedCandidates = generateActions(this.position);
      this.cacheKey = key;
    }
    return this.cachedCandidates;
  }
}

export const koShogi = {
  id: 'ko-shogi',
  files: 19,
  ranks: 19,
  startFen: fenOf(startingPosition()),
  pieceTypes: PIECE_TYPES,
  players: ['b', 'w'] as const,
  hasHands: false,
  createGame: (fen?: string) => new Game(fen),
} as const;

export const koShogiVariant = koShogi satisfies import('@chaturanga/rules-core').Variant<Game>;
