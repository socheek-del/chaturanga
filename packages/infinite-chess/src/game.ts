import { FenError, IllegalMoveError, type GameStatus } from '@chaturanga/rules-core';
import { inCheck as positionInCheck, isAttackedAt as positionIsAttacked, kingSquare } from './attacks';
import { canonicalSquare, pointOf } from './coordinates';
import { parseFen, serializePosition, START_FEN } from './fen';
import { applyMove, clonePosition, hasAnyLegalMove, isLegalMove, legalMovesTo, parseUci, uciOf } from './movegen';
import type { Color, CoordinateMove, MoveRecord, Piece, Position, Square } from './types';

interface HistoryEntry {
  before: Position;
  record: MoveRecord;
}

function other(color: Color): Color {
  return color === 'w' ? 'b' : 'w';
}

function pieceLetter(piece: Piece): string {
  return piece.type === 'p' ? '' : piece.type.toUpperCase();
}

function legalEnPassantKey(position: Position): string {
  if (!position.enPassant) return '-';
  const ep = pointOf(position.enPassant);
  const fromY = ep.y - (position.turn === 'w' ? 1n : -1n);
  for (const x of [ep.x - 1n, ep.x + 1n]) {
    const from = `${x},${fromY}`;
    const pawn = position.board.get(from);
    if (pawn?.color !== position.turn || pawn.type !== 'p') continue;
    if (isLegalMove(position, { from, to: position.enPassant, promotion: null })) return position.enPassant;
  }
  return '-';
}

function positionKey(position: Position): string {
  const fen = serializePosition(position).split(' ');
  return `${fen[0]} ${fen[1]} ${fen[2]} ${legalEnPassantKey(position)}`;
}

function insufficientMaterial(position: Position): boolean {
  let knights = 0;
  let bishops = 0;
  let bishopColors = 0;
  for (const [square, piece] of position.board) {
    if (piece.type === 'p' || piece.type === 'r' || piece.type === 'q') return false;
    if (piece.type === 'n') knights++;
    if (piece.type === 'b') {
      bishops++;
      const point = pointOf(square);
      bishopColors |= 1 << Number((point.x + point.y) & 1n);
    }
  }
  if (knights + bishops <= 1) return true;
  return knights === 0 && bishopColors !== 3;
}

function repetitionCount(keys: readonly string[], key: string): number {
  let count = 0;
  for (const seen of keys) if (seen === key) count++;
  return count;
}

function san(move: CoordinateMove, piece: Piece, captured: Piece | null): string {
  const from = pointOf(move.from);
  const to = pointOf(move.to);
  if (piece.type === 'k' && to.y === from.y && (to.x === from.x + 2n || to.x === from.x - 2n))
    return to.x > from.x ? 'O-O' : 'O-O-O';
  const capture = captured !== null || (piece.type === 'p' && move.from.split(',')[0] !== move.to.split(',')[0]);
  const origin = piece.type === 'p' ? move.from : `${pieceLetter(piece)}${move.from}`;
  const promotion = move.promotion ? `=${move.promotion.toUpperCase()}` : '';
  return `${origin}${capture ? 'x' : '-'}${move.to}${promotion}`;
}

/** Pure rules engine for the official Classical Infinite Chess setup. */
export class Game {
  private position: Position;
  private readonly history: HistoryEntry[] = [];
  private readonly keys: string[];

  constructor(fen: string = START_FEN) {
    this.position = parseFen(fen);
    this.keys = [positionKey(this.position)];
  }

  get turn(): Color {
    return this.position.turn;
  }

  fen(): string {
    return serializePosition(this.position);
  }

  pieceAt(square: Square): Piece | null {
    const canonical = canonicalSquare(square);
    return canonical ? this.position.board.get(canonical) ?? null : null;
  }

  pieces(): Array<{ square: Square; piece: Piece }> {
    return [...this.position.board].map(([square, piece]) => ({ square, piece }));
  }

  hand(): readonly string[] {
    return [];
  }

  /** Legal moves whose destination appears in the caller's finite viewport/query set. */
  legalUciIn(squares: readonly Square[]): string[] {
    return legalMovesTo(this.position, squares);
  }

  /** Exact point query; this game intentionally does not construct an infinite attack-map array. */
  isAttackedAt(color: Color, square: Square): boolean {
    const canonical = canonicalSquare(square);
    return canonical ? positionIsAttacked(this.position, color, canonical) : false;
  }

  inCheck(): boolean {
    return positionInCheck(this.position);
  }

  checkedKingSquare(): Square | null {
    return this.inCheck() ? kingSquare(this.position, this.position.turn) : null;
  }

  moves(): MoveRecord[] {
    return this.history.map(({ record }) => record);
  }

  lastMove(): MoveRecord | null {
    return this.history.at(-1)?.record ?? null;
  }

  move(uci: string): MoveRecord {
    const move = parseUci(uci);
    if (!move || !isLegalMove(this.position, move)) throw new IllegalMoveError(uci);

    const before = clonePosition(this.position);
    const piece = this.position.board.get(move.from)!;
    const color = this.position.turn;
    const captured = applyMove(this.position, move);
    const key = positionKey(this.position);
    this.keys.push(key);
    const check = positionInCheck(this.position);
    const mate = check && !hasAnyLegalMove(this.position);
    const baseSan = san(move, piece, captured);
    const record: MoveRecord = {
      uci: uciOf(move),
      san: `${baseSan}${mate ? '#' : check ? '+' : ''}`,
      color,
      piece,
      captured,
      action: captured ? 'capture' : 'move',
      to: move.to,
      fenAfter: this.fen(),
    };
    this.history.push({ before, record });
    return record;
  }

  undo(): MoveRecord | null {
    const entry = this.history.pop();
    if (!entry) return null;
    this.position = entry.before;
    this.keys.pop();
    return entry.record;
  }

  status(): GameStatus {
    const check = this.inCheck();
    if (!hasAnyLegalMove(this.position)) return check ? { kind: 'checkmate', winner: other(this.turn) } : { kind: 'stalemate' };
    if (insufficientMaterial(this.position)) return { kind: 'insufficient-material' };
    if (repetitionCount(this.keys, this.keys.at(-1)!) >= 3) return { kind: 'repetition' };
    if (this.position.halfmoveClock >= 100) return { kind: 'fifty-move' };
    return { kind: 'ongoing' };
  }

  isGameOver(): boolean {
    return this.status().kind !== 'ongoing';
  }

  counting(): null {
    return null;
  }

  halfmoveClock(): number {
    return this.position.halfmoveClock;
  }

  fullmoveNumber(): number {
    return this.position.fullmoveNumber;
  }
}

export { FenError, IllegalMoveError };
