import { Game as ChessGame, IllegalMoveError, type Piece as ChessPiece, type PieceType } from '@chaturanga/chess';
import {
  findKing,
  isAttacked,
  parseSquare,
  squareName,
  type Board,
  type ColorIndex,
  colorBits,
  toColorIndex,
} from '@chaturanga/chess/core';
import type { Color, GameStatus, Square, VariantGame, VariantMoveRecord } from '@chaturanga/rules-core';
import { parseCrazyhouseFen, serializeCrazyhouseFen, START_FEN, withPieceAt, type Pockets } from './fen';

const POCKET_TYPES: readonly Exclude<PieceType, 'k'>[] = ['q', 'r', 'b', 'n', 'p'];
const DROP = /^([PNBRQ])@([a-h][1-8])$/;
const MOVE = /^([a-h][1-8])([a-h][1-8])([qrbn]?)$/;
const CODE_BY_TYPE: Record<PieceType, number> = { p: 1, n: 2, b: 3, r: 4, q: 5, k: 6 };

export type CrazyhousePiece = ChessPiece;
export type CrazyhouseMoveRecord = VariantMoveRecord;

function opposite(color: Color): Color {
  return color === 'w' ? 'b' : 'w';
}

function asPieceCode(piece: ChessPiece): number {
  return CODE_BY_TYPE[piece.type]! | colorBits(toColorIndex(piece.color));
}

function parseClock(boardFen: string): { halfmove: number; fullmove: number } {
  const fields = boardFen.split(' ');
  return { halfmove: Number(fields[4] ?? 0), fullmove: Number(fields[5] ?? 1) };
}

function rookJourney(from: Square, to: Square, color: Color): [Square, Square] | null {
  if (from !== (color === 'w' ? 4 : 60)) return null;
  if (to === from + 2) return [from + 3, from + 1];
  if (to === from - 2) return [from - 4, from - 1];
  return null;
}

/** Orthodox chess rules with Crazyhouse pockets, drops and promotion provenance. */
export class Game implements VariantGame {
  private engine: ChessGame;
  private pockets: Pockets;
  private promoted: Set<Square>;
  private readonly records: CrazyhouseMoveRecord[] = [];
  private readonly undoFens: string[] = [];
  private readonly keys: string[];

  constructor(fen: string = START_FEN) {
    const data = parseCrazyhouseFen(fen);
    this.engine = new ChessGame(data.boardFen);
    this.pockets = data.pockets;
    this.promoted = data.promoted;
    this.keys = [this.positionKey()];
  }

  get turn(): Color {
    return this.engine.turn;
  }

  fen(): string {
    return serializeCrazyhouseFen(this.engine.fen(), this.pockets, this.promoted);
  }

  pieceAt(square: Square): CrazyhousePiece | null {
    const piece = this.engine.pieceAt(square);
    return piece ? { ...piece, promoted: this.promoted.has(square) } : null;
  }

  pieces(): Array<{ square: Square; piece: CrazyhousePiece }> {
    return this.engine.pieces().map(({ square, piece }) => ({
      square,
      piece: { ...piece, promoted: this.promoted.has(square) },
    }));
  }

  hand(color: Color): readonly string[] {
    return POCKET_TYPES.flatMap((type) => Array.from({ length: this.pockets[color][type] }, () => type));
  }

  legalUci(): string[] {
    const moves = this.engine.legalUci();
    const drops: string[] = [];
    const board = this.board();
    const side = toColorIndex(this.turn);
    const king = findKing(board, side);
    if (king < 0) return moves;

    for (const type of POCKET_TYPES) {
      if (this.pockets[this.turn][type] === 0) continue;
      const code = CODE_BY_TYPE[type]! | colorBits(side);
      for (let square = 0; square < 64; square++) {
        if (board[square] !== 0) continue;
        const rank = Math.floor(square / 8);
        if (type === 'p' && (rank === 0 || rank === 7)) continue;
        board[square] = code;
        const legal = !isAttacked(board, king, (side === 0 ? 1 : 0) as ColorIndex);
        board[square] = 0;
        if (legal) drops.push(`${type.toUpperCase()}@${squareName(square)}`);
      }
    }
    return moves.concat(drops);
  }

  inCheck(): boolean {
    return this.engine.inCheck();
  }

  checkedKingSquare(): Square | null {
    return this.engine.checkedKingSquare();
  }

  attackedSquares(color: Color): Square[] {
    return this.engine.attackedSquares(color);
  }

  moves(): CrazyhouseMoveRecord[] {
    return this.records.slice();
  }

