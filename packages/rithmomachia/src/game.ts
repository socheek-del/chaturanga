import {
  FenError,
  IllegalMoveError,
  type Color,
  type GameStatus,
  type Piece,
  type Square,
  type VariantMoveRecord,
} from '@chaturanga/rules-core';
import { BOARD_CELLS, FILES, RANKS, squareName } from './layout';
import { attackedSquares, captureResult, legalActions, updatedTargetAfterCapture, type Action } from './movement';
import {
  opposite,
  parseFen,
  pieceAtName,
  pieceFromType,
  positionKey,
  serializeFen,
  START_FEN,
  type Board,
  type Position,
  type RithPiece,
} from './position';

interface HistoryEntry {
  readonly before: Position;
  readonly key: string;
  readonly record: VariantMoveRecord<Color>;
}

const asPiece = (piece: RithPiece): Piece<string, Color> => ({ color: piece.color, type: piece.type, promoted: false });

function greatVictoryWinner(position: Position): Color | null {
  const directions = [[1, 0], [0, 1], [1, 1], [1, -1]] as const;
  for (const color of ['w', 'b'] as const) {
    for (let middle = 0; middle < BOARD_CELLS.length; middle++) {
      const center = position.board[middle];
      if (center?.color !== color) continue;
      const file = middle % FILES;
      const rank = Math.floor(middle / FILES);
      for (const [dx, dy] of directions) {
        const firstFile = file - dx;
        const firstRank = rank - dy;
        const lastFile = file + dx;
        const lastRank = rank + dy;
        if (firstFile < 0 || firstFile >= FILES || lastFile < 0 || lastFile >= FILES || firstRank < 0 || firstRank >= RANKS || lastRank < 0 || lastRank >= RANKS) continue;
        const opponentHalf = color === 'w' ? (rank >= 8 && firstRank >= 8 && lastRank >= 8) : (rank < 8 && firstRank < 8 && lastRank < 8);
        if (!opponentHalf) continue;
        const first = position.board[firstRank * FILES + firstFile];
        const last = position.board[lastRank * FILES + lastFile];
        if (first?.color === color && last?.color === color && first.value + last.value === center.value * 2) return color;
      }
    }
  }
  return null;
}

function sanFor(action: Action, moved: RithPiece): string {
  if (action.kind === 'drop') return `${action.type.toUpperCase()}@${squareName(action.to)}`;
  if (action.kind === 'capture') return `${moved.type.toUpperCase()}:${squareName(action.from)}×${squareName(action.to)}${action.uci.slice(-1).match(/[a-kz]/) ? ` [${action.uci.slice(-1)}]` : ''}`;
  return `${moved.type.toUpperCase()}:${squareName(action.from)}–${squareName(action.to)}`;
}

export class Game {
  private position: Position;
  private readonly history: HistoryEntry[] = [];
  private readonly repetitions = new Map<string, number>();

  constructor(fen: string = START_FEN) {
    this.position = parseFen(fen);
    this.repetitions.set(positionKey(this.position), 1);
  }

  get turn(): Color { return this.position.turn; }

  fen(): string { return serializeFen(this.position); }

  pieceAt(square: Square): Piece<string, Color> | null {
    const piece = this.position.board[square];
    return piece ? asPiece(piece) : null;
  }

  pieces(): Array<{ square: Square; piece: Piece<string, Color> }> {
    return this.position.board.flatMap((piece, square) => piece ? [{ square, piece: asPiece(piece) }] : []);
  }

  hand(color: Color): readonly string[] { return [...this.position.hands[color]]; }

  legalUci(): string[] {
    return this.status().kind === 'ongoing' ? legalActions(this.position).map((action) => action.uci) : [];
  }

  move(uci: string): VariantMoveRecord<Color> {
    const action = this.status().kind === 'ongoing' ? legalActions(this.position).find((candidate) => candidate.uci === uci) : undefined;
    if (!action) throw new IllegalMoveError(uci);

    const before = this.position;
    const mover = before.turn;
    const board: Board = [...before.board];
    const hands = { w: [...before.hands.w], b: [...before.hands.b] };
    let moved: RithPiece;
    let captured: RithPiece | null = null;
    let captures: RithPiece[] = [];

    if (action.kind === 'move') {
      moved = board[action.from]!;
      board[action.to] = moved;
      board[action.from] = null;
    } else if (action.kind === 'drop') {
      const handIndex = hands[mover].indexOf(action.type);
      if (handIndex < 0) throw new IllegalMoveError(uci);
      hands[mover].splice(handIndex, 1);
      moved = pieceFromType(mover, action.type, this.fen());
      board[action.to] = moved;
    } else {
      moved = board[action.from]!;
      const target = board[action.to]!;
      ({ captured, captures } = captureResult(before, action));
      board[action.to] = updatedTargetAfterCapture(target, action);
      hands[mover].push(captured.type, ...captures.map((piece) => piece.type));
      hands[mover].sort();
    }

    const next: Position = {
      board,
      turn: opposite(mover),
      hands,
      capturePlies: action.kind === 'capture' ? 0 : before.capturePlies + 1,
    };
    this.position = next;
    const key = positionKey(next);
    this.repetitions.set(key, (this.repetitions.get(key) ?? 0) + 1);
    const record: VariantMoveRecord<Color> = {
      uci,
      san: sanFor(action, moved),
      color: mover,
      piece: asPiece(moved),
      captured: captured ? asPiece(captured) : null,
      ...(captures.length > 0 ? { captures: captures.map(asPiece) } : {}),
      action: action.kind,
      to: action.to,
      fenAfter: this.fen(),
    };
    this.history.push({ before, key, record });
    return record;
  }

  undo(): VariantMoveRecord<Color> | null {
    const entry = this.history.pop();
    if (!entry) return null;
    const count = this.repetitions.get(entry.key) ?? 0;
    if (count <= 1) this.repetitions.delete(entry.key);
    else this.repetitions.set(entry.key, count - 1);
    this.position = entry.before;
    return entry.record;
  }

  moves(): VariantMoveRecord<Color>[] { return this.history.map(({ record }) => record); }
  lastMove(): VariantMoveRecord<Color> | null { return this.history.at(-1)?.record ?? null; }

  status(): GameStatus<Color> {
    const progression = greatVictoryWinner(this.position);
    if (progression) return { kind: 'progression', winner: progression };
    if ((this.repetitions.get(positionKey(this.position)) ?? 0) >= 3) return { kind: 'repetition' };
    if (this.position.capturePlies >= 200) return { kind: 'counting' };
    if (legalActions(this.position).length === 0) return { kind: 'stalemate', winner: opposite(this.turn) };
    return { kind: 'ongoing' };
  }

  isGameOver(): boolean { return this.status().kind !== 'ongoing'; }
  inCheck(): false { return false; }
  checkedKingSquare(): null { return null; }
  attackedSquares(color: Color): Square[] { return attackedSquares(this.position, color); }
  counting(): { limitPlies: number; plies: number } { return { limitPlies: 200, plies: this.position.capturePlies }; }
}

export { FenError, IllegalMoveError, pieceAtName };
export type { Board, Position, RithPiece };
