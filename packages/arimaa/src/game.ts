import {
  IllegalMoveError,
  type Color,
  type GameStatus,
  type Piece,
  type Square,
  type VariantMoveRecord,
} from '@chaturanga/rules-core';
import {
  BLACK,
  FILES,
  HAND_ORDER,
  codeToPiece,
  opposite,
  pieceCode,
  pieceType,
  squareName,
  type PieceType,
} from './board';
import { countRabbits, parseFen, positionKey, serializeFen, START_FEN, type PositionData } from './fen';
import {
  applyTurn,
  buildTurnDraft,
  generateTurnMoves,
  neighbors,
  probeTurnAvailability,
  sampleLegalTurn,
  validateTurn,
  type TurnMoves,
} from './movement';

export interface TurnDraftView {
  /** Selected atomic actions. A push or pull is one entry that consumes two steps. */
  actions: string[];
  stepsUsed: number;
  canEnd: boolean;
  nextActions: string[];
  /** FEN for rendering the draft board; its side-to-move and move counters remain unchanged. */
  previewFen: string;
}

interface HistoryEntry {
  before: PositionData;
  repetitionKey: string | null;
  record: VariantMoveRecord<Color>;
}

function clonePosition(position: PositionData): PositionData {
  return {
    board: position.board.slice(),
    hands: { w: [...position.hands.w], b: [...position.hands.b] },
    turn: position.turn,
    halfmove: position.halfmove,
    fullmove: position.fullmove,
  };
}

function uniqueHandTypes(hand: readonly PieceType[]): PieceType[] {
  return HAND_ORDER.filter((type) => hand.includes(type));
}

export class Game {
  private position: PositionData;
  private readonly history: HistoryEntry[] = [];
  private readonly repetitions = new Map<string, number>();
  private turnMovesCache: TurnMoves | null = null;

  constructor(fen: string = START_FEN) {
    this.position = parseFen(fen);
    if (!this.inSetup()) this.repetitions.set(positionKey(this.position), 1);
  }

  get turn(): Color {
    return this.position.turn;
  }

  fen(): string {
    return serializeFen(this.position);
  }

  pieceAt(square: Square): Piece<PieceType, Color> | null {
    const code = this.position.board[square];
    return code ? codeToPiece(code) : null;
  }

  pieces(): Array<{ square: Square; piece: Piece<PieceType, Color> }> {
    return Array.from(this.position.board, (code, square) => (code ? { square, piece: codeToPiece(code) } : null)).filter(
      (entry): entry is { square: Square; piece: Piece<PieceType, Color> } => entry !== null,
    );
  }

  hand(color: Color): readonly PieceType[] {
    return [...this.position.hands[color]];
  }

  legalUci(): string[] {
    if (this.inSetup()) return this.legalSetupUci();
    if (this.positionResult()) return [];
    return this.turnMoves().legal.slice();
  }

  /** Returns legal atomic actions after a draft without generating every complete turn from the position. */
  turnDraft(actions: readonly string[] = []): TurnDraftView {
    if (this.inSetup() || this.positionResult()) throw new IllegalMoveError(actions.join(''));
    const draft = buildTurnDraft(this.position, actions, this.repetitions);
    if (!draft) throw new IllegalMoveError(actions.join(''));
    return {
      actions: [...actions],
      stepsUsed: draft.stepsUsed,
      canEnd: draft.canEnd,
      nextActions: draft.nextActions,
      previewFen: serializeFen({ ...this.position, board: draft.board }),
    };
  }

  move(uci: string): VariantMoveRecord<Color> {
    const before = clonePosition(this.position);
    const mover = this.position.turn;
    const setup = /^([EMHDCR])@([a-h][1-8])$/.exec(uci);
    let repetitionKey: string | null = null;
    let record: VariantMoveRecord<Color>;

    if (setup) {
      if (!this.legalSetupUci().includes(uci)) throw new IllegalMoveError(uci);
      record = this.playSetup(setup[1]!.toLowerCase() as PieceType, squareIndex(setup[2]!), mover, uci);
      if (!this.inSetup()) {
        repetitionKey = positionKey(this.position);
        this.repetitions.set(repetitionKey, (this.repetitions.get(repetitionKey) ?? 0) + 1);
      }
    } else {
      if (
        this.inSetup() ||
        this.positionResult() ||
        !validateTurn(this.position, uci, this.repetitions)
      )
        throw new IllegalMoveError(uci);
      const startBoard = this.position.board;
      const { board, effects } = applyTurn(startBoard, uci, mover);
      const coordinates = uci.match(/[a-h][1-8]/g)!;
      const to = squareIndex(coordinates.at(-1)!);
      const movedCode = before.board[effects.firstOwnPiece]!;
      this.position = {
        ...this.position,
        board,
        turn: opposite(mover),
        halfmove: before.halfmove + 1,
        fullmove: before.fullmove + Number(mover === 'b'),
      };
      repetitionKey = positionKey(this.position);
      this.repetitions.set(repetitionKey, (this.repetitions.get(repetitionKey) ?? 0) + 1);
      const finalPiece = board[to]!;
      const isPullDestination = finalPiece !== 0 && colorOf(finalPiece) !== mover;
      record = {
        uci,
        san: coordinatesToNotation(coordinates),
        color: mover,
        piece: codeToPiece(movedCode),
        captured: effects.captures[0] ?? null,
        ...(effects.captures.length > 1 && { captures: effects.captures.slice(1) }),
        ...(effects.finalMovedPieceRemoved && { movedPieceRemoved: true }),
        ...(isPullDestination && { multiPieceMove: true }),
        to,
        fenAfter: this.fen(),
      };
    }

    this.history.push({ before, repetitionKey, record });
    this.turnMovesCache = null;
    return record;
  }

