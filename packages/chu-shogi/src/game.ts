import {
  IllegalMoveError,
  type Color,
  type GameStatus,
  type Square,
  type VariantMoveRecord,
} from '@chaturanga/rules-core';
import { FILES, RANKS } from './layout';
import { applyMove, attackedSquares, generateMoves, royalSquares, squareAttackedBy, type Move } from './movement';
import { fenOf, keyOf, opposite, parseFen, PIECE_TYPES, squareName, START_FEN, type Position } from './position';

interface HistoryEntry {
  readonly position: Position;
  readonly record: VariantMoveRecord;
  readonly effect: MoveEffect;
}

interface MoveEffect {
  readonly color: Color;
  readonly uci: string;
  readonly givesRoyalAttack: boolean;
  readonly attacksPiece: boolean;
  readonly jitto: boolean;
}

function routeSan(move: Move): string {
  const captures = new Set(move.captures.map(({ atPathIndex }) => atPathIndex));
  let san = squareName(move.from);
  for (const [index, square] of move.path.entries()) san += `${captures.has(index) ? '×' : '–'}${squareName(square)}`;
  if (move.promote) san += '+';
  return san;
}

function winnerForRoyalCapture(position: Position): Color | null {
  const whiteRoyals = royalSquares(position.board, 'w');
  const blackRoyals = royalSquares(position.board, 'b');
  if (whiteRoyals.length === 0 && blackRoyals.length === 0) return null;
  if (whiteRoyals.length === 0) return 'b';
  if (blackRoyals.length === 0) return 'w';
  return null;
}

function barrenWinner(position: Position): Color | null {
  const pieces = position.board.flatMap((piece, square) => piece ? [{ piece, square }] : []);
  const material = pieces.filter(({ piece, square }) => {
    const rank = Math.floor(square / FILES) + 1;
    const deadPawnOrLance = !piece.promoted && (piece.type === 'pawn' || piece.type === 'lance') &&
      (piece.color === 'w' ? rank === RANKS : rank === 1);
    return !deadPawnOrLance;
  });
  if (material.length !== 3) return null;
  const kings = material.filter(({ piece }) => piece.type === 'king' && !piece.promoted);
  const other = material.filter(({ piece }) => !(piece.type === 'king' && !piece.promoted));
  if (kings.length !== 2 || other.length !== 1) return null;
  const piece = other[0]!.piece;
  if (!piece.promoted && (piece.type === 'pawn' || piece.type === 'go-between')) return null;
  return piece.color;
}

function capturesEveryRoyal(move: Move, board: Position['board'], color: Color): boolean {
  const royals = royalSquares(board, color);
  return royals.length > 0 && royals.every((square) => move.captures.some((capture) => capture.square === square));
}

function canCaptureEveryRoyal(position: Position, attacker: Color): boolean {
  const target = opposite(attacker);
  const royals = royalSquares(position.board, target);
  if (!royals.length) return true;
  return generateMoves(position, attacker).some((move) => capturesEveryRoyal(move, position.board, target));
}

function forcedRoyalMate(position: Position, replies: readonly Move[]): boolean {
  const defender = position.turn;
  const attacker = opposite(defender);
  const royals = royalSquares(position.board, defender);
  if (!royals.length || !royals.some((square) => squareAttackedBy(position.board, square, attacker))) return false;

  if (!replies.length) return canCaptureEveryRoyal(position, attacker);
  for (const reply of replies) {
    const after = applyMove(position, reply);
    if (winnerForRoyalCapture(after) === defender || barrenWinner(after) === defender) return false;
    if (!canCaptureEveryRoyal(after, attacker)) return false;
  }
  return true;
}

function repetitionResponsible(keys: readonly string[], effects: readonly MoveEffect[]): Color | null {
  const current = keys.at(-1)!;
  const occurrences = keys.flatMap((key, index) => key === current ? [index] : []);
  if (occurrences.length < 4) return null;

  const [start, , , end] = occurrences.slice(-4);
  const cycle = effects.slice(start, end);
  const checkingSides = (['w', 'b'] as const).filter((color) => {
    const turns = cycle.filter((effect) => effect.color === color);
    return turns.length > 0 && turns.every((effect) => effect.givesRoyalAttack);
  });
  if (checkingSides.length === 1) return checkingSides[0]!;

  const attackingSides = (['w', 'b'] as const).filter((color) => cycle.some((effect) =>
    effect.color === color && effect.attacksPiece));
  if (attackingSides.length === 1) return attackingSides[0]!;

  if (cycle.length > 0 && cycle.every((effect) => effect.jitto)) {
    return cycle.find((effect) => effect.jitto)!.color;
  }

  // Digital convention for quiet or mixed repetitions: the side to move at
  // the repeated position bears the duty to vary.
  return effects.at(-1)?.color === 'w' ? 'b' : 'w';
}

