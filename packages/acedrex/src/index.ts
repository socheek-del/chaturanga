import {
  IllegalMoveError, type Color, type GameStatus, type Square, type Variant, type VariantMoveRecord,
} from '@chaturanga/rules-core';
import {
  BLACK_LEAP, FILES, RANKS, WHITE_LEAP, fileOf, leapFlag, rankOf, squareName, attackedSquares, checkedKing, legalMoves, moveUci, opposite, parseFen, PIECE_TYPES, placementOf,
  START_FEN, type Move, type Piece, type Position,
} from './position';

export { squareName, FILES, RANKS, START_FEN, type Piece, type PieceType } from './position';

interface HistoryEntry {
  move: Move;
  record: VariantMoveRecord;
  halfmove: number;
  leaps: number;
  piece: Piece;
  captured: Piece | null;
}
const NO_PROGRESS_PLIES = 100;

export class Game {
  private readonly position: Position;
  private readonly history: HistoryEntry[] = [];
  private readonly keys: string[];

  constructor(fen: string = START_FEN) {
    this.position = parseFen(fen);
    this.keys = [this.key()];
  }

  get turn(): Color { return this.position.turn; }

  private key(): string {
    const leaps = this.position.leaps;
    const rights = (leaps & WHITE_LEAP ? 'K' : '') + (leaps & BLACK_LEAP ? 'k' : '');
    return `${placementOf(this.position.board)} ${this.turn} ${rights || '-'}`;
  }

  fen(): string {
    return `${this.key()} - ${this.position.halfmove} ${this.position.fullmove}`;
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
  checkedKingSquare(): Square | null { return checkedKing(this.position.board, this.turn, this.position.leaps); }
  attackedSquares(color: Color): Square[] { return attackedSquares(this.position.board, color, this.position.leaps); }
  isGameOver(): boolean { return this.status().kind !== 'ongoing'; }

  legalUci(): string[] {
    const moves = legalMoves(this.position.board, this.turn, this.position.leaps);
    return this.evaluate(moves).kind === 'ongoing' ? moves.map(moveUci) : [];
  }

  status(): GameStatus {
    return this.evaluate(legalMoves(this.position.board, this.turn, this.position.leaps));
  }

  private evaluate(moves: readonly Move[]): GameStatus {
    const { board, halfmove } = this.position;
    const opponent = opposite(this.turn);
    const ownArmy = board.some((piece) => piece?.color === this.turn && piece.type !== 'k');
    const opposingArmy = board.some((piece) => piece?.color === opponent && piece.type !== 'k');
    if (!ownArmy && !opposingArmy) return { kind: 'bare-king' };
    if (!ownArmy) return { kind: 'bare-king', winner: opponent };
    if (!opposingArmy) return { kind: 'bare-king', winner: this.turn };
    if (!moves.length) {
      return this.inCheck() ? { kind: 'checkmate', winner: opponent } : { kind: 'stalemate', winner: opponent };
    }
    if (this.keys.filter((key) => key === this.keys.at(-1)).length >= 3) return { kind: 'repetition' };
    if (halfmove >= NO_PROGRESS_PLIES) return { kind: 'fifty-move' };
    return { kind: 'ongoing' };
  }

  move(uci: string): VariantMoveRecord {
    const position = this.position;
    const candidates = legalMoves(position.board, position.turn, position.leaps);
    const move = candidates.find((candidate) => moveUci(candidate) === uci);
    if (!move || this.evaluate(candidates).kind !== 'ongoing') throw new IllegalMoveError(uci);
    const { from, to, promotion } = move;
    const color = position.turn;
    const piece = position.board[from]!;
    const captured = position.board[to]!;
    const { halfmove, leaps } = position;
    const san = this.notation(move, piece, captured, candidates);
    position.board[to] = promotion ? { color, type: promotion, promoted: true } : piece;
    if (piece.type === 'k') position.leaps &= ~leapFlag(color);
    position.board[from] = null;
    position.turn = opposite(color);
    position.halfmove = captured || piece.type === 'p' ? 0 : halfmove + 1;
    if (color === 'b') position.fullmove++;
    this.keys.push(this.key());
    const record: VariantMoveRecord = {
      color, piece: { ...piece }, captured: captured ? { ...captured } : null, to, uci, fenAfter: this.fen(),
      san: san + (this.inCheck() ? (this.status().kind === 'checkmate' ? '#' : '+') : ''),
    };
    this.history.push({ move, record, halfmove, leaps, piece, captured });
    return record;
  }

  private notation(move: Move, piece: Piece, captured: Piece | null, candidates: readonly Move[]): string {
    const { from, to, promotion } = move;
    const source = squareName(from);
    const destination = squareName(to);
    const capture = captured ? 'x' : '';
    if (piece.type === 'p') return (captured ? source[0] + capture : '') + destination + (promotion ? `=${promotion.toUpperCase()}` : '');

    const others = candidates.filter((candidate) =>
      candidate.to === to && candidate.from !== from && this.position.board[candidate.from]?.type === piece.type);
    let disambiguation = '';
    if (others.length) {
      if (others.every((candidate) => fileOf(candidate.from) !== fileOf(from))) disambiguation = source[0]!;
      else if (others.every((candidate) => rankOf(candidate.from) !== rankOf(from))) disambiguation = source.slice(1);
      else disambiguation = source;
    }
    return piece.type.toUpperCase() + disambiguation + capture + destination;
  }

  undo(): VariantMoveRecord | null {
    const entry = this.history.pop();
    if (!entry) return null;
    const { move, record, halfmove, leaps, piece, captured } = entry;
    this.position.board[move.from] = piece;
    this.position.board[move.to] = captured;
    this.position.turn = record.color;
    this.position.halfmove = halfmove;
    this.position.leaps = leaps;
    if (record.color === 'b') this.position.fullmove--;
    this.keys.pop();
    return record;
  }
}

export const acedrex = {
  id: 'acedrex',
  files: FILES,
  ranks: RANKS,
  startFen: START_FEN,
  pieceTypes: PIECE_TYPES,
  hasHands: false,
  createGame: (fen?: string) => new Game(fen),
} satisfies Variant<Game>;
