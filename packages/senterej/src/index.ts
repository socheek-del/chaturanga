import {
  fileOf,
  IllegalMoveError,
  rankOf,
  squareName,
  type Color,
  type GameStatus,
  type Square,
  type Variant,
  type VariantMoveRecord,
} from '@chaturanga/rules-core';
import {
  attackedSquares,
  checkedKing,
  legalMoves,
  moveUci,
  opposite,
  parseFen,
  PIECE_TYPES,
  placementOf,
  START_FEN,
  type Move,
  type Piece,
  type Position,
} from './position';

export { parseSquare, squareName, START_FEN, type Piece, type PieceType, type Phase } from './position';

interface HistoryEntry {
  move: Move;
  record: VariantMoveRecord;
  turn: Color;
  phase: Position['phase'];
  halfmove: number;
  fullmove: number;
  loneSupport: Position['loneSupport'];
  piece: Piece;
  captured: Piece | null;
}

function copyTracks(tracks: Position['loneSupport']): Position['loneSupport'] {
  return { w: tracks.w ? { ...tracks.w } : null, b: tracks.b ? { ...tracks.b } : null };
}

function nonPawnSupport(board: Position['board'], color: Color): Array<{ square: Square; piece: Piece }> {
  return board.flatMap((piece, square) => piece?.color === color && piece.type !== 'k' && piece.type !== 'p'
    ? [{ square, piece }]
    : []);
}

export class Game {
  private readonly position: Position;
  private readonly history: HistoryEntry[] = [];
  private readonly keys: string[];

  constructor(fen: string = START_FEN) {
    this.position = parseFen(fen);
    this.keys = [this.key()];
  }

  get turn(): Color { return this.position.turn; }
  get phase(): Position['phase'] { return this.position.phase; }
  get loneSupport(): Readonly<Position['loneSupport']> { return copyTracks(this.position.loneSupport); }

  activePlayers(): readonly Color[] {
    return this.phase === 'werera' ? ['w', 'b'] : [this.turn];
  }

  private key(): string {
    return `${placementOf(this.position.board)} ${this.turn} ${this.phase} ${this.supportField('w')} ${this.supportField('b')}`;
  }

  private supportField(color: Color): string {
    const track = this.position.loneSupport[color];
    return track ? `${track.square},${track.moves}` : '-';
  }