function effectAfter(position: Position, move: Move): MoveEffect {
  const after = applyMove(position, move);
  const opponent = opposite(move.color);
  const enemyRoyals = new Set(royalSquares(after.board, opponent));
  const attacks = generateMoves(after, move.color);
  return {
    color: move.color,
    uci: move.uci,
    givesRoyalAttack: attacks.some((candidate) => candidate.captures.some((capture) => enemyRoyals.has(capture.square))),
    attacksPiece: attacks.some((candidate) => candidate.captures.some((capture) => capture.piece.color === opponent)),
    jitto: move.path.length === 2 && move.path[0] !== move.from && move.path[1] === move.from &&
      move.captures.length === 0 && !move.promote,
  };
}

export class Game {
  private position: Position;
  private readonly history: HistoryEntry[] = [];
  private readonly keys: string[];
  private readonly candidates = new WeakMap<Position, Move[]>();

  constructor(fen: string = START_FEN) {
    this.position = parseFen(fen);
    this.keys = [keyOf(this.position)];
  }

  get turn(): Color { return this.position.turn; }
  fen(): string { return fenOf(this.position); }
  pieceAt(target: Square) {
    const piece = this.position.board[target];
    return piece ? { ...piece } : null;
  }
  pieces() {
    return this.position.board.flatMap((piece, square) => piece ? [{ square, piece: { ...piece } }] : []);
  }
  hand(): readonly string[] { return []; }
  counting(): null { return null; }
  moves(): VariantMoveRecord[] { return this.history.map(({ record }) => record); }
  lastMove(): VariantMoveRecord | null { return this.history.at(-1)?.record ?? null; }
  inCheck(): boolean { return this.checkedKingSquare() !== null; }
  checkedKingSquare(): Square | null {
    return royalSquares(this.position.board, this.turn).find((target) => squareAttackedBy(this.position.board, target, opposite(this.turn))) ?? null;
  }
  attackedSquares(color: Color): Square[] {
    return [...new Set(attackedSquares(this.position.board, color))].sort((a, b) => a - b);
  }
  isGameOver(): boolean { return this.status().kind !== 'ongoing'; }

  status(): GameStatus {
    const captureWinner = winnerForRoyalCapture(this.position);
    if (captureWinner) return { kind: 'checkmate', winner: captureWinner };

    const barren = barrenWinner(this.position);
    if (barren) return { kind: 'bare-king', winner: barren };

    const responsible = repetitionResponsible(this.keys, this.history.map(({ effect }) => effect));
    if (responsible) return { kind: 'repetition', winner: opposite(responsible) };

    const moves = this.availableMoves();
    if (forcedRoyalMate(this.position, moves)) return { kind: 'checkmate', winner: opposite(this.turn) };
    if (moves.length === 0) return { kind: 'stalemate', winner: opposite(this.turn) };

    return { kind: 'ongoing' };
  }

  legalUci(): string[] {
    if (this.status().kind !== 'ongoing') return [];
    return this.availableMoves().map((move) => move.uci);
  }

  move(uci: string): VariantMoveRecord {
    if (this.status().kind !== 'ongoing') throw new IllegalMoveError(uci);
    const move = this.availableMoves().find((candidate) => candidate.uci === uci);
    if (!move) throw new IllegalMoveError(uci);

    const before = this.position;
    this.position = applyMove(before, move);
    const key = keyOf(this.position);
    this.keys.push(key);

    const mover = before.board[move.from]!;
    const captures = move.captures.map(({ piece }) => ({ ...piece }));
    const record: VariantMoveRecord = {
      color: move.color,
      piece: { color: mover.color, type: mover.type, promoted: mover.promoted },
      captured: captures[0] ?? null,
      captures,
      movedPieceRemoved: false,
      to: move.to,
      uci: move.uci,
      fenAfter: this.fen(),
      san: routeSan(move),
    };
    this.history.push({ position: before, record, effect: effectAfter(before, move) });
    return record;
  }

  undo(): VariantMoveRecord | null {
    const entry = this.history.pop();
    if (!entry) return null;
    this.position = entry.position;
    this.keys.pop();
    return entry.record;
  }

  private availableMoves(): Move[] {
    const cached = this.candidates.get(this.position);
    if (cached) return cached;
    const moves = generateMoves(this.position);
    this.candidates.set(this.position, moves);
    return moves;
  }
}

export const chuShogi = {
  id: 'chu-shogi',
  files: FILES,
  ranks: RANKS,
  startFen: START_FEN,
  pieceTypes: PIECE_TYPES,
  hasHands: false,
  createGame: (fen?: string) => new Game(fen),
} as const;

export const chuShogiVariant = chuShogi satisfies import('@chaturanga/rules-core').Variant<Game>;
