import { IllegalMoveError, type Color, type GameStatus, type Piece, type Square, type VariantMoveRecord } from '@chaturanga/rules-core';
import {
  BLACK,
  CENTER,
  codeToPiece,
  colorBits,
  knightTargets,
  opposite,
  type Board,
} from './board';
import { count, parseFen, placementOf, serializeFen, squareName, type GoalState, type GoalWinner, START_FEN } from './fen';

interface HistoryEntry {
  from: Square;
  to: Square;
  captured: number;
  turn: Color;
  halfmove: number;
  fullmove: number;
  pending: GoalState;
  goalWinner: GoalWinner;
  record: VariantMoveRecord<Color>;
  key: string;
}

export class Game {
  private readonly board: Board;
  private turnValue: Color;
  private halfmove: number;
  private fullmove: number;
  private pending: GoalState;
  private goalWinner: GoalWinner;
  private readonly history: HistoryEntry[] = [];
  private readonly repetitions = new Map<string, number>();

  constructor(fen: string = START_FEN) {
    const data = parseFen(fen);
    this.board = data.board;
    this.turnValue = data.turn;
    this.halfmove = data.halfmove;
    this.fullmove = data.fullmove;
    this.pending = data.pending;
    this.goalWinner = data.goalWinner;
    this.pushPosition();
  }

  get turn(): Color {
    return this.turnValue;
  }

  /** Side that must escape e5; null when no center attempt is pending. */
  pendingCenterGoal(): Color | null {
    return this.pending;
  }

  fen(): string {
    return serializeFen({
      board: this.board,
      turn: this.turnValue,
      halfmove: this.halfmove,
      fullmove: this.fullmove,
      pending: this.pending,
      goalWinner: this.goalWinner,
    });
  }

  pieceAt(square: Square): Piece<'n', Color> | null {
    const code = this.board[square] ?? 0;
    return code ? codeToPiece(code) : null;
  }

  pieces(): Array<{ square: Square; piece: Piece<'n', Color> }> {
    const out: Array<{ square: Square; piece: Piece<'n', Color> }> = [];
    this.board.forEach((code, square) => {
      if (code) out.push({ square, piece: codeToPiece(code) });
    });
    return out;
  }

  hand(_color: Color): readonly string[] {
    return [];
  }

  legalUci(): string[] {
    return this.status().kind === 'ongoing' ? this.rawLegalUci() : [];
  }

  move(uci: string): VariantMoveRecord<Color> {
    if (!this.legalUci().includes(uci)) throw new IllegalMoveError(uci);
    const fromName = uci.slice(0, 2);
    const toName = uci.slice(2, 4);
    const from = fromName.charCodeAt(1) - 49;
    const sourceFile = fromName.charCodeAt(0) - 97;
    const sourceSquare = from * 9 + sourceFile;
    const to = (Number(toName[1]) - 1) * 9 + toName.charCodeAt(0) - 97;
    return this.play(sourceSquare, to, uci);
  }

  undo(): VariantMoveRecord<Color> | null {
    const entry = this.history.pop();
    if (!entry) return null;
    this.repetitions.set(entry.key, (this.repetitions.get(entry.key) ?? 0) - 1);
    const moved = this.board[entry.to]!;
    this.board[entry.from] = moved;
    this.board[entry.to] = entry.captured;
    this.turnValue = entry.turn;
    this.halfmove = entry.halfmove;
    this.fullmove = entry.fullmove;
    this.pending = entry.pending;
    this.goalWinner = entry.goalWinner;
    return entry.record;
  }

  moves(): VariantMoveRecord<Color>[] {
    return this.history.map((entry) => entry.record);
  }

  lastMove(): VariantMoveRecord<Color> | null {
    return this.history.at(-1)?.record ?? null;
  }

  status(): GameStatus<Color> {
    if (this.goalWinner) return { kind: 'goal-square', winner: this.goalWinner };
    const whiteCount = count(this.board, 'w');
    const blackCount = count(this.board, 'b');
    if (whiteCount === 0) return { kind: 'elimination', winner: 'b' };
    if (blackCount === 0) return { kind: 'elimination', winner: 'w' };
    if (this.rawLegalUci().length === 0) return { kind: 'stalemate', winner: opposite(this.turnValue) };
    if ((this.repetitions.get(this.positionKey()) ?? 0) >= 3) return { kind: 'repetition' };
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
    const attacked = new Set<Square>();
    this.board.forEach((code, from) => {
      if (code && (code & BLACK) === colorBits(color)) for (const to of knightTargets(from)) attacked.add(to);
    });
    return [...attacked].sort((a, b) => a - b);
  }

  counting(): null {
    return null;
  }

  private rawLegalUci(): string[] {
    if (this.goalWinner || count(this.board, 'w') === 0 || count(this.board, 'b') === 0) return [];
    const forcedEscape = this.pending === this.turnValue ? CENTER : null;
    const ownBits = colorBits(this.turnValue);
    const moves: string[] = [];
    this.board.forEach((code, from) => {
      if (!code || (code & BLACK) !== ownBits || (forcedEscape !== null && from !== forcedEscape)) return;
      for (const to of knightTargets(from)) {
        const target = this.board[to]!;
        if (target && (target & BLACK) === ownBits) continue;
        moves.push(`${squareName(from)}${squareName(to)}`);
      }
    });
    return moves;
  }

  private play(from: Square, to: Square, uci: string): VariantMoveRecord<Color> {
    const mover = this.turnValue;
    const source = this.board[from]!;
    const capturedCode = this.board[to]!;
    const previousPending = this.pending;
    const previousWinner = this.goalWinner;
    const previousHalfmove = this.halfmove;
    const previousFullmove = this.fullmove;
    const san = `${squareName(from)}${capturedCode ? 'x' : '-'}${squareName(to)}`;

    this.board[from] = 0;
    this.board[to] = source;
    if (previousPending === mover && from === CENTER) {
      this.pending = null;
      this.goalWinner = mover;
    } else if (to === CENTER) this.pending = mover;

    this.halfmove = capturedCode ? 0 : this.halfmove + 1;
    if (mover === 'b') this.fullmove++;
    this.turnValue = opposite(mover);
    if (count(this.board, opposite(mover)) === 0 && !this.goalWinner) this.pending = null;
    const key = this.positionKey();
    this.repetitions.set(key, (this.repetitions.get(key) ?? 0) + 1);

    const record: VariantMoveRecord<Color> = {
      uci,
      san,
      color: mover,
      piece: codeToPiece(source),
      captured: capturedCode ? codeToPiece(capturedCode) : null,
      to,
      fenAfter: this.fen(),
    };
    this.history.push({
      from,
      to,
      captured: capturedCode,
      turn: mover,
      halfmove: previousHalfmove,
      fullmove: previousFullmove,
      pending: previousPending,
      goalWinner: previousWinner,
      record,
      key,
    });
    return record;
  }

  private positionKey(): string {
    return `${placementOf(this.board)} ${this.turnValue} ${this.pending ?? '-'}`;
  }

  private pushPosition(): void {
    const key = this.positionKey();
    this.repetitions.set(key, 1);
  }
}
