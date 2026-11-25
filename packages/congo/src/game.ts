import {
  IllegalMoveError,
  type Color,
  type GameStatus,
  type Square,
  type VariantMoveRecord,
} from '@chaturanga/rules-core';
import { applyMove, attackedSquares, legalMoves, moveUci, type Move } from './movement';
import {
  FILES,
  PIECE_TYPES,
  RANKS,
  keyOf,
  opposite,
  parseFen,
  placementOf,
  squareName,
  START_FEN,
  type Piece,
  type Position,
} from './position';

interface HistoryEntry {
  position: Position;
  record: VariantMoveRecord;
}

function lions(board: Position['board']): Array<{ square: Square; color: Color }> {
  return board.flatMap((piece, square) => piece?.type === 'l' ? [{ square, color: piece.color }] : []);
}

function onlyTwoLionsRemain(position: Position): boolean {
  const pieces = position.board.filter(Boolean);
  return pieces.length === 2 && pieces.every((piece) => piece?.type === 'l');
}

function lionsCanCapture(position: Position): boolean {
  const pair = lions(position.board);
  if (pair.length !== 2 || pair[0]!.color === pair[1]!.color) return false;
  const from = pair[0]!.square;
  const to = pair[1]!.square;
  const fileDelta = (to % FILES) - (from % FILES);
  const rankDelta = Math.floor(to / FILES) - Math.floor(from / FILES);
  if (!(fileDelta === 0 || Math.abs(fileDelta) === Math.abs(rankDelta))) return false;
  const stepFile = Math.sign(fileDelta);
  const stepRank = Math.sign(rankDelta);
  let file = from % FILES + stepFile;
  let rank = Math.floor(from / FILES) + stepRank;
  while (rank * FILES + file !== to) {
    if (position.board[rank * FILES + file]) return false;
    file += stepFile;
    rank += stepRank;
  }
  return true;
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
    const { turn, halfmove, fullmove } = this.position;
    return `${placementOf(this.position.board)} ${turn} - ${halfmove} ${fullmove}`;
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
    const present = lions(this.position.board);
    if (present.length === 1) return { kind: 'goal-square', winner: present[0]!.color };
    if (onlyTwoLionsRemain(this.position) && !lionsCanCapture(this.position)) return { kind: 'insufficient-material' };
    const moves = this.availableMoves();
    if (moves.length === 0) return { kind: 'stalemate', winner: opposite(this.turn) };
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
    const before = this.position;
    if (this.status().kind !== 'ongoing') throw new IllegalMoveError(uci);
    const move = this.availableMoves().find((candidate) => moveUci(candidate) === uci);
    if (!move) throw new IllegalMoveError(uci);

    const piece = before.board[move.from]!;
    const captured = move.captured.map((square) => before.board[square]!).filter(Boolean);
    const color = before.turn;
    this.position = applyMove(before, move);
    this.keys.push(keyOf(this.position));

    const route = [move.from, ...move.path].map(squareName);
    const separator = move.captured.length ? '×' : '–';
    const san = route[0]! + separator + route.slice(1).join(separator) + (move.promotion ? '=S' : '');
    const result = this.status();
    const record: VariantMoveRecord = {
      color,
      piece: { ...piece },
      captured: captured[0] ? { ...captured[0] } : null,
      captures: captured.map((item) => ({ ...item })),
      movedPieceRemoved: this.position.board[move.to] === null,
      to: move.to,
      uci,
      fenAfter: this.fen(),
      san: result.kind === 'goal-square' ? `${san}×` : san,
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

export const congo = {
  id: 'congo',
  files: FILES,
  ranks: RANKS,
  startFen: START_FEN,
  pieceTypes: PIECE_TYPES,
  hasHands: false,
  createGame: (fen?: string) => new Game(fen),
} as const;

export const congoVariant = congo satisfies import('@chaturanga/rules-core').Variant<Game>;
