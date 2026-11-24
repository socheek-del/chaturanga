import { FenError, IllegalMoveError, type GameStatus, type Variant, type VariantGame, type VariantMoveRecord } from '@chaturanga/rules-core';
import type { GameStatusName, Move, PieceType, Player, SeatStatus, ThreePiece } from './types';

import { DIAGONALS, EDGES, KNIGHTS, RADIUS, SIZE, hexAt, hexOf, seatHex, step, type Hex } from './hex';

const FILES = SIZE;
const RANKS = SIZE;
const PLAYERS: readonly Player[] = ['w', 'b', 'r'];
const PROMOTIONS = ['q', 'r', 'b', 'n'] as const;
const START_ORDER: readonly PieceType[] = ['r', 'n', 'b', 'q', 'k', 'r'];
const KING_STEPS = [...EDGES, ...DIAGONALS];
const FORWARD: Hex = [0, -1];
const PAWN_CAPTURES: readonly Hex[] = [[1, -1], [-1, 0]];
const LETTERS: Record<PieceType, string> = { p: '', n: 'N', b: 'B', r: 'R', q: 'Q', k: 'K' };

interface Snapshot {
  board: Array<ThreePiece | null>;
  turn: Player;
  eliminated: Set<Player>;
  result: 'win' | 'draw' | null;
  winner: Player | null;
  history: VariantMoveRecord<Player>[];
}

const rowOf = (square: number): number => Math.floor(square / FILES);
const fileOf = (square: number): number => square % FILES;
const squareAt = (file: number, rank: number): number => rank * FILES + file;
const isCell = (square: number): boolean => hexAt(...hexOf(square)) !== null;
const promotes = (square: number, player: Player): boolean => step(square, seatHex(FORWARD, player)) === null;
const nextPlayer = (player: Player): Player => PLAYERS[(PLAYERS.indexOf(player) + 1) % PLAYERS.length]!;
const clonePiece = (piece: ThreePiece | null): ThreePiece | null => (piece ? { ...piece } : null);

export function squareName(square: number): string {
  if (square < 0 || square >= FILES * RANKS || !isCell(square)) throw new RangeError(`Invalid square: ${square}`);
  return `${String.fromCharCode(97 + fileOf(square))}${rowOf(square) + 1}`;
}

export function parseSquare(name: string): number | null {
  const match = /^([a-k])(1[01]|[1-9])$/.exec(name);
  if (!match) return null;
  const square = (Number(match[2]) - 1) * FILES + match[1]!.charCodeAt(0) - 97;
  return isCell(square) ? square : null;
}

function encodeMove(move: Move): string {
  return `${squareName(move.from)}${squareName(move.to)}${move.promotion ?? ''}`;
}

function parseMove(uci: string): Move | null {
  const match = /^([a-k](?:1[01]|[1-9]))([a-k](?:1[01]|[1-9]))([qrbn])?$/.exec(uci);
  if (!match) return null;
  const from = parseSquare(match[1]!);
  const to = parseSquare(match[2]!);
  if (from === null || to === null) return null;
  return { from, to, ...(match[3] ? { promotion: match[3] as Move['promotion'] } : {}) };
}

function startPosition(): Array<ThreePiece | null> {
  const board: Array<ThreePiece | null> = Array(FILES * RANKS).fill(null);
  for (const player of PLAYERS) {
    for (const [index, type] of START_ORDER.entries()) {
      const q = index - RADIUS;
      board[hexAt(...seatHex([q, RADIUS], player))!] = { color: player, type, promoted: false, moved: false };
      board[hexAt(...seatHex([q, RADIUS - 1], player))!] = { color: player, type: 'p', promoted: false, moved: false };
    }
  }
  return board;
}

function serializeBoard(board: readonly (ThreePiece | null)[]): string {
  return Array.from({ length: RANKS }, (_, rank) =>
    Array.from({ length: FILES }, (_, file) => {
      const square = squareAt(file, rank);
      if (!isCell(square)) return '.';
      const piece = board[square];
      return piece ? `${piece.color}${piece.type}${piece.moved ? '!' : ''}` : '-';
    }).join(','),
  ).join('/');
}

