import {
  fileOf, IllegalMoveError, rankOf, squareName, type Color, type GameStatus, type Square, type Variant, type VariantMoveRecord,
} from '@chaturanga/rules-core';
import {
  attackedSquares, checkedKing, checkingTypes, givesShak, legalMoves, moveUci, opposite, parseFen, PIECE_TYPES, placementOf,
  START_FEN, type Move, type Piece, type Position,
} from './position';

export { parseSquare, squareName, START_FEN, type Piece, type PieceType } from './position';

interface HistoryEntry {
  move: Move;
  record: VariantMoveRecord;
  halfmove: number;
  shak: number;
  piece: Piece;
  captured: Piece | null;
}
const NO_PROGRESS_PLIES = 100;
const shakBit = (color: Color): number => color === 'w' ? 1 : 2;

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
    const shak = this.position.shak;
    const flags = (shak & 1 ? 'S' : '') + (shak & 2 ? 's' : '');
    return `${placementOf(this.position.board)} ${this.turn} ${flags || '-'}`;
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
    const own = board.some((piece) => piece?.color === this.turn && piece.type !== 'k');
    const other = board.some((piece) => piece?.color === opponent && piece.type !== 'k');
    if (!own || !other) return { kind: 'bare-king' };
    if (!moves.length) {
      const checks = checkingTypes(board, this.turn);
      if (!checks.length) return { kind: 'stalemate' };
      if (checks.every((type) => type === 'n')) return { kind: 'restricted-mate', winner: this.turn };
      if (givesShak(checks) || (this.position.shak & shakBit(opponent))) {
        return { kind: 'checkmate', winner: opponent };
      }
      return { kind: 'restricted-mate' };
    }
    if (this.keys.filter((key) => key === this.keys.at(-1)).length >= 3) return { kind: 'repetition' };
    if (halfmove >= NO_PROGRESS_PLIES) return { kind: 'fifty-move' };
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
    const { halfmove, shak } = position;
    const opposingBit = shakBit(opposite(color));
    const checkingBefore = checkingTypes(position.board, color);
    const san = this.notation(move, piece, captured, candidates);
    position.board[to] = promotion ? { color, type: 'j', promoted: true } : piece;
    position.board[from] = null;
    position.turn = opposite(color);
    if (givesShak(checkingBefore)) position.shak |= opposingBit;
    const checks = checkingTypes(position.board, position.turn);
    const attackingBit = shakBit(color);
    if (givesShak(checks)) position.shak |= attackingBit;
    else if (!checks.length) position.shak &= ~attackingBit;
    position.halfmove = captured || piece.type === 'p' ? 0 : halfmove + 1;
    if (color === 'b') position.fullmove++;
    this.keys.push(this.key());
    const result = checks.length ? this.status() : null;
    const mate = result?.kind === 'checkmate' || result?.kind === 'restricted-mate';
    const record: VariantMoveRecord = {
      color, piece: { ...piece }, captured: captured ? { ...captured } : null, to, uci, fenAfter: this.fen(),
      san: san + (checks.length ? (mate ? '#' : '+') : ''),
    };
    this.history.push({ move, record, halfmove, shak, piece, captured });
    return record;
  }

  private notation(move: Move, piece: Piece, captured: Piece | null, candidates: readonly Move[]): string {
    const { from, to, promotion } = move;
    const source = squareName(from);
    const destination = squareName(to);
    const capture = captured ? 'x' : '';
    if (piece.type === 'p') return (captured ? source[0] + capture : '') + destination + (promotion ? '=J' : '');

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
    const { move, record, halfmove, shak, piece, captured } = entry;
    this.position.board[move.from] = piece;
    this.position.board[move.to] = captured;
    this.position.turn = record.color;
    this.position.halfmove = halfmove;
    this.position.shak = shak;
    if (record.color === 'b') this.position.fullmove--;
    this.keys.pop();
    return record;
  }
}

export const shatar = {
  id: 'shatar',
  files: 8,
  ranks: 8,
  startFen: START_FEN,
  pieceTypes: PIECE_TYPES,
  hasHands: false,
  createGame: (fen?: string) => new Game(fen),
} satisfies Variant<Game>;
