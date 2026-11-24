import { IllegalMoveError, type Color, type GameStatus, type Square, type Variant, type VariantMoveRecord } from '@chaturanga/rules-core';
import { attackedSquares, boardAfter, checkedKing, legalMoves, moveUci, type Move } from './movement';
import {
  FILES, RANKS, START_FEN, PIECE_TYPES, goalReached, isPawn, isPlayable, opposite, parseFen, placementOf, squareName,
  type Piece, type Position,
} from './position';

export { FILES, RANKS, START_FEN, PAWN_TARGET, isPawn, isPlayable, ownCitadel, squareName, type Piece, type PieceType } from './position';

interface HistoryEntry {
  position: Position;
  record: VariantMoveRecord;
}

export class Game {
  private position: Position;
  private readonly history: HistoryEntry[] = [];
  private readonly candidates = new WeakMap<Position, Move[]>();

  constructor(fen: string = START_FEN) {
    this.position = parseFen(fen);
  }

  get turn(): Color { return this.position.turn; }

  fen(): string {
    const { board, turn, rights, halfmove, fullmove } = this.position;
    return `${placementOf(board)} ${turn} ${rights || '-'} - ${halfmove} ${fullmove}`;
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
  legalUci(): string[] { return this.availableMoves().map(moveUci); }
  status(): GameStatus { return this.evaluate(this.availableMoves()); }

  private availableMoves(): Move[] {
    const cached = this.candidates.get(this.position);
    if (cached) return cached;
    const moves = legalMoves(this.position);
    this.candidates.set(this.position, moves);
    return moves;
  }

  private evaluate(moves: readonly Move[]): GameStatus {
    if (this.position.rights.includes(goalReached)) return { kind: 'goal-square' };
    if (moves.length) return { kind: 'ongoing' };
    const winner = opposite(this.turn);
    return this.inCheck() ? { kind: 'checkmate', winner } : { kind: 'stalemate', winner };
  }

  move(uci: string): VariantMoveRecord {
    const position = this.position;
    const move = this.availableMoves().find((candidate) => moveUci(candidate) === uci);
    if (!move) throw new IllegalMoveError(uci);
    const { from, to, promotion, spendRight, draw } = move;
    const { turn: color, rights, board, halfmove, fullmove } = position;
    const piece = board[from]!;
    const target = board[to];
    const captured = target?.color === opposite(color) ? target : null;
    this.position = {
      board: boardAfter(board, move),
      turn: opposite(color),
      rights: (spendRight ? rights.replace(spendRight, '') : rights) + (draw ? goalReached : ''),
      halfmove: captured || isPawn(piece.type) ? 0 : halfmove + 1,
      fullmove: fullmove + (color === 'b' ? 1 : 0),
    };
    const check = this.inCheck() ? (this.status().kind === 'checkmate' ? '#' : '+') : '';
    const san = squareName(from) + (captured ? 'x' : '–') + squareName(to) +
      (promotion ? `=${promotion.toUpperCase()}` : '') + check;
    const record: VariantMoveRecord = {
      color, piece: { ...piece }, captured: captured ? { ...captured } : null, to, uci, fenAfter: this.fen(), san,
    };
    this.history.push({ position, record });
    return record;
  }

  undo(): VariantMoveRecord | null {
    const entry = this.history.pop();
    if (!entry) return null;
    this.position = entry.position;
    return entry.record;
  }
}

export const tamerlane = {
  id: 'tamerlane',
  files: FILES,
  ranks: RANKS,
  isPlayable,
  startFen: START_FEN,
  pieceTypes: PIECE_TYPES,
  hasHands: false,
  createGame: (fen?: string) => new Game(fen),
} satisfies Variant<Game>;
