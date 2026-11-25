import {
  IllegalMoveError, type Color, type GameStatus, type Square, type Variant, type VariantMoveRecord,
} from '@chaturanga/rules-core';
import {
  FILES, RANKS, START_FEN, PIECE_TYPES, attackedSquares, bodyguardZones, checkedKing, fileOf, legalMoves, moveUci,
  opposite, parseFen, placementOf, rankOf, squareName, validEpTargets, type Move, type Piece, type Position,
} from './position';

export { FILES, RANKS, START_FEN, PIECE_TYPES, parseFen, squareName, type Piece, type PieceType } from './position';

interface HistoryEntry {
  move: Move;
  record: VariantMoveRecord;
  halfmove: number;
  epTargets: Square[];
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

  private epField(): string {
    return this.position.epTargets.length ? this.position.epTargets.map(squareName).join(',') : '-';
  }

  private key(): string {
    return `${placementOf(this.position.board)} ${this.turn} ${this.epField()}`;
  }

  fen(): string {
    return `${placementOf(this.position.board)} ${this.turn} - ${this.epField()} ${this.position.halfmove} ${this.position.fullmove}`;
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
  bodyguardZones() { return bodyguardZones(this.position.board); }
  isGameOver(): boolean { return this.status().kind !== 'ongoing'; }

  legalUci(): string[] {
    const moves = legalMoves(this.position.board, this.turn, this.position.epTargets);
    return this.evaluate(moves).kind === 'ongoing' ? moves.map(moveUci) : [];
  }

  status(): GameStatus {
    return this.evaluate(legalMoves(this.position.board, this.turn, this.position.epTargets));
  }

  private evaluate(moves: readonly Move[]): GameStatus {
    if (!moves.length) return this.inCheck() ? { kind: 'checkmate', winner: opposite(this.turn) } : { kind: 'stalemate' };
    if (this.keys.filter((key) => key === this.keys.at(-1)).length >= 3) return { kind: 'repetition' };
    if (this.position.halfmove >= NO_PROGRESS_PLIES) return { kind: 'fifty-move' };
    return { kind: 'ongoing' };
  }

  move(uci: string): VariantMoveRecord {
    const position = this.position;
    const candidates = legalMoves(position.board, position.turn, position.epTargets);
    const move = candidates.find((candidate) => moveUci(candidate) === uci);
    if (!move || this.evaluate(candidates).kind !== 'ongoing') throw new IllegalMoveError(uci);
    const { from, to, promotion, captureAt } = move;
    const color = position.turn;
    const piece = position.board[from]!;
    const captured = captureAt === null ? null : position.board[captureAt];
    const halfmove = position.halfmove;
    const epTargets = [...position.epTargets];
    const san = this.notation(move, piece, captured ?? null, candidates);

    position.board[from] = null;
    if (captureAt !== null && captureAt !== to) position.board[captureAt] = null;
    position.board[to] = promotion ? { color, type: promotion, promoted: true } : piece;
    position.epTargets = [];
    if (piece.type === 'p') {
      const startRank = color === 'w' ? 1 : RANKS - 2;
      const distance = (rankOf(to) - rankOf(from)) * (color === 'w' ? 1 : -1);
      if (rankOf(from) === startRank && (distance === 2 || distance === 3)) {
        const passed = Array.from({ length: distance - 1 }, (_, i) => from + (color === 'w' ? 1 : -1) * FILES * (i + 1));
        position.turn = opposite(color);
        if (validEpTargets(position.board, position.turn, passed)) position.epTargets = passed;
      }
    }
    position.turn = opposite(color);
    position.halfmove = captured || piece.type === 'p' ? 0 : halfmove + 1;
    if (color === 'b') position.fullmove++;
    this.keys.push(this.key());
    const record: VariantMoveRecord = {
      color,
      piece: { ...piece },
      captured: captured ? { ...captured } : null,
      to,
      uci,
      fenAfter: this.fen(),
      san: san + (this.inCheck() ? (this.status().kind === 'checkmate' ? '#' : '+') : ''),
    };
    this.history.push({ move, record, halfmove, epTargets, piece, captured: captured ?? null });
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
      else if (others.every((candidate) => rankOf(candidate.from) !== rankOf(from))) disambiguation = source.slice(1);
      else disambiguation = source;
    }
    return piece.type.toUpperCase() + disambiguation + capture + destination;
  }

  undo(): VariantMoveRecord | null {
    const entry = this.history.pop();
    if (!entry) return null;
    const { move, record, halfmove, epTargets, piece, captured } = entry;
    this.position.board[move.from] = piece;
    this.position.board[move.to] = null;
    this.position.board[move.captureAt ?? move.to] = captured;
    this.position.turn = record.color;
    this.position.halfmove = halfmove;
    this.position.epTargets = epTargets;
    if (record.color === 'b') this.position.fullmove--;
    this.keys.pop();
    return record;
  }
}

export const hiashatar = {
  id: 'hiashatar',
  files: FILES,
  ranks: RANKS,
  startFen: START_FEN,
  pieceTypes: PIECE_TYPES,
  hasHands: false,
  createGame: (fen?: string) => new Game(fen),
} satisfies Variant<Game>;
