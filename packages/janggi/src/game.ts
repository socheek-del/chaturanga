import { type Board, type ColorIndex, IllegalMoveError, squareNameOf, squareOf, toColor } from '@chaturanga/rules-core';
import { BLACK, codeToPiece, fileOf, FILES, rankOf, SAN_LETTER, toColorIndex, TYPE_MASK } from './board';
import { attackedPoints, findGeneral, generalsFace, inCheck } from './attacks';
import { parseFen, serializeFen, START_FEN } from './fen';
import { encodeMove, generateLegalMoves, isPass, makeRaw, moveFrom, moveTo, unmakeRaw } from './movegen';
import { type GameState, immediateGameEnd, isInsufficientMaterial, nextState, optionalGameEnd, points, rootState } from './gameEnd';
import type { Color, GameStatus, Move, MoveRecord, Piece, Square } from './types';

export { IllegalMoveError };

interface HistoryEntry {
  move: number;
  moved: number;
  captured: number;
  rule50: number;
  fullmove: number;
  record: MoveRecord;
}

/** How a pass is written in the move list. Fairy-Stockfish spells it as a general move (`Ke2`). */
export const PASS_SAN = '—';

const UCI = /^([a-i]\d{1,2})([a-i]\d{1,2})$/;

export class Game {
  private readonly board: Board;
  private side: ColorIndex;
  private rule50: number;
  private fullmove: number;
  private readonly history: HistoryEntry[] = [];
  /** Fairy-Stockfish StateInfo chain for bikjang, passes, repetition, perpetual check and the 50-move rule. */
  private readonly states: GameState[];

  constructor(fen: string = START_FEN) {
    const data = parseFen(fen);
    this.board = data.board;
    this.side = data.turn;
    this.rule50 = data.rule50;
    this.fullmove = data.fullmove;
    this.states = [rootState(this.board, this.side, this.rule50)];
  }

  get turn(): Color {
    return toColor(this.side);
  }

  fen(): string {
    return serializeFen({ board: this.board, turn: this.side, rule50: this.rule50, fullmove: this.fullmove });
  }

  pieceAt(square: Square): Piece | null {
    const p = this.board[square];
    return p ? codeToPiece(p) : null;
  }

  pieces(): Array<{ square: Square; piece: Piece }> {
    const out: Array<{ square: Square; piece: Piece }> = [];
    this.board.forEach((p, square) => {
      if (p) out.push({ square, piece: codeToPiece(p) });
    });
    return out;
  }

  /** Janggi has no hands: always empty. */
  hand(_color: Color): string[] {
    return [];
  }

  legalMoves(): Move[] {
    return generateLegalMoves(this.board, this.side).map(toMove);
  }

  legalUci(): string[] {
    return generateLegalMoves(this.board, this.side).map(encodedToUci);
  }

  inCheck(): boolean {
    return inCheck(this.board, this.side);
  }

  checkedKingSquare(): Square | null {
    if (!this.inCheck()) return null;
    const square = findGeneral(this.board, this.side);
    return square >= 0 ? square : null;
  }

  attackedSquares(color: Color): Square[] {
    return attackedPoints(this.board, toColorIndex(color));
  }

  moves(): MoveRecord[] {
    return this.history.map((h) => h.record);
  }

  lastMove(): MoveRecord | null {
    return this.history.at(-1)?.record ?? null;
  }

  /** Accepts a Move or coordinate notation, e.g. `e3e4`; a pass is `e2e2`. */
  move(input: Move | string): MoveRecord {
    const legal = generateLegalMoves(this.board, this.side);
    const encoded = resolve(input, legal);
    if (encoded === undefined) throw new IllegalMoveError(typeof input === 'string' ? input : moveToUci(input));

    const mover = this.side;
    const moved = this.board[moveFrom(encoded)]!;
    const sanBase = this.sanBase(encoded, legal, moved);
    const entry: Omit<HistoryEntry, 'record' | 'captured'> = {
      move: encoded,
      moved,
      rule50: this.rule50,
      fullmove: this.fullmove,
    };

    const captured = makeRaw(this.board, encoded);
    this.rule50 = captured ? 0 : this.rule50 + 1;
    if (mover === 1) this.fullmove++;
    this.side = mover === 0 ? 1 : 0;
    this.states.push(
      nextState(this.states.at(-1)!, this.board, isPass(encoded), this.rule50),
    );

    const replies = generateLegalMoves(this.board, this.side);
    const check = inCheck(this.board, this.side);
    const move = toMove(encoded);
    const record: MoveRecord = {
      ...move,
      uci: moveToUci(move),
      san: sanBase + (check ? (replies.length === 0 ? '#' : '+') : ''),
      piece: codeToPiece(moved),
      captured: captured ? codeToPiece(captured) : null,
      color: toColor(mover),
      fenAfter: this.fen(),
    };
    this.history.push({ ...entry, captured, record });
    return record;
  }

