import { FenError, IllegalMoveError, type GameStatus, type Variant, type VariantGame, type VariantMoveRecord } from '@chaturanga/rules-core';
import type { GameStatusName, Move, PieceType, Player, SeatStatus, ThreePiece } from './types';

const FILES = 8;
const RANKS = 12;
const PLAYERS: readonly Player[] = ['w', 'b', 'r'];
const PROMOTIONS = ['q', 'r', 'b', 'n'] as const;
const START_ORDER: readonly PieceType[] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
const KING_STEPS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]] as const;
const KNIGHT_STEPS = [[1, 2], [1, -2], [-1, 2], [-1, -2], [2, 1], [2, -1], [-2, 1], [-2, -1]] as const;
const ROOK_RAYS = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;
const BISHOP_RAYS = [[1, 1], [1, -1], [-1, 1], [-1, -1]] as const;
const LETTERS: Record<PieceType, string> = { p: '', n: 'N', b: 'B', r: 'R', q: 'Q', k: 'K' };

interface DoublePawn {
  square: number;
  passed: number;
  eligible: Player;
}

interface Snapshot {
  board: Array<ThreePiece | null>;
  turn: Player;
  eliminated: Set<Player>;
  result: 'win' | 'draw' | null;
  winner: Player | null;
  enPassant: DoublePawn | null;
  history: VariantMoveRecord<Player>[];
}

const rowOf = (square: number): number => Math.floor(square / FILES);
const fileOf = (square: number): number => square % FILES;
const mod = (value: number, length: number): number => ((value % length) + length) % length;
const squareAt = (file: number, rank: number): number => mod(rank, RANKS) * FILES + file;
const homeRank = (player: Player): number => PLAYERS.indexOf(player) * 4;
const pawnRank = (player: Player): number => homeRank(player) + 1;
const promotionRank = (player: Player): number => mod(homeRank(player) + 4, RANKS);
const nextPlayer = (player: Player): Player => PLAYERS[(PLAYERS.indexOf(player) + 1) % PLAYERS.length]!;
const clonePiece = (piece: ThreePiece | null): ThreePiece | null => (piece ? { ...piece } : null);

export function squareName(square: number): string {
  if (square < 0 || square >= FILES * RANKS) throw new RangeError(`Invalid square: ${square}`);
  return `${String.fromCharCode(97 + fileOf(square))}${rowOf(square) + 1}`;
}

export function parseSquare(name: string): number | null {
  const match = /^([a-h])(1[0-2]|[1-9])$/.exec(name);
  if (!match) return null;
  return (Number(match[2]) - 1) * FILES + match[1]!.charCodeAt(0) - 97;
}

function encodeMove(move: Move): string {
  return `${squareName(move.from)}${squareName(move.to)}${move.promotion ?? ''}`;
}

function parseMove(uci: string): Move | null {
  const match = /^([a-h](?:1[0-2]|[1-9]))([a-h](?:1[0-2]|[1-9]))([qrbn])?$/.exec(uci);
  if (!match) return null;
  const from = parseSquare(match[1]!);
  const to = parseSquare(match[2]!);
  if (from === null || to === null) return null;
  return { from, to, ...(match[3] ? { promotion: match[3] as Move['promotion'] } : {}) };
}

function startPosition(): Array<ThreePiece | null> {
  const board: Array<ThreePiece | null> = Array(FILES * RANKS).fill(null);
  for (const player of PLAYERS) {
    const home = homeRank(player);
    for (let file = 0; file < FILES; file++) {
      board[squareAt(file, home)] = { color: player, type: START_ORDER[file]!, promoted: false, moved: false };
      board[squareAt(file, home + 1)] = { color: player, type: 'p', promoted: false, moved: false };
    }
  }
  return board;
}

function serializeBoard(board: readonly (ThreePiece | null)[]): string {
  return Array.from({ length: RANKS }, (_, rank) =>
    Array.from({ length: FILES }, (_, file) => {
      const piece = board[squareAt(file, rank)];
      return piece ? `${piece.color}${piece.type}${piece.moved ? '!' : ''}` : '-';
    }).join(','),
  ).join('/');
}

function readFen(fen: string): {
  board: Array<ThreePiece | null>;
  turn: Player;
  enPassant: DoublePawn | null;
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
  const enPassantSquare = fields[2] === '-' ? null : parseSquare(fields[2]!);
  if (fields[2] !== '-' && enPassantSquare === null) fail(`Invalid en-passant square: ${fields[2]}`);
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
  const enPassant = enPassantSquare === null ? null : {
    square: squareAt(fileOf(enPassantSquare), rowOf(enPassantSquare) + 1),
    passed: enPassantSquare,
    eligible: turn,
  };
  return { board, turn, enPassant, eliminated, result, winner };
}