  undo(): VariantMoveRecord<Color> | null {
    const entry = this.history.pop();
    if (!entry) return null;
    if (entry.repetitionKey) {
      const count = this.repetitions.get(entry.repetitionKey) ?? 0;
      if (count <= 1) this.repetitions.delete(entry.repetitionKey);
      else this.repetitions.set(entry.repetitionKey, count - 1);
    }
    this.position = entry.before;
    this.turnMovesCache = null;
    return entry.record;
  }

  moves(): VariantMoveRecord<Color>[] {
    return this.history.map(({ record }) => record);
  }

  lastMove(): VariantMoveRecord<Color> | null {
    return this.history.at(-1)?.record ?? null;
  }

  status(): GameStatus<Color> {
    if (this.inSetup()) return { kind: 'ongoing' };
    const result = this.positionResult();
    if (result) return result;
    const availability = probeTurnAvailability(this.position, this.repetitions);
    if (!availability.hasAny) return { kind: 'stalemate', winner: opposite(this.turn) };
    if (!availability.hasLegal) return { kind: 'repetition', winner: opposite(this.turn) };
    return { kind: 'ongoing' };
  }

  /** Deterministic-test/bot helper that samples a complete legal turn without enumerating every alternative. */
  sampleLegalUci(rng: () => number): string | null {
    if (this.inSetup()) {
      const legal = this.legalSetupUci();
      return legal.length ? legal[Math.min(legal.length - 1, Math.floor(Math.max(0, rng()) * legal.length))]! : null;
    }
    if (this.positionResult()) return null;
    return sampleLegalTurn(this.position, this.repetitions, rng);
  }

  isGameOver(): boolean {
    return this.status().kind !== 'ongoing';
  }

  inCheck(): false {
    return false;
  }

  checkedKingSquare(): null {
    return null;
  }

  attackedSquares(color: Color): Square[] {
    const squares = new Set<number>();
    this.position.board.forEach((code, square) => {
      if (!code || colorOf(code) !== color) return;
      squares.add(square);
      for (const target of neighbors(square)) squares.add(target);
    });
    return [...squares].sort((left, right) => left - right);
  }

  counting(): null {
    return null;
  }

  private inSetup(): boolean {
    return this.position.hands.w.length + this.position.hands.b.length > 0;
  }

  private legalSetupUci(): string[] {
    const hand = this.position.hands[this.turn];
    const types = uniqueHandTypes(hand);
    const ranks = this.turn === 'w' ? [0, 1] : [6, 7];
    const moves: string[] = [];
    for (const rank of ranks) {
      for (let file = 0; file < FILES; file++) {
        const square = rank * FILES + file;
        if (this.position.board[square]) continue;
        for (const type of types) moves.push(`${type.toUpperCase()}@${squareName(square)}`);
      }
    }
    return moves;
  }

  private playSetup(type: PieceType, square: number, mover: Color, uci: string): VariantMoveRecord<Color> {
    const hand = this.position.hands[mover];
    const handIndex = hand.indexOf(type);
    const code = pieceCode(type, mover);
    if (handIndex < 0 || this.position.board[square]) throw new IllegalMoveError(uci);
    hand.splice(handIndex, 1);
    this.position.board[square] = code;
    if (!hand.length) {
      if (mover === 'w') this.position.turn = 'b';
      else this.position.turn = 'w';
    }
    return {
      uci,
      san: `${type.toUpperCase()}@${squareName(square)}`,
      color: mover,
      piece: codeToPiece(code),
      captured: null,
      action: 'drop',
      to: square,
      fenAfter: this.fen(),
    };
  }

  private positionResult(): GameStatus<Color> | null {
    const mover = opposite(this.turn);
    if (this.hasRabbitOnGoal(mover)) return { kind: 'goal-square', winner: mover };
    if (this.hasRabbitOnGoal(this.turn)) return { kind: 'goal-square', winner: this.turn };
    if (countRabbits(this.position.board, this.turn) === 0) return { kind: 'elimination', winner: mover };
    if (countRabbits(this.position.board, mover) === 0) return { kind: 'elimination', winner: this.turn };
    return null;
  }

  private hasRabbitOnGoal(color: Color): boolean {
    const goalRank = color === 'w' ? 7 : 0;
    return this.position.board.some(
      (code, square) =>
        code !== 0 && colorOf(code) === color && pieceType(code) === 'r' && Math.floor(square / FILES) === goalRank,
    );
  }

  private turnMoves(): TurnMoves {
    if (!this.turnMovesCache)
      this.turnMovesCache = generateTurnMoves(this.position, this.repetitions);
    return this.turnMovesCache;
  }
}

function squareIndex(name: string): number {
  return (Number(name[1]) - 1) * FILES + name.charCodeAt(0) - 97;
}

function colorOf(code: number): Color {
  return code & BLACK ? 'b' : 'w';
}

function coordinatesToNotation(coordinates: readonly string[]): string {
  const steps: string[] = [];
  for (let index = 0; index < coordinates.length; index += 2)
    steps.push(`${coordinates[index]}-${coordinates[index + 1]}`);
  return steps.join(' ');
}

export { FenError, parseFen, serializeFen, type PositionData } from './fen';