  lastMove(): CrazyhouseMoveRecord | null {
    return this.records.at(-1) ?? null;
  }

  move(uci: string): CrazyhouseMoveRecord {
    const legal = this.legalUci();
    if (!legal.includes(uci)) throw new IllegalMoveError(uci);

    const mover = this.turn;
    const drop = DROP.exec(uci);
    const boardMove = MOVE.exec(uci);
    this.undoFens.push(this.fen());

    let piece: CrazyhousePiece;
    let captured: CrazyhousePiece | null = null;
    let to: Square;
    let sanBase: string;

    if (drop) {
      const type = drop[1]!.toLowerCase() as Exclude<PieceType, 'k'>;
      to = parseSquare(drop[2]!);
      piece = { color: mover, type, promoted: false };
      this.pockets[mover][type]--;

      const [placement, , castling] = this.engine.fen().split(' ');
      const { fullmove } = parseClock(this.engine.fen());
      const nextFullmove = mover === 'b' ? fullmove + 1 : fullmove;
      this.engine = new ChessGame(`${withPieceAt(placement!, to, mover === 'w' ? type.toUpperCase() : type)} ${opposite(mover)} ${castling} - 0 ${nextFullmove}`);
      sanBase = `${type.toUpperCase()}@${squareName(to)}`;
    } else if (boardMove) {
      const from = parseSquare(boardMove[1]!);
      to = parseSquare(boardMove[2]!);
      const before = this.pieceAt(from)!;
      piece = before;
      const targetBefore = this.pieceAt(to);
      const epTarget = this.engine.fen().split(' ')[3];
      const capturedSquare = targetBefore
        ? to
        : before.type === 'p' && epTarget === squareName(to)
          ? to + (mover === 'w' ? -8 : 8)
          : to;
      const capturedBefore = targetBefore ?? (capturedSquare !== to ? this.pieceAt(capturedSquare) : null);
      const rawRecord = this.engine.move(uci);
      if (rawRecord.captured && capturedBefore) {
        captured = capturedBefore;
        const pocketType = capturedBefore.promoted ? 'p' : capturedBefore.type;
        if (pocketType !== 'k') this.pockets[mover][pocketType]++;
      }

      this.promoted.delete(from);
      if (captured) this.promoted.delete(capturedSquare);
      const rook = rookJourney(from, to, mover);
      if (rook) {
        if (this.promoted.delete(rook[0])) this.promoted.add(rook[1]);
      }
      const promotion = boardMove[3];
      if (promotion) this.promoted.add(to);
      else if (before.promoted) this.promoted.add(to);
      sanBase = rawRecord.san.replace(/[+#]$/, '');
    } else {
      throw new IllegalMoveError(uci);
    }

    this.keys.push(this.positionKey());
    const check = this.inCheck();
    const replies = this.legalUci();
    const san = sanBase + (check ? (replies.length === 0 ? '#' : '+') : '');
    const record: CrazyhouseMoveRecord = {
      uci,
      san,
      color: mover,
      piece,
      captured,
      to,
      fenAfter: this.fen(),
    };
    this.records.push(record);
    return record;
  }

  undo(): CrazyhouseMoveRecord | null {
    const record = this.records.pop();
    if (!record) return null;
    const previous = this.undoFens.pop()!;
    this.keys.pop();
    const data = parseCrazyhouseFen(previous);
    this.engine = new ChessGame(data.boardFen);
    this.pockets = data.pockets;
    this.promoted = data.promoted;
    return record;
  }

  status(): GameStatus {
    const legal = this.legalUci();
    if (legal.length === 0) {
      return this.inCheck() ? { kind: 'checkmate', winner: opposite(this.turn) } : { kind: 'stalemate' };
    }
    const key = this.keys.at(-1)!;
    if (this.keys.filter((seen) => seen === key).length >= 3) return { kind: 'repetition' };
    const halfmove = Number(this.engine.fen().split(' ')[4]);
    if (halfmove >= 100) return { kind: 'fifty-move' };
    return { kind: 'ongoing' };
  }

  isGameOver(): boolean {
    return this.status().kind !== 'ongoing';
  }

  counting(): null {
    return null;
  }

  private board(): Board {
    const board: Board = new Uint8Array(64);
    for (const { square, piece } of this.engine.pieces()) board[square] = asPieceCode(piece);
    return board;
  }

  private positionKey(): string {
    return this.fen().split(' ').slice(0, 4).join(' ');
  }
}

export { IllegalMoveError };