function readFen(fen: string): {
  board: Array<ThreePiece | null>;
  turn: Player;
  eliminated: Set<Player>;
  result: 'win' | 'draw' | null;
  winner: Player | null;
} {
  const fail = (message: string): never => {
    throw new FenError(message, fen);
  };
  const fields = fen.trim().split(/\s+/);
  if (fields.length !== 5) fail('Three-player FEN must have five fields');
  const rows = fields[0]!.split('/');
  if (rows.length !== RANKS) fail(`Expected ${RANKS} ranks`);
  const board: Array<ThreePiece | null> = Array(FILES * RANKS).fill(null);
  for (let rank = 0; rank < RANKS; rank++) {
    const cells = rows[rank]!.split(',');
    if (cells.length !== FILES) fail(`Rank ${rank + 1} must have ${FILES} cells`);
    for (let file = 0; file < FILES; file++) {
      const token = cells[file]!;
      if (!isCell(squareAt(file, rank))) {
        if (token !== '.') fail('Expected a gap outside the hexagon');
        continue;
      }
      if (token === '-') continue;
      const match = /^([wbr])([pnbrqk])(!?)$/.exec(token);
      if (!match) throw new FenError(`Invalid piece token: ${token}`, fen);
      board[squareAt(file, rank)] = {
        color: match[1] as Player,
        type: match[2] as PieceType,
        promoted: false,
        moved: match[3] === '!',
      };
    }
  }
  const turn = fields[1] as Player;
  if (!PLAYERS.includes(turn)) fail(`Invalid turn: ${fields[1]}`);
  if (fields[2] !== '-') fail('Reserved field must be empty');
  const eliminated = new Set<Player>();
  if (fields[3] !== '-') {
    for (const seat of fields[3]!) {
      if (!PLAYERS.includes(seat as Player) || eliminated.has(seat as Player)) fail(`Invalid eliminated seats: ${fields[3]}`);
      eliminated.add(seat as Player);
    }
  }
  let result: 'win' | 'draw' | null = null;
  let winner: Player | null = null;
  if (fields[4] === 'draw') result = 'draw';
  else if (/^win[wbr]$/.test(fields[4]!)) {
    result = 'win';
    winner = fields[4]!.slice(-1) as Player;
    if (eliminated.has(winner)) fail('The winner cannot also be eliminated');
  } else if (fields[4] !== '-') fail(`Invalid result: ${fields[4]}`);
  return { board, turn, eliminated, result, winner };
}

export class Game implements VariantGame<Player> {
  private board: Array<ThreePiece | null>;
  private turnValue: Player;
  private eliminated = new Set<Player>();
  private result: 'win' | 'draw' | null = null;
  private winner: Player | null = null;
  private history: VariantMoveRecord<Player>[] = [];
  private undoStack: Snapshot[] = [];

  constructor(fen?: string) {
    if (fen === undefined) {
      this.board = startPosition();
      this.turnValue = 'w';
      return;
    }
    const parsed = readFen(fen);
    this.board = parsed.board;
    this.turnValue = parsed.turn;
    this.eliminated = parsed.eliminated;
    this.result = parsed.result;
    this.winner = parsed.winner;
  }

  get turn(): Player {
    return this.turnValue;
  }

  fen(): string {
    const eliminated = PLAYERS.filter((player) => this.eliminated.has(player)).join('') || '-';
    const outcome = this.result === 'draw' ? 'draw' : this.result === 'win' ? `win${this.winner}` : '-';
    return `${serializeBoard(this.board)} ${this.turnValue} - ${eliminated} ${outcome}`;
  }

  pieceAt(square: number): ThreePiece | null {
    return clonePiece(this.board[square] ?? null);
  }

  pieces(): Array<{ square: number; piece: ThreePiece }> {
    return this.board.flatMap((piece, square) => piece ? [{ square, piece: { ...piece } }] : []);
  }

  hand(_player: Player): readonly string[] {
    return [];
  }

  legalUci(): string[] {
    return this.legalMovesFor(this.turnValue).map(encodeMove);
  }

