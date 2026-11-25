import {
  IllegalMoveError,
  type Color,
  type GameStatus,
  type Square,
  type Variant,
  type VariantMoveRecord,
} from '@chaturanga/rules-core';
import { applyMove, attackedSquares, legalMoves, moveUci, type Move } from './movement';
import {
  FILES,
  PIECE_TYPES,
  RANKS,
  isPlayable,
  keyOf,
  lockField,
  opposite,
  parseFen,
  placementOf,
  squareName,
  START_FEN,
  type Piece,
  type Position,
} from './position';

export {
  BOARD_SIZE,
  FILES,
  PIECE_TYPES,
  RANKS,
  fieldOf,
  isFortress,
  isGate,
  isPlayable,
  parseFen,
  placementOf,
  rankOf,
  square,
  squareForField,
  squareName,
  START_FEN,
  type Piece,
  type PieceType,
} from './position';

interface HistoryEntry {
  position: Position;
  record: VariantMoveRecord;
}

const DRAW_PLIES = 100;

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
    const { board, turn, locks, halfmove, fullmove } = this.position;
    return `${placementOf(board)} ${turn} ${lockField(locks)} ${halfmove} ${fullmove}`;
  }

  pieceAt(square: Square): Piece | null {
    const piece = this.position.board[square];
    return piece ? { ...piece } : null;
  }

  pieces(): Array<{ square: Square; piece: Piece }> {
    return this.position.board.flatMap((piece, square) => piece ? [{ square, piece: { ...piece } }] : []);
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
    return this.availableMoves().map(moveUci);
  }

  status(): GameStatus {
    const biy = { w: false, b: false };
    for (const piece of this.position.board) if (piece?.type === 'k') biy[piece.color] = true;
    if (!biy.w || !biy.b) {
      const winner = biy.w ? 'w' : biy.b ? 'b' : undefined;
      return { kind: 'goal-square', ...(winner ? { winner } : {}) };
    }

    const moves = this.availableMoves();
    if (moves.length === 0) return { kind: 'stalemate', winner: opposite(this.turn) };
    if (this.keys.filter((key) => key === this.keys.at(-1)).length >= 3) return { kind: 'repetition' };
    if (this.position.halfmove >= DRAW_PLIES) return { kind: 'fifty-move' };
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
    const before = this.position;
    if (this.status().kind !== 'ongoing') throw new IllegalMoveError(uci);
    const move = this.availableMoves().find((candidate) => moveUci(candidate) === uci);
    if (!move) throw new IllegalMoveError(uci);

    const piece = before.board[move.from]!;
    const firstCapturedSquare = move.captured[0];
    const firstCaptured = firstCapturedSquare === undefined ? null : before.board[firstCapturedSquare];
    const color = before.turn;
    this.position = applyMove(before, move);
    this.keys.push(keyOf(this.position));

    const route = [move.from, ...move.path].map(squareName);
    const capture = move.captured.length ? ':' : '–';
    const san = move.deployment
      ? `${squareName(move.from)}↗${squareName(move.to)}`
      : route[0]! + capture + route.slice(1).join(':') + (move.promotion ? '=B' : '');
    const record: VariantMoveRecord = {
      color,
      piece: { ...piece },
      captured: firstCaptured ? { ...firstCaptured } : null,
      to: move.to,
      uci,
      fenAfter: this.fen(),
      san: this.status().kind === 'goal-square' ? `${san}×` : san,
    };
    this.history.push({ position: before, record });
    return record;
  }

  undo(): VariantMoveRecord | null {
    const entry = this.history.pop();
    if (!entry) return null;
    this.position = entry.position;
    this.keys.pop();
    return entry.record;
  }
}

export const shatra = {
  id: 'shatra',
  files: FILES,
  ranks: RANKS,
  isPlayable,
  startFen: START_FEN,
  pieceTypes: PIECE_TYPES,
  hasHands: false,
  createGame: (fen?: string) => new Game(fen),
} satisfies Variant<Game>;
