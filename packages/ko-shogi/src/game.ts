import {
  IllegalMoveError,
  type Color,
  type GameStatus,
  type Piece as RulesPiece,
  type Square,
  type VariantMoveRecord,
} from '@chaturanga/rules-core';
import { BOARD_SIZE, PIECE_TYPES, opposite, squareOf, type PieceType, type Position, fenOf, parseFen, positionKey, startingPosition } from './position';
import { attacksSoleObjective, attackedSquares, commandOutcome, generateActions, routeSan, type Candidate } from './movement';

interface HistoryEntry {
  readonly before: Position;
  readonly afterKey: string;
  readonly record: VariantMoveRecord<Color>;
  readonly givesObjectiveAttack: boolean;
  readonly searchCacheKey: string | null;
  readonly searchCacheOptions: string | null;
  readonly searchCandidates: Candidate[];
  readonly generatedCacheKey: string | null;
  readonly generatedCacheOrigin: Square | null;
  readonly generatedCandidates: Candidate[];
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
  private searchCacheKey: string | null = null;
  private searchCacheOptions: string | null = null;
  private cachedSearchCandidates: Candidate[] = [];
  private generatedCacheKey: string | null = null;
  private generatedCacheOrigin: Square | null = null;
  private cachedGeneratedCandidates: Candidate[] = [];

  constructor(fen: string = fenOf(startingPosition())) {
    this.position = parseFen(fen);
    this.keys = [positionKey(this.position)];
  }

  /** Rebuild a saved game efficiently while preserving repetition and undo history. */
  static replay(startFen: string, moves: readonly string[]): Game {
    const game = new Game(startFen);
    for (const uci of moves) {
      const originName = uci.match(/^[a-s](?:1[0-9]|[1-9])/u)?.[0];
      const origin = originName ? squareOf(originName) : null;
      const candidate = origin === null ? undefined : game.legalCandidatesFrom(origin).find((action) => action.uci === uci);
      if (!candidate) throw new IllegalMoveError(uci);
      game.playGeneratedCandidate(candidate);
    }
    return game;
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

  /** Generate the selected piece's complete legal turns without expanding the whole 19×19 position. */
  legalCandidatesFrom(origin: Square): readonly Candidate[] {
    if (!Number.isInteger(origin) || origin < 0 || origin >= BOARD_SIZE || this.status().kind !== 'ongoing') return [];
    const key = positionKey(this.position);
    if (this.generatedCacheKey !== key || this.generatedCacheOrigin !== origin) {
      this.cachedGeneratedCandidates = generateActions(this.position, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, [origin]);
      this.generatedCacheKey = key;
      this.generatedCacheOrigin = origin;
    }
    return this.cachedGeneratedCandidates;
  }

  /** Apply an action returned by legalCandidatesFrom without generating actions for every other piece. */
  playGeneratedCandidate(candidate: Candidate): VariantMoveRecord<Color> {
    const key = positionKey(this.position);
    if (this.generatedCacheKey !== key || !this.cachedGeneratedCandidates.includes(candidate)
      || this.generatedCacheOrigin !== candidate.from || candidate.color !== this.turn)
      throw new IllegalMoveError(candidate.uci);
    const command = commandOutcome(this.position.board);
    if (command || repetitionResult(this.keys, this.history)) throw new IllegalMoveError(candidate.uci);
    return this.commit(candidate);
  }

  move(uci: string): VariantMoveRecord<Color> {
    if (this.status().kind !== 'ongoing') throw new IllegalMoveError(uci);
    const candidate = this.availableCandidates().find((move) => move.uci === uci);
    if (!candidate) throw new IllegalMoveError(uci);

    return this.commit(candidate);
  }

  /** Bounded, per-piece candidate sample for search clients; every returned action is fully legal. */
  searchCandidates(limit: number, perOrigin: number): readonly Candidate[] {
    const key = positionKey(this.position);
    const options = `${limit}/${perOrigin}`;
    if (this.searchCacheKey !== key || this.searchCacheOptions !== options) {
      this.cachedSearchCandidates = generateActions(this.position, limit, perOrigin);
      this.searchCacheKey = key;
      this.searchCacheOptions = options;
    }
    return this.cachedSearchCandidates;
  }

  /** Apply a candidate from searchCandidates without regenerating the complete legal action list. */
  playSearchCandidate(candidate: Candidate): VariantMoveRecord<Color> {
    const key = positionKey(this.position);
    if (this.searchCacheKey !== key || !this.cachedSearchCandidates.includes(candidate) || candidate.color !== this.turn)
      throw new IllegalMoveError(candidate.uci);
    const command = commandOutcome(this.position.board);
    if (command || repetitionResult(this.keys, this.history)) throw new IllegalMoveError(candidate.uci);
    return this.commit(candidate);
  }

  private commit(candidate: Candidate): VariantMoveRecord<Color> {

    const before = clonePosition(this.position);
    this.position = clonePosition(candidate.resulting);
    const afterKey = positionKey(this.position);
    this.keys.push(afterKey);
    const captures = candidate.captures.map((piece) => clonePiece(piece));
    const record: VariantMoveRecord<Color> = {
      uci: candidate.uci,
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
      searchCacheKey: this.searchCacheKey,
      searchCacheOptions: this.searchCacheOptions,
      searchCandidates: this.cachedSearchCandidates,
      generatedCacheKey: this.generatedCacheKey,
      generatedCacheOrigin: this.generatedCacheOrigin,
      generatedCandidates: this.cachedGeneratedCandidates,
    });
    this.cacheKey = null;
    this.searchCacheKey = null;
    this.searchCacheOptions = null;
    this.generatedCacheKey = null;
    this.generatedCacheOrigin = null;
    return record;
  }

  undo(): VariantMoveRecord<Color> | null {
    const entry = this.history.pop();
    if (!entry) return null;
    this.position = entry.before;
    this.keys.pop();
    this.cacheKey = null;
    this.searchCacheKey = entry.searchCacheKey;
    this.searchCacheOptions = entry.searchCacheOptions;
    this.cachedSearchCandidates = entry.searchCandidates;
    this.generatedCacheKey = entry.generatedCacheKey;
    this.generatedCacheOrigin = entry.generatedCacheOrigin;
    this.cachedGeneratedCandidates = entry.generatedCandidates;
    return entry.record;
  }

  moves(): VariantMoveRecord<Color>[] { return this.history.map(({ record }) => record); }

  lastMove(): VariantMoveRecord<Color> | null { return this.history.at(-1)?.record ?? null; }

  inCheck(): false { return false; }

  checkedKingSquare(): null { return null; }

  attackedSquares(color: Color): Square[] { return attackedSquares(this.position.board, color); }

  counting(): null { return null; }

  /** Fast terminal probe for search adapters; stops as soon as one complete legal action is found. */
  hasAnyLegalAction(): boolean {
    const key = positionKey(this.position);
    return this.cacheKey === key ? this.cachedCandidates.length > 0 : generateActions(this.position, 1).length > 0;
  }

  isGameOver(): boolean { return this.status().kind !== 'ongoing'; }

  status(): GameStatus<Color> {
    const command = commandOutcome(this.position.board);
    if (command === 'draw') return { kind: 'stalemate' };
    if (command) return { kind: 'progression', winner: command };
    const repetition = repetitionResult(this.keys, this.history);
    if (repetition) return repetition;
    if (!this.hasAnyLegalAction()) return { kind: 'stalemate', winner: opposite(this.turn) };
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