  undo(): MoveRecord | null {
    const entry = this.history.pop();
    if (!entry) return null;
    const mover: ColorIndex = entry.moved & BLACK ? 1 : 0;
    unmakeRaw(this.board, entry.move, entry.moved, entry.captured);
    this.states.pop();
    this.side = mover;
    this.rule50 = entry.rule50;
    this.fullmove = entry.fullmove;
    return entry.record;
  }

  /** True while the generals face each other (bikjang). */
  isBikjang(): boolean {
    return generalsFace(this.board);
  }

  /** The legal pass in coordinate notation (`e2e2`), or null when the side to move may not pass. */
  passMove(): string | null {
    const pass = generateLegalMoves(this.board, this.side).find(isPass);
    return pass === undefined ? null : encodedToUci(pass);
  }

  /** The points each side has on the board, with Han's 1.5 for moving second. */
  points(): Record<Color, number> {
    return points(this.board);
  }

  /** Game end in the order ffish's `result(true)` checks it. See RULES.md. */
  status(): GameStatus {
    const immediate = immediateGameEnd(this.states, this.board);
    if (immediate) return immediate;
    if (isInsufficientMaterial(this.board)) return { kind: 'insufficient-material' };
    if (generateLegalMoves(this.board, this.side).length === 0) {
      return { kind: 'checkmate', winner: toColor(this.side === 0 ? 1 : 0) };
    }
    return optionalGameEnd(this.states, this.board) ?? { kind: 'ongoing' };
  }

  isGameOver(): boolean {
    return this.status().kind !== 'ongoing';
  }

  /** Janggi has no counting rule; always null. */
  counting(): null {
    return null;
  }

  private sanBase(m: number, legal: number[], moved: number): string {
    if (isPass(m)) return PASS_SAN;
    const to = moveTo(m);
    const from = moveFrom(m);
    const target = squareNameOf(to, FILES);
    const type = moved & TYPE_MASK;
    const capture = this.board[to] !== 0;

    const rivals = legal.filter((o) => o !== m && moveTo(o) === to && this.board[moveFrom(o)] === moved);
    let disambiguation = '';
    if (rivals.length) {
      const sameFile = rivals.some((o) => fileOf(moveFrom(o)) === fileOf(from));
      const sameRank = rivals.some((o) => rankOf(moveFrom(o)) === rankOf(from));
      if (!sameFile) disambiguation = squareNameOf(from, FILES)[0]!;
      else if (!sameRank) disambiguation = String(rankOf(from) + 1);
      else disambiguation = squareNameOf(from, FILES);
    }
    return `${SAN_LETTER[type]}${disambiguation}${capture ? 'x' : ''}${target}`;
  }
}

function resolve(input: Move | string, legal: number[]): number | undefined {
  let target: number;
  if (typeof input === 'string') {
    const m = UCI.exec(input);
    if (!m) return undefined;
    const from = squareOf(m[1]!, FILES);
    const to = squareOf(m[2]!, FILES);
    if (from === null || to === null) return undefined;
    target = encodeMove(from, to);
  } else {
    target = encodeMove(input.from, input.to);
  }
  return legal.includes(target) ? target : undefined;
}

function toMove(m: number): Move {
  return { from: moveFrom(m), to: moveTo(m) };
}

export function encodedToUci(m: number): string {
  return moveToUci(toMove(m));
}

export function moveToUci(m: Move): string {
  return squareNameOf(m.from, FILES) + squareNameOf(m.to, FILES);
}