  move(uci: string): VariantMoveRecord<Player> {
    if (this.isGameOver()) throw new IllegalMoveError(`The game is over: ${uci}`);
    const requested = parseMove(uci);
    const move = requested && this.legalMovesFor(this.turnValue).find((candidate) =>
      candidate.from === requested.from && candidate.to === requested.to &&
      (requested.promotion ? candidate.promotion === requested.promotion : !candidate.promotion || candidate.promotion === 'q'),
    );
    if (!move) throw new IllegalMoveError(`Illegal move: ${uci}`);
    this.undoStack.push(this.snapshot());
    const player = this.turnValue;
    const movingPiece = this.board[move.from]!;
    const captured = this.board[move.to];
    this.applyBoardMove(move);
    this.turnValue = nextPlayer(player);
    this.advanceToPlayableSeat();
    const outcome = this.result === 'win' ? '#' : this.result === 'draw' ? '=' : this.inCheckColor(this.turnValue) ? '+' : '';
    const from = squareName(move.from);
    const to = squareName(move.to);
    const san = `${LETTERS[movingPiece.type]}${from}${captured ? 'x' : ''}${to}${move.promotion ? `=${move.promotion.toUpperCase()}` : ''}${outcome}`;
    const record: VariantMoveRecord<Player> = {
      uci: encodeMove(move),
      san,
      color: player,
      piece: { color: movingPiece.color, type: movingPiece.type, promoted: false },
      captured: captured ? { color: captured.color, type: captured.type, promoted: captured.promoted } : null,
      to: move.to,
      fenAfter: this.fen(),
    };
    this.history.push(record);
    return record;
  }

  undo(): VariantMoveRecord<Player> | null {
    const snapshot = this.undoStack.pop();
    if (!snapshot) return null;
    const removed = this.history.pop() ?? null;
    this.restore(snapshot);
    return removed;
  }

  moves(): VariantMoveRecord<Player>[] {
    return [...this.history];
  }

  lastMove(): VariantMoveRecord<Player> | null {
    return this.history.at(-1) ?? null;
  }

  status(): GameStatus<Player> {
    if (this.result === 'draw') return { kind: 'stalemate' };
    if (this.result === 'win' && this.winner) return { kind: 'checkmate', winner: this.winner };
    return { kind: 'ongoing' };
  }

  isGameOver(): boolean {
    return this.result !== null;
  }

  inCheck(): boolean {
    return this.inCheckColor(this.turnValue);
  }

  checkedKingSquare(): number | null {
    return this.inCheck() ? this.kingSquare(this.turnValue) : null;
  }

  attackedSquares(player: Player): number[] {
    const squares = new Set<number>();
    for (let from = 0; from < this.board.length; from++) {
      const piece = this.board[from];
      if (!piece || piece.color !== player || this.eliminated.has(player)) continue;
      for (const target of this.attacksFrom(from, piece)) squares.add(target);
    }
    return [...squares].sort((a, b) => a - b);
  }

  counting(): null {
    return null;
  }

  activePlayers(): Player[] {
    return PLAYERS.filter((player) => !this.eliminated.has(player));
  }

  isEliminated(player: Player): boolean {
    return this.eliminated.has(player);
  }

  playerStatus(player: Player): SeatStatus {
    if (this.winner === player) return 'winner';
    if (this.eliminated.has(player)) return 'eliminated';
    const check = this.inCheckColor(player);
    const moves = this.legalMovesFor(player);
    if (!moves.length) return check ? 'checkmate' : 'stalemate';
    return check ? 'check' : 'playing';
  }

  gameStatusName(): GameStatusName {
    if (this.result === 'win') return 'win';
    if (this.result === 'draw') return 'draw';
    return this.inCheckColor(this.turnValue) ? 'check' : 'playing';
  }

  winnerPlayer(): Player | null {
    return this.winner;
  }

  private snapshot(): Snapshot {
    return {
      board: this.board.map(clonePiece),
      turn: this.turnValue,
      eliminated: new Set(this.eliminated),
      result: this.result,
      winner: this.winner,
      history: [...this.history],
    };
  }

  private restore(snapshot: Snapshot): void {
    this.board = snapshot.board.map(clonePiece);
    this.turnValue = snapshot.turn;
    this.eliminated = new Set(snapshot.eliminated);
    this.result = snapshot.result;
    this.winner = snapshot.winner;
    this.history = [...snapshot.history];
  }

  private applyBoardMove(move: Move): void {
    const piece = this.board[move.from];
    if (!piece) return;
    this.board[move.from] = null;
    const placed: ThreePiece = { ...piece, moved: true };
    if (move.promotion) {
      placed.type = move.promotion ?? 'q';
      placed.promoted = true;
    }
    this.board[move.to] = placed;
  }

