import {
  fileOf, IllegalMoveError, rankOf, squareName, type Color, type GameStatus, type Square, type Variant, type VariantMoveRecord,
} from '@chaturanga/rules-core';
import {
  attackedSquares, checkedKing, legalMoves, moveUci, opposite, parseFen, PIECE_TYPES, placementOf,
  START_FEN, type Move, type Piece, type Position,
} from './position';

export { parseSquare, squareName, START_FEN, type Piece, type PieceType } from './position';

interface HistoryEntry {
  move: Move;
  record: VariantMoveRecord;
  halfmove: number;
  piece: Piece;
  captured: Piece | null;
}
const NO_PROGRESS_PLIES = 140;

export class Game {
  private readonly position: Position;
  private readonly history: HistoryEntry[] = [];
  private readonly keys: string[];

  constructor(fen: string = START_FEN) {
    this.position = parseFen(fen);
    this.keys = [this.key()];
  }

  get turn(): Color { return this.position.turn; }

  private key(): string { return `${placementOf(this.position.board)} ${this.turn}`; }

  fen(): string {
    return `${this.key()} - - ${this.position.halfmove} ${this.position.fullmove}`;
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
  inCheck(): boolean { return this.checkedKingSquare() !== null; }
  checkedKingSquare(): Square | null { return checkedKing(this.position.board, this.turn); }
  attackedSquares(color: Color): Square[] { return attackedSquares(this.position.board, color); }
  isGameOver(): boolean { return this.status().kind !== 'ongoing'; }

  legalUci(): string[] {
    const moves = legalMoves(this.position.board, this.turn);
    return this.evaluate(moves).kind === 'ongoing' ? moves.map(moveUci) : [];
  }

  status(): GameStatus {
    return this.evaluate(legalMoves(this.position.board, this.turn));
  }

  private evaluate(moves: readonly Move[]): GameStatus {
    const { board, halfmove } = this.position;
    const opponent = opposite(this.turn);
    if (!moves.length) return { kind: this.inCheck() ? 'checkmate' : 'stalemate', winner: opponent };

    const own = board.filter((piece) => piece?.color === this.turn && piece.type !== 'k');
    const other = board.filter((piece) => piece?.color === opponent && piece.type !== 'k');
    if (!own.length && !other.length) return { kind: 'bare-king' };
    if (!own.length) {
      const reciprocal = other.length === 1 && moves.some(({ to }) => board[to] === other[0]);
      return reciprocal ? { kind: 'bare-king' } : { kind: 'bare-king', winner: opponent };
    }
    if (!other.length) return { kind: 'bare-king', winner: this.turn };
    if (this.keys.filter((key) => key === this.keys.at(-1)).length >= 3) return { kind: 'repetition' };
    if (halfmove >= NO_PROGRESS_PLIES) return { kind: 'counting' };
    return { kind: 'ongoing' };
  }

  move(uci: string): VariantMoveRecord {
    const position = this.position;
    const candidates = legalMoves(position.board, position.turn);
    const move = candidates.find((candidate) => moveUci(candidate) === uci);
    if (!move || this.evaluate(candidates).kind !== 'ongoing') throw new IllegalMoveError(uci);
    const { from, to, promotion } = move;
    const color = position.turn;
    const piece = position.board[from]!;
    const captured = position.board[to]!;
    const halfmove = position.halfmove;
    const san = this.notation(move, piece, captured, candidates);
    position.board[to] = promotion ? { color, type: 'q', promoted: true } : piece;
    position.board[from] = null;
    position.turn = opposite(color);
    position.halfmove = captured || piece.type === 'p' ? 0 : halfmove + 1;
    if (color === 'b') position.fullmove++;
    this.keys.push(this.key());
    const record: VariantMoveRecord = {
      color, piece: { ...piece }, captured: captured ? { ...captured } : null, to, uci, fenAfter: this.fen(),
      san: san + (this.inCheck() ? (this.status().kind === 'checkmate' ? '#' : '+') : ''),
    };
    this.history.push({ move, record, halfmove, piece, captured });
    return record;
  }

  private notation(move: Move, piece: Piece, captured: Piece | null, candidates: readonly Move[]): string {
    const { from, to, promotion } = move;
    const source = squareName(from);
    const destination = squareName(to);
    const capture = captured ? 'x' : '';
    if (piece.type === 'p') return (captured ? source[0] + capture : '') + destination + (promotion ? '=Q' : '');

    const others = candidates.filter((candidate) =>
      candidate.to === to && candidate.from !== from && this.position.board[candidate.from]?.type === piece.type);
    let disambiguation = '';
    if (others.length) {
      if (others.every((candidate) => fileOf(candidate.from) !== fileOf(from))) disambiguation = source[0]!;
      else if (others.every((candidate) => rankOf(candidate.from) !== rankOf(from))) disambiguation = source[1]!;
      else disambiguation = source;
    }
    return piece.type.toUpperCase() + disambiguation + capture + destination;
  }

  undo(): VariantMoveRecord | null {
    const entry = this.history.pop();
    if (!entry) return null;
    const { move, record, halfmove, piece, captured } = entry;
    this.position.board[move.from] = piece;
    this.position.board[move.to] = captured;
    this.position.turn = record.color;
    this.position.halfmove = halfmove;
    if (record.color === 'b') this.position.fullmove--;
    this.keys.pop();
    return record;
  }
}

export const shatranj = {
  id: 'shatranj',
  files: 8,
  ranks: 8,
  startFen: START_FEN,
  pieceTypes: PIECE_TYPES,
  hasHands: false,
  createGame: (fen?: string) => new Game(fen),
} satisfies Variant<Game>;