/** A small three-seat rules engine. Coordinates wrap at the rank seam, never across files. */
export class Game implements VariantGame<Player> {
  private board: Array<ThreePiece | null>;
  private turnValue: Player;
  private eliminated = new Set<Player>();
  private result: 'win' | 'draw' | null = null;
  private winner: Player | null = null;
  private enPassant: DoublePawn | null = null;
  private history: VariantMoveRecord<Player>[] = [];
  private undoStack: Snapshot[] = [];

  constructor(fen?: string) {
    if (!fen) {
      this.board = startPosition();
      this.turnValue = 'w';
      return;
    }
    const parsed = readFen(fen);
    this.board = parsed.board;
    this.turnValue = parsed.turn;
    this.enPassant = parsed.enPassant;
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
    return `${serializeBoard(this.board)} ${this.turnValue} ${this.enPassant ? squareName(this.enPassant.passed) : '-'} ${eliminated} ${outcome}`;
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
    const captured = move.special === 'en-passant' && this.enPassant ? this.board[this.enPassant.square] : this.board[move.to];
    this.applyBoardMove(move);
    this.enPassant = null;
    if (movingPiece.type === 'p' && Math.abs(rowOf(move.to) - rowOf(move.from)) === 2) {
      const passedRank = mod(rowOf(move.from) + 1, RANKS);
      this.enPassant = { square: move.to, passed: squareAt(fileOf(move.from), passedRank), eligible: nextPlayer(player) };
    }
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
      enPassant: this.enPassant ? { ...this.enPassant } : null,
      history: [...this.history],
    };
  }

  private restore(snapshot: Snapshot): void {
    this.board = snapshot.board.map(clonePiece);
    this.turnValue = snapshot.turn;
    this.eliminated = new Set(snapshot.eliminated);
    this.result = snapshot.result;
    this.winner = snapshot.winner;
    this.enPassant = snapshot.enPassant ? { ...snapshot.enPassant } : null;
    this.history = [...snapshot.history];
  }

  private applyBoardMove(move: Move): void {
    const piece = this.board[move.from];
    if (!piece) return;
    if (move.special === 'en-passant' && this.enPassant) this.board[this.enPassant.square] = null;
    this.board[move.from] = null;
    const placed: ThreePiece = { ...piece, moved: true };
    if (move.special === 'castle-kingside') {
      const rookFrom = squareAt(7, rowOf(move.from));
      const rookTo = squareAt(5, rowOf(move.from));
      const rook = this.board[rookFrom];
      this.board[rookFrom] = null;
      if (rook) this.board[rookTo] = { ...rook, moved: true };
    } else if (move.special === 'castle-queenside') {
      const rookFrom = squareAt(0, rowOf(move.from));
      const rookTo = squareAt(3, rowOf(move.from));
      const rook = this.board[rookFrom];
      this.board[rookFrom] = null;
      if (rook) this.board[rookTo] = { ...rook, moved: true };
    }
    if (piece.type === 'p' && rowOf(move.to) === promotionRank(piece.color)) {
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
    if (piece.type === 'p') return this.pawnMoves(from, piece);
    const moves: Move[] = [];
    if (piece.type === 'n') {
      for (const [dr, df] of KNIGHT_STEPS) this.addStepMove(moves, from, piece, dr, df);
      return moves;
    }
    if (piece.type === 'k') {
      for (const [dr, df] of KING_STEPS) this.addStepMove(moves, from, piece, dr, df);
      moves.push(...this.castlingMoves(from, piece));
      return moves;
    }
    const rays = piece.type === 'r' ? ROOK_RAYS : piece.type === 'b' ? BISHOP_RAYS : [...ROOK_RAYS, ...BISHOP_RAYS];
    for (const [dr, df] of rays) {
      let rank = rowOf(from);
      let file = fileOf(from);
      for (let step = 0; step < RANKS; step++) {
        rank = mod(rank + dr, RANKS);
        file += df;
        if (file < 0 || file >= FILES) break;
        const to = squareAt(file, rank);
        if (to === from) break;
        const target = this.board[to];
        if (target?.color === piece.color) break;
        if (!target || target.type !== 'k' || this.eliminated.has(target.color)) moves.push({ from, to });
        if (target) break;
      }
    }
    return moves;
  }

  private pawnMoves(from: number, piece: ThreePiece): Move[] {
    const moves: Move[] = [];
    const file = fileOf(from);
    const nextRank = mod(rowOf(from) + 1, RANKS);
    const one = squareAt(file, nextRank);
    if (!this.board[one]) {
      this.addPawnMove(moves, from, one, piece);
      const two = squareAt(file, mod(nextRank + 1, RANKS));
      if (!piece.moved && rowOf(from) === pawnRank(piece.color) && !this.board[two]) moves.push({ from, to: two });
    }
    for (const deltaFile of [-1, 1]) {
      const captureFile = file + deltaFile;
      if (captureFile < 0 || captureFile >= FILES) continue;
      const to = squareAt(captureFile, nextRank);
      const target = this.board[to];
      if (target && target.color !== piece.color && (target.type !== 'k' || this.eliminated.has(target.color))) {
        this.addPawnMove(moves, from, to, piece);
      } else if (!target && this.enPassant?.eligible === piece.color && this.enPassant.passed === to) {
        moves.push({ from, to, special: 'en-passant' });
      }
    }
    return moves;
  }

  private addPawnMove(moves: Move[], from: number, to: number, piece: ThreePiece): void {
    if (rowOf(to) === promotionRank(piece.color)) for (const promotion of PROMOTIONS) moves.push({ from, to, promotion });
    else moves.push({ from, to });
  }

  private addStepMove(moves: Move[], from: number, piece: ThreePiece, dr: number, df: number): void {
    const file = fileOf(from) + df;
    if (file < 0 || file >= FILES) return;
    const to = squareAt(file, rowOf(from) + dr);
    if (to === from) return;
    const target = this.board[to];
    if (target?.color === piece.color || (target?.type === 'k' && !this.eliminated.has(target.color))) return;
    moves.push({ from, to });
  }

  private castlingMoves(from: number, king: ThreePiece): Move[] {
    const rank = rowOf(from);
    if (king.moved || rank !== homeRank(king.color) || fileOf(from) !== 4 || this.inCheckColor(king.color)) return [];
    const moves: Move[] = [];
    for (const side of ['kingside', 'queenside'] as const) {
      const rookFile = side === 'kingside' ? 7 : 0;
      const rook = this.board[squareAt(rookFile, rank)];
      if (!rook || rook.color !== king.color || rook.type !== 'r' || rook.moved) continue;
      const kingFiles = side === 'kingside' ? [5, 6] : [3, 2];
      const betweenFiles = side === 'kingside' ? [5, 6] : [3, 2, 1];
      if (betweenFiles.some((file) => this.board[squareAt(file, rank)])) continue;
      if (kingFiles.some((file) => this.isAttackedByOpponent(squareAt(file, rank), king.color))) continue;
      moves.push({
        from,
        to: squareAt(side === 'kingside' ? 6 : 2, rank),
        special: side === 'kingside' ? 'castle-kingside' : 'castle-queenside',
      });
    }
    return moves;
  }

  private attacksFrom(from: number, piece: ThreePiece): number[] {
    if (piece.type === 'p') {
      return [-1, 1]
        .map((df) => fileOf(from) + df)
        .filter((file) => file >= 0 && file < FILES)
        .map((file) => squareAt(file, rowOf(from) + 1));
    }
    if (piece.type === 'n') return KNIGHT_STEPS.flatMap(([dr, df]) => this.validStep(from, dr, df));
    if (piece.type === 'k') return KING_STEPS.flatMap(([dr, df]) => this.validStep(from, dr, df));
    const rays = piece.type === 'r' ? ROOK_RAYS : piece.type === 'b' ? BISHOP_RAYS : [...ROOK_RAYS, ...BISHOP_RAYS];
    const attacks: number[] = [];
    for (const [dr, df] of rays) {
      let rank = rowOf(from);
      let file = fileOf(from);
      for (let step = 0; step < RANKS; step++) {
        rank = mod(rank + dr, RANKS);
        file += df;
        if (file < 0 || file >= FILES) break;
        const to = squareAt(file, rank);
        if (to === from) break;
        attacks.push(to);
        if (this.board[to]) break;
      }
    }
    return attacks;
  }

  private validStep(from: number, dr: number, df: number): number[] {
    const file = fileOf(from) + df;
    if (file < 0 || file >= FILES) return [];
    const to = squareAt(file, rowOf(from) + dr);
    return to === from ? [] : [to];
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