  fen(): string {
    const { halfmove, fullmove, phase } = this.position;
    return `${placementOf(this.position.board)} ${this.turn} - - ${halfmove} ${fullmove} ${phase} ${this.supportField('w')} ${this.supportField('b')}`;
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
  inCheck(): boolean { return this.phase === 'turn' && this.checkedKingSquare() !== null; }
  checkedKingSquare(): Square | null { return this.phase === 'turn' ? checkedKing(this.position.board, this.turn) : null; }
  attackedSquares(color: Color): Square[] { return attackedSquares(this.position.board, color); }
  isGameOver(): boolean { return this.status().kind !== 'ongoing'; }

  legalUci(): string[] {
    return this.legalUciFor(this.turn);
  }

  legalUciFor(color: Color): string[] {
    if (!this.activePlayers().includes(color) || this.status().kind !== 'ongoing') return [];
    return this.availableMoves(color).map(moveUci);
  }

  private availableMoves(color: Color): Move[] {
    return legalMoves(this.position.board, color, this.phase === 'turn');
  }

  status(): GameStatus {
    if (this.phase === 'werera') {
      return this.availableMoves('w').length || this.availableMoves('b').length
        ? { kind: 'ongoing' }
        : { kind: 'stalemate' };
    }

    // A lone Negus cannot be mated in this profile. Medeq do not count as capital support.
    if (nonPawnSupport(this.position.board, 'w').length === 0 || nonPawnSupport(this.position.board, 'b').length === 0) {
      return { kind: 'bare-king' };
    }

    const moves = this.availableMoves(this.turn);
    if (moves.length === 0) {
      return this.checkedKingSquare() !== null
        ? { kind: 'checkmate', winner: opposite(this.turn) }
        : { kind: 'stalemate' };
    }
    if (this.keys.filter((key) => key === this.keys.at(-1)).length >= 3) return { kind: 'repetition' };
    if (this.position.loneSupport.w?.moves === 7 || this.position.loneSupport.b?.moves === 7) return { kind: 'counting' };
    return { kind: 'ongoing' };
  }

  move(uci: string): VariantMoveRecord {
    return this.moveFor(this.turn, uci);
  }

  moveFor(color: Color, uci: string): VariantMoveRecord {
    if (!this.activePlayers().includes(color) || this.status().kind !== 'ongoing') throw new IllegalMoveError(uci);
    const candidates = this.availableMoves(color);
    const move = candidates.find((candidate) => moveUci(candidate) === uci);
    if (!move) throw new IllegalMoveError(uci);

    const position = this.position;
    const { from, to, promotion } = move;
    const mover = position.board[from]!;
    const captured = position.board[to]!;
    const turn = position.turn;
    const phase = position.phase;
    const halfmove = position.halfmove;
    const fullmove = position.fullmove;
    const loneSupport = copyTracks(position.loneSupport);
    const san = this.notation(move, mover, captured, candidates);

    position.board[to] = promotion ? { color, type: 'q', promoted: true } : mover;
    position.board[from] = null;
    if (phase === 'werera' && captured) position.phase = 'turn';
    // During Werera this is a compatibility/bot cursor only; either seat remains active until capture.
    position.turn = opposite(color);
    position.halfmove = captured || mover.type === 'p' ? 0 : halfmove + 1;
    if (phase === 'turn' && color === 'b') position.fullmove++;
    position.loneSupport = this.updateLoneSupport(loneSupport, color, from, to, mover);
    this.keys.push(this.key());

    const action = captured ? 'capture' : 'move';
    const suffix = this.inCheck() ? (this.status().kind === 'checkmate' ? '#' : '+') : '';
    const record: VariantMoveRecord = {
      color,
      piece: { ...mover },
      captured: captured ? { ...captured } : null,
      action,
      to,
      uci,
      fenAfter: this.fen(),
      san: san + suffix,
    };
    this.history.push({ move, record, turn, phase, halfmove, fullmove, loneSupport, piece: mover, captured });
    return record;
  }

  private updateLoneSupport(
    previous: Position['loneSupport'],
    mover: Color,
    from: Square,
    to: Square,
    movedPiece: Piece,
  ): Position['loneSupport'] {
    const next: Position['loneSupport'] = { w: null, b: null };
    for (const color of ['w', 'b'] as const) {
      const supports = nonPawnSupport(this.position.board, color);
      if (supports.length !== 1) continue;
      const only = supports[0]!;
      const before = previous[color];
      if (!before) {
        next[color] = { square: only.square, moves: 0 };
        continue;
      }
      const movedTrackedPiece = color === mover && before.square === from && movedPiece.type !== 'k' && movedPiece.type !== 'p';
      const expectedSquare = movedTrackedPiece ? to : before.square;
      if (only.square === expectedSquare && this.position.board[expectedSquare]?.type === movedPiece.type && movedTrackedPiece) {
        next[color] = { square: only.square, moves: before.moves + 1 };
      } else if (only.square === expectedSquare && this.position.board[expectedSquare]?.color === color) {
        next[color] = { square: only.square, moves: before.moves };
      } else {
        next[color] = { square: only.square, moves: 0 };
      }
    }
    return next;
  }

  private notation(move: Move, piece: Piece, captured: Piece | null, candidates: readonly Move[]): string {
    const { from, to, promotion } = move;
    const source = squareName(from);
    const destination = squareName(to);
    if (piece.type === 'p') return (captured ? source[0] + 'x' : '') + destination + (promotion ? '=Q' : '');
    const alternatives = candidates.filter((candidate) =>
      candidate.to === to && candidate.from !== from && this.position.board[candidate.from]?.type === piece.type);
    let disambiguation = '';
    if (alternatives.length) {
      if (alternatives.every((candidate) => fileOf(candidate.from) !== fileOf(from))) disambiguation = source[0]!;
      else if (alternatives.every((candidate) => rankOf(candidate.from) !== rankOf(from))) disambiguation = source[1]!;
      else disambiguation = source;
    }
    return piece.type.toUpperCase() + disambiguation + (captured ? 'x' : '') + destination;
  }

  undo(): VariantMoveRecord | null {
    const entry = this.history.pop();
    if (!entry) return null;
    const { move, record, turn, phase, halfmove, fullmove, loneSupport, piece, captured } = entry;
    this.position.board[move.from] = piece;
    this.position.board[move.to] = captured;
    this.position.turn = turn;
    this.position.phase = phase;
    this.position.halfmove = halfmove;
    this.position.fullmove = fullmove;
    this.position.loneSupport = loneSupport;
    this.keys.pop();
    return record;
  }
}

export const senterej = {
  id: 'senterej',
  files: 8,
  ranks: 8,
  startFen: START_FEN,
  pieceTypes: PIECE_TYPES,
  hasHands: false,
  players: ['w', 'b'],
  createGame: (fen?: string) => new Game(fen),
} satisfies Variant<Game>;
