import type { SearchAdapter } from '@chaturanga/ai-core';
import {
  BLACK,
  BISHOP,
  type ColorIndex,
  colorBits,
  type Board,
  castlingOf,
  encodedToUci,
  findKing,
  generateLegalMoves,
  inCheck,
  isAttacked,
  isEnPassant,
  makeRaw,
  moveFrom,
  movePromotion,
  moveTo,
  normalizeEp,
  parseFen,
  type Position,
  QUEEN,
  ROOK,
  squareName,
  TYPE_MASK,
  unmakeRaw,
  PAWN,
  KNIGHT,
  KING,
} from '@chaturanga/chess/core';
import { parseCrazyhouseFen, type Pockets } from '@chaturanga/crazyhouse';
import { evaluate, materialBalance, PIECE_VALUE } from './evaluate';

const DROP_BASE = 1 << 20;
const DROP_TYPES = ['p', 'n', 'b', 'r', 'q'] as const;
const DROP_CODE: Record<(typeof DROP_TYPES)[number], number> = { p: PAWN, n: KNIGHT, b: BISHOP, r: ROOK, q: QUEEN };
const HAND_VALUE = [0, 125, 365, 375, 560, 980] as const;

interface UndoEntry {
  move: number;
  drop: boolean;
  undo?: number;
  square: number;
  capturedType?: (typeof DROP_TYPES)[number];
  previousTurn: ColorIndex;
  previousEp: number;
  previousHalfmove: number;
  previousFullmove: number;
  previousPromoted: Set<number>;
}

function encodeDrop(type: (typeof DROP_TYPES)[number], square: number): number {
  return DROP_BASE + DROP_TYPES.indexOf(type) * 64 + square;
}

function decodeDrop(move: number): { type: (typeof DROP_TYPES)[number]; square: number } {
  const index = Math.floor((move - DROP_BASE) / 64);
  return { type: DROP_TYPES[index]!, square: (move - DROP_BASE) & 63 };
}

function isDrop(move: number): boolean {
  return move >= DROP_BASE;
}

function moveToUci(move: number): string {
  if (isDrop(move)) {
    const { type, square } = decodeDrop(move);
    return `${type.toUpperCase()}@${squareName(square)}`;
  }
  return encodedToUci(move);
}

function pocketFen(pockets: Pockets): string {
  let out = '';
  for (const color of ['w', 'b'] as const) {
    for (const type of ['q', 'r', 'b', 'n', 'p'] as const) {
      out += (color === 'w' ? type.toUpperCase() : type).repeat(pockets[color][type]);
    }
  }
  return out;
}

function placementWithPromoted(board: Board, promoted: ReadonlySet<number>): string {
  const rows: string[] = [];
  for (let rank = 7; rank >= 0; rank--) {
    let row = '';
    let empty = 0;
    for (let file = 0; file < 8; file++) {
      const square = rank * 8 + file;
      const code = board[square]!;
      if (!code) {
        empty++;
        continue;
      }
      if (empty) row += String(empty);
      empty = 0;
      const type = ['?', 'p', 'n', 'b', 'r', 'q', 'k'][code & TYPE_MASK]!;
      const letter = code & BLACK ? type : type.toUpperCase();
      row += letter + (promoted.has(square) ? '~' : '');
    }
    if (empty) row += String(empty);
    rows.push(row);
  }
  return rows.join('/');
}

function rookJourney(from: number, to: number, side: ColorIndex): [number, number] | null {
  if (from !== (side === 0 ? 4 : 60)) return null;
  if (to === from + 2) return [from + 3, from + 1];
  if (to === from - 2) return [from - 4, from - 1];
  return null;
}

/** Allocation-light search adapter that makes board moves in place and keeps pocket pieces off board. */
export class CrazyhouseSearch implements SearchAdapter {
  private readonly pos: Position;
  private readonly pockets: Pockets;
  private promoted: Set<number>;
  private halfmove: number;
  private fullmove: number;
  private readonly stack: UndoEntry[] = [];

  constructor(fen: string) {
    const parsed = parseCrazyhouseFen(fen);
    const board = parseFen(parsed.boardFen);
    this.pos = { board: board.board, turn: board.turn, castling: board.castling, ep: board.ep };
    normalizeEp(this.pos);
    this.pockets = parsed.pockets;
    this.promoted = parsed.promoted;
    this.halfmove = board.rule50;
    this.fullmove = board.fullmove;
  }

  turn(): ColorIndex {
    return this.pos.turn;
  }

  legalMoves(): number[] {
    const moves = generateLegalMoves(this.pos);
    const side = this.pos.turn;
    const king = findKing(this.pos.board, side);
    if (king < 0) return moves;
    for (const type of DROP_TYPES) {
      if (this.pockets[side === 0 ? 'w' : 'b'][type] === 0) continue;
      const piece = DROP_CODE[type]! | colorBits(side);
      for (let square = 0; square < 64; square++) {
        if (this.pos.board[square]) continue;
        const rank = square >> 3;
        if (type === 'p' && (rank === 0 || rank === 7)) continue;
        this.pos.board[square] = piece;
        const legal = !isAttacked(this.pos.board, king, side === 0 ? 1 : 0);
        this.pos.board[square] = 0;
        if (legal) moves.push(encodeDrop(type, square));
      }
    }
    return moves;
  }