  private advanceToPlayableSeat(): void {
    let candidate = this.turnValue;
    let checked = 0;
    while (checked < PLAYERS.length && !this.result) {
      if (this.eliminated.has(candidate)) {
        candidate = nextPlayer(candidate);
        checked++;
        continue;
      }
      this.turnValue = candidate;
      const moves = this.legalMovesFor(candidate);
      if (moves.length) return;
      if (this.inCheckColor(candidate)) {
        this.eliminated.add(candidate);
        const active = this.activePlayers();
        checked = 0;
        if (active.length === 1) {
          this.result = 'win';
          this.winner = active[0]!;
          return;
        }
      }
      candidate = nextPlayer(candidate);
      checked++;
    }
    this.result = 'draw';
    this.winner = null;
  }

  private legalMovesFor(player: Player): Move[] {
    if (this.eliminated.has(player) || this.result) return [];
    const legal: Move[] = [];
    for (let from = 0; from < this.board.length; from++) {
      const piece = this.board[from];
      if (!piece || piece.color !== player || this.eliminated.has(piece.color)) continue;
      for (const move of this.pseudoMoves(from, piece)) {
        const snapshot = this.snapshot();
        this.applyBoardMove(move);
        if (!this.inCheckColor(player)) legal.push(move);
        this.restore(snapshot);
      }
    }
    return [...new Map(legal.map((move) => [encodeMove(move), move])).values()];
  }

  private pseudoMoves(from: number, piece: ThreePiece): Move[] {
    const moves: Move[] = [];
    if (piece.type === 'p') {
      const one = step(from, seatHex(FORWARD, piece.color));
      if (one !== null && !this.board[one]) this.addPawnMove(moves, from, one, piece);
    }
    for (const to of this.attacksFrom(from, piece)) {
      const target = this.board[to];
      if (target?.color === piece.color || (target?.type === 'k' && !this.eliminated.has(target.color))) continue;
      if (piece.type === 'p') {
        if (target) this.addPawnMove(moves, from, to, piece);
      } else {
        moves.push({ from, to });
      }
    }
    return moves;
  }

  private addPawnMove(moves: Move[], from: number, to: number, piece: ThreePiece): void {
    if (promotes(to, piece.color)) {
      for (const promotion of PROMOTIONS) moves.push({ from, to, promotion });
    } else {
      moves.push({ from, to });
    }
  }

  private attacksFrom(from: number, piece: ThreePiece): number[] {
    if (piece.type === 'p' || piece.type === 'n' || piece.type === 'k') {
      const steps = piece.type === 'p' ? PAWN_CAPTURES.map((direction) => seatHex(direction, piece.color))
        : piece.type === 'n' ? KNIGHTS : KING_STEPS;
      return steps.map((direction) => step(from, direction)).filter((to) => to !== null);
    }
    const rays = piece.type === 'r' ? EDGES : piece.type === 'b' ? DIAGONALS : KING_STEPS;
    const attacks: number[] = [];
    for (const direction of rays) {
      let to = step(from, direction);
      while (to !== null) {
        attacks.push(to);
        if (this.board[to]) break;
        to = step(to, direction);
      }
    }
    return attacks;
  }

  private inCheckColor(player: Player): boolean {
    const king = this.kingSquare(player);
    return king !== null && this.isAttackedByOpponent(king, player);
  }

  private kingSquare(player: Player): number | null {
    const king = this.board.findIndex((piece) => piece?.color === player && piece.type === 'k');
    return king < 0 ? null : king;
  }

  private isAttackedByOpponent(square: number, player: Player): boolean {
    return PLAYERS.some((attacker) => attacker !== player && !this.eliminated.has(attacker) && this.attackedSquares(attacker).includes(square));
  }
}

const START_FEN = `${serializeBoard(startPosition())} w - - -`;

export const threechess: Variant<Game> = {
  id: 'threechess',
  files: FILES,
  ranks: RANKS,
  startFen: START_FEN,
  pieceTypes: ['p', 'n', 'b', 'r', 'q', 'k'],
  players: PLAYERS,
  hasHands: false,
  createGame: (fen = START_FEN) => new Game(fen),
};

export { IllegalMoveError } from '@chaturanga/rules-core';
