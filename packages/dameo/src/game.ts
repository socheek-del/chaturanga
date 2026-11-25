import {
  FenError,
  IllegalMoveError,
  type Color,
  type GameStatus,
  type Piece,
  type Square,
  type VariantMoveRecord,
} from '@chaturanga/rules-core';
import { attackSquares, applyMove, legalMoves, type Move } from './movement';
import {
  countPieces,
  opposite,
  parseFen,
  positionKey,
  serializeFen,
  squareName,
  type Board,
  type DameoPiece,
  type Position,
  type PieceType,
  START_FEN,
} from './position';

interface HistoryEntry {
  readonly before: Position;
  readonly key: string;
  readonly record: VariantMoveRecord<Color>;
}

const clonePiece = (piece: DameoPiece): Piece<PieceType, Color> => ({
  color: piece.color,
  type: piece.type,
  promoted: piece.promoted,
});

export class Game {
  private position: Position;
  private readonly history: HistoryEntry[] = [];
  private readonly repetitions = new Map<string, number>();

  constructor(fen: string = START_FEN) {
    this.position = parseFen(fen);
    this.repetitions.set(positionKey(this.position), 1);
  }

  get turn(): Color { return this.position.turn; }

  fen(): string {
    return serializeFen(this.position);
  }

  pieceAt(target: Square): Piece<PieceType, Color> | null {
    const piece = this.position.board[target];
    return piece ? clonePiece(piece) : null;
  }

  pieces(): Array<{ square: Square; piece: Piece<PieceType, Color> }> {
    return this.position.board.flatMap((piece, square) => piece ? [{ square, piece: clonePiece(piece) }] : []);
  }

  hand(_color: Color): readonly string[] {
    return [];
  }

  legalUci(): string[] {
    if (this.status().kind !== 'ongoing') return [];
    return this.rawLegalMoves().map((move) => move.uci);
  }

  move(uci: string): VariantMoveRecord<Color> {
    const move = this.rawLegalMoves().find((candidate) => candidate.uci === uci);
    if (!move || this.status().kind !== 'ongoing') throw new IllegalMoveError(uci);

    const before = this.position;
    const mover = before.turn;
    const movingPiece = before.board[move.from]!;
    const captured = move.captures.map(({ piece }) => clonePiece(piece));
    const separator = move.kind === 'capture' ? '×' : '–';
    const san = move.path.map(squareName).join(separator);

    this.position = applyMove(before, move);
    const key = positionKey(this.position);
    this.repetitions.set(key, (this.repetitions.get(key) ?? 0) + 1);
    const record: VariantMoveRecord<Color> = {
      uci: move.uci,
      san,
      color: mover,
      piece: clonePiece(movingPiece),
      captured: captured[0] ?? null,
      ...(captured.length > 1 && { captures: captured.slice(1) }),
      to: move.to,
      fenAfter: this.fen(),
    };
    this.history.push({ before, key, record });
    return record;
  }

  undo(): VariantMoveRecord<Color> | null {
    const entry = this.history.pop();
    if (!entry) return null;
    const occurrences = this.repetitions.get(entry.key) ?? 0;
    if (occurrences <= 1) this.repetitions.delete(entry.key);
    else this.repetitions.set(entry.key, occurrences - 1);
    this.position = entry.before;
    return entry.record;
  }

  moves(): VariantMoveRecord<Color>[] {
    return this.history.map(({ record }) => record);
  }

  lastMove(): VariantMoveRecord<Color> | null {
    return this.history.at(-1)?.record ?? null;
  }

  status(): GameStatus<Color> {
    const white = countPieces(this.position.board, 'w');
    const black = countPieces(this.position.board, 'b');
    if (white === 0) return { kind: 'elimination', winner: 'b' };
    if (black === 0) return { kind: 'elimination', winner: 'w' };
    if (this.rawLegalMoves().length === 0) return { kind: 'stalemate', winner: opposite(this.turn) };
    if ((this.repetitions.get(positionKey(this.position)) ?? 0) >= 3) return { kind: 'repetition' };
    return { kind: 'ongoing' };
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
    return attackSquares(this.position.board, color);
  }

  counting(): null {
    return null;
  }

  private rawLegalMoves(): Move[] {
    return legalMoves(this.position);
  }
}

export { FenError };
export type { Board, DameoPiece, PieceType, Position };