  make(move: number): void {
    const previousTurn = this.pos.turn;
    const entry: UndoEntry = {
      move,
      drop: isDrop(move),
      square: 0,
      previousTurn,
      previousEp: this.pos.ep,
      previousHalfmove: this.halfmove,
      previousFullmove: this.fullmove,
      previousPromoted: new Set(this.promoted),
    };
    if (entry.drop) {
      const { type, square } = decodeDrop(move);
      entry.square = square;
      this.pockets[previousTurn === 0 ? 'w' : 'b'][type]--;
      this.pos.board[square] = DROP_CODE[type]! | colorBits(previousTurn);
      this.pos.turn = previousTurn === 0 ? 1 : 0;
      this.pos.ep = -1;
      this.halfmove = 0;
      if (previousTurn === 1) this.fullmove++;
    } else {
      const from = moveFrom(move);
      const to = moveTo(move);
      const moved = this.pos.board[from]!;
      const movedType = moved & TYPE_MASK;
      const captureSquare = isEnPassant(this.pos, move) ? to + (previousTurn === 0 ? -8 : 8) : to;
      const captured = this.pos.board[captureSquare]!;
      if (captured) {
        const capturedType = this.promoted.has(captureSquare) ? 'p' : this.typeFromCode(captured);
        if (capturedType !== 'k') {
          this.pockets[previousTurn === 0 ? 'w' : 'b'][capturedType]++;
          entry.capturedType = capturedType;
        }
      }
      const movedPromoted = this.promoted.has(from);
      const undo = makeRaw(this.pos, move);
      entry.undo = undo;
      entry.square = captureSquare;
      this.promoted.delete(from);
      this.promoted.delete(captureSquare);
      const rook = rookJourney(from, to, previousTurn);
      if (rook && this.promoted.delete(rook[0])) this.promoted.add(rook[1]);
      if (movePromotion(move) || movedPromoted) this.promoted.add(to);
      this.halfmove = captured || movedType === PAWN ? 0 : this.halfmove + 1;
      if (previousTurn === 1) this.fullmove++;
    }
    this.stack.push(entry);
  }

  unmake(): void {
    const entry = this.stack.pop()!;
    if (entry.drop) {
      const { type } = decodeDrop(entry.move);
      this.pockets[entry.previousTurn === 0 ? 'w' : 'b'][type]++;
      this.pos.board[entry.square] = 0;
      this.pos.turn = entry.previousTurn;
      this.pos.ep = entry.previousEp;
    } else {
      unmakeRaw(this.pos, entry.move, entry.undo!);
      if (entry.capturedType) this.pockets[entry.previousTurn === 0 ? 'w' : 'b'][entry.capturedType]--;
    }
    this.halfmove = entry.previousHalfmove;
    this.fullmove = entry.previousFullmove;
    this.promoted = entry.previousPromoted;
  }

  inCheck(): boolean {
    return inCheck(this.pos.board, this.pos.turn);
  }

  evaluate(): number {
    return evaluate(this.pos, this.pockets, this.pos.turn);
  }

  isTactical(move: number): boolean {
    if (isDrop(move)) return this.dropGivesCheck(move);
    const to = moveTo(move);
    return Boolean(this.pos.board[to] || isEnPassant(this.pos, move) || movePromotion(move));
  }

  orderKey(move: number): number {
    if (isDrop(move)) {
      const { type } = decodeDrop(move);
      return (this.dropGivesCheck(move) ? 100_000 : 0) + HAND_VALUE[DROP_CODE[type]!]!;
    }
    const from = moveFrom(move);
    const to = moveTo(move);
    const promotion = movePromotion(move);
    const captureSquare = isEnPassant(this.pos, move) ? to + (this.pos.turn === 0 ? -8 : 8) : to;
    const victim = this.pos.board[captureSquare]!;
    let score = promotion ? 100 * PIECE_VALUE[promotion]! : 0;
    if (victim) {
      const type = this.promoted.has(captureSquare) ? PAWN : victim & TYPE_MASK;
      score += 10 * (PIECE_VALUE[victim & TYPE_MASK]! + HAND_VALUE[type]!) - PIECE_VALUE[this.pos.board[from]! & TYPE_MASK]!;
    }
    return score;
  }

  key(): string {
    const boardFen = placementWithPromoted(this.pos.board, this.promoted);
    const placement = `${boardFen}[${pocketFen(this.pockets)}]`;
    const ep = this.pos.ep < 0 ? '-' : squareName(this.pos.ep);
    return `${placement} ${this.pos.turn === 0 ? 'w' : 'b'} ${castlingOf(this.pos.castling)} ${ep}`;
  }

  terminalScore(): number | undefined {
    return this.halfmove >= 100 ? 0 : undefined;
  }

  toUci(move: number): string {
    return moveToUci(move);
  }

  materialFor(color: ColorIndex): number {
    return materialBalance(this.pos, this.pockets, color);
  }

  private dropGivesCheck(move: number): boolean {
    const { type, square } = decodeDrop(move);
    const enemy: ColorIndex = this.pos.turn === 0 ? 1 : 0;
    const king = findKing(this.pos.board, enemy);
    if (king < 0) return false;
    this.pos.board[square] = DROP_CODE[type]! | colorBits(this.pos.turn);
    const check = isAttacked(this.pos.board, king, this.pos.turn);
    this.pos.board[square] = 0;
    return check;
  }

  private typeFromCode(code: number): (typeof DROP_TYPES)[number] | 'k' {
    switch (code & TYPE_MASK) {
      case PAWN:
        return 'p';
      case KNIGHT:
        return 'n';
      case BISHOP:
        return 'b';
      case ROOK:
        return 'r';
      case QUEEN:
        return 'q';
      case KING:
        return 'k';
      default:
        throw new Error(`Unknown chess piece code ${code}`);
    }
  }
}

export function positionKey(fen: string): string {
  return new CrazyhouseSearch(fen).key();
}

export const fenKey = positionKey;
