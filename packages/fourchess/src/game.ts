import { FenError, IllegalMoveError, type GameStatus, type Variant, type VariantGame, type VariantMoveRecord } from '@chaturanga/rules-core';
import type { EndCause, FourPiece, Move, PieceType, Player } from './types';
import { FILES, RANKS, fileOf, homeLine, isPlayable, isPlayableSquare, kingHomeIndex, parseSquare, pawnLine, rankOf, squareAt, squareName, startBoard } from './layout';
import { PLAYERS } from './types';

const ORTHOGONAL = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;
const DIAGONAL = [[1, 1], [1, -1], [-1, 1], [-1, -1]] as const;
const KING_STEPS = [...ORTHOGONAL, ...DIAGONAL] as const;
const KNIGHT_STEPS = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]] as const;
const PIECE_VALUE: Record<PieceType, number> = { p: 1, n: 3, b: 5, r: 5, q: 9, k: 20 };
const LETTER: Record<PieceType, string> = { p: '', n: 'N', b: 'B', r: 'R', q: 'Q', k: 'K' };

interface EnPassantState {
  target: number;
  victim: number;
  allowed: Player;
}

interface EndState {
  cause: EndCause;
  winners: Player[];
}

interface Snapshot {
  board: Array<FourPiece | null>;
  turn: Player;
  eliminationOrder: Player[];
  castleRights: Record<Player, { left: boolean; right: boolean }>;
  enPassant: EnPassantState | null;
  scores: Record<Player, number>;
  roundsWithoutProgress: number;
  checkSources: Record<Player, Player | null>;
  result: EndState | null;
  positionCounts: Map<string, number>;
  history: VariantMoveRecord<Player>[];
}

const copyPiece = (piece: FourPiece | null): FourPiece | null => piece ? { ...piece } : null;
const emptyRights = (): Record<Player, { left: boolean; right: boolean }> => ({
  r: { left: true, right: true }, b: { left: true, right: true },
  y: { left: true, right: true }, g: { left: true, right: true },
});
const zeroScores = (): Record<Player, number> => ({ r: 0, b: 0, y: 0, g: 0 });
const emptyCheckSources = (): Record<Player, Player | null> => ({ r: null, b: null, y: null, g: null });

function nextPlayer(player: Player): Player {
  return PLAYERS[(PLAYERS.indexOf(player) + 1) % PLAYERS.length]!;
}

function nextActive(player: Player, active: ReadonlySet<Player>): Player | null {
  for (let offset = 1; offset <= PLAYERS.length; offset++) {
    const candidate = PLAYERS[(PLAYERS.indexOf(player) + offset) % PLAYERS.length]!;
    if (active.has(candidate)) return candidate;
  }
  return null;
}

function encodeMove(move: Move): string {
  return `${squareName(move.from)}${squareName(move.to)}${move.promotion ?? ''}`;
}

function parseMove(uci: string): Move | null {
  const match = /^([a-n](?:1[0-4]|[1-9]))([a-n](?:1[0-4]|[1-9]))(q)?$/.exec(uci);
  if (!match) return null;
  const from = parseSquare(match[1]!);
  const to = parseSquare(match[2]!);
  if (from === null || to === null) return null;
  return { from, to, ...(match[3] ? { promotion: 'q' as const } : {}) };
}

function cloneRights(rights: Record<Player, { left: boolean; right: boolean }>): Record<Player, { left: boolean; right: boolean }> {
  return { r: { ...rights.r }, b: { ...rights.b }, y: { ...rights.y }, g: { ...rights.g } };
}

function serializeBoard(board: readonly (FourPiece | null)[]): string {
  return Array.from({ length: RANKS }, (_, displayRank) => {
    const rank = RANKS - displayRank - 1;
    return Array.from({ length: FILES }, (_, file) => {
      if (!isPlayable(file, rank)) return '.';
      const piece = board[squareAt(file, rank)];
      if (!piece) return '-';
      return `${piece.color}${piece.type}${piece.promoted ? '~' : ''}${piece.moved ? '!' : ''}`;
    }).join(',');
  }).join('/');
}

function serializePositionBoard(board: readonly (FourPiece | null)[]): string {
  const position = board.map((piece, square) => {
    if (!piece) return null;
    const movedMatters = piece.type === 'p' && pawnLine(piece.color).includes(square);
    return { ...piece, moved: movedMatters && piece.moved };
  });
  return serializeBoard(position);
}

function serializeRights(rights: Record<Player, { left: boolean; right: boolean }>): string {
  const encoded = PLAYERS.map((player) => `${player}${rights[player].left ? 'L' : ''}${rights[player].right ? 'R' : ''}`)
    .filter((token) => token.length > 1)
    .join('');
  return encoded || '-';
}

function serializeEnPassant(ep: EnPassantState | null): string {
  return ep ? `${squareName(ep.target)}:${squareName(ep.victim)}:${ep.allowed}` : '-';
}

function serializeScores(scores: Record<Player, number>): string {
  return PLAYERS.map((player) => `${player}=${scores[player]}`).join(',');
}

function serializeResult(result: EndState | null): string {
  return result ? `${result.cause}:${result.winners.join('') || '-'}` : '-';
}

interface ParsedFen {
  board: Array<FourPiece | null>;
  turn: Player;
  eliminationOrder: Player[];
  castleRights: Record<Player, { left: boolean; right: boolean }>;
  enPassant: EnPassantState | null;
  scores: Record<Player, number>;
  roundsWithoutProgress: number;
  checkSources: Record<Player, Player | null>;
  result: EndState | null;
}

function readFen(fen: string): ParsedFen {
  const fail = (message: string): never => { throw new FenError(message, fen); };
  function requireFen(condition: unknown, message: string): asserts condition {
    if (!condition) fail(message);
  }
  const fields = fen.trim().split(/\s+/);
  if (fields.length !== 9) fail('Four-handed chess FEN must have nine fields');
  const rows = fields[0]!.split('/');
  if (rows.length !== RANKS) fail(`Expected ${RANKS} board rows`);
  const board: Array<FourPiece | null> = Array(FILES * RANKS).fill(null);
  for (let displayRank = 0; displayRank < RANKS; displayRank++) {
    const rank = RANKS - displayRank - 1;
    const cells = rows[displayRank]!.split(',');
    if (cells.length !== FILES) fail(`Board row ${displayRank + 1} must have ${FILES} cells`);
    for (let file = 0; file < FILES; file++) {
      const token = cells[file]!;
      if (!isPlayable(file, rank)) {
        if (token !== '.') fail('Expected a dot in each cut-away corner');
        continue;
      }
      if (token === '-') continue;
      const match = /^([rbyg])([pnbrqk])(~?)(!?)$/.exec(token);
      requireFen(match, `Invalid piece token: ${token}`);
      board[squareAt(file, rank)] = {
        color: match[1] as Player,
        type: match[2] as PieceType,
        promoted: match[3] === '~',
        moved: match[4] === '!',
      };
    }
  }

  if (!PLAYERS.includes(fields[1] as Player)) fail(`Invalid turn: ${fields[1]}`);
  const turn = fields[1] as Player;
  const castleRights = emptyRights();
  for (const player of PLAYERS) castleRights[player] = { left: false, right: false };
  if (fields[2] !== '-') {
    const castlePattern = /([rbyg])([LR]*)/gy;
    let offset = 0;
    const seen = new Set<Player>();
    while (offset < fields[2]!.length) {
      castlePattern.lastIndex = offset;
      const match = castlePattern.exec(fields[2]!);
      requireFen(match, `Invalid castling field: ${fields[2]}`);
      const player = match[1] as Player;
      if (seen.has(player) || new Set(match[2]).size !== match[2]!.length) fail(`Invalid castling seat: ${player}`);
      seen.add(player);
      castleRights[player] = { left: match[2]!.includes('L'), right: match[2]!.includes('R') };
      offset = castlePattern.lastIndex;
    }
  }

  let enPassant: EnPassantState | null = null;
  if (fields[3] !== '-') {
    const match = /^([a-n](?:1[0-4]|[1-9])):([a-n](?:1[0-4]|[1-9])):([rbyg])$/.exec(fields[3]!);
    requireFen(match, `Invalid en-passant field: ${fields[3]}`);
    const target = parseSquare(match[1]!);
    const victim = parseSquare(match[2]!);
    requireFen(target !== null && victim !== null && PLAYERS.includes(match[3] as Player), `Invalid en-passant field: ${fields[3]}`);
    enPassant = { target, victim, allowed: match[3] as Player };
  }

  const eliminationOrder: Player[] = [];
  if (fields[4] !== '-') {
    for (const char of fields[4]!) {
      if (!PLAYERS.includes(char as Player) || eliminationOrder.includes(char as Player)) fail(`Invalid elimination order: ${fields[4]}`);
      eliminationOrder.push(char as Player);
    }
  }
  const scores = zeroScores();
  const scoreTokens = fields[5]!.split(',');
  if (scoreTokens.length !== PLAYERS.length) fail('Expected one score for each seat');
  const scoredPlayers = new Set<Player>();
  for (const token of scoreTokens) {
    const match = /^([rbyg])=(\d+)$/.exec(token);
    requireFen(match, `Invalid score: ${token}`);
    const player = match[1] as Player;
    if (scoredPlayers.has(player)) fail(`Duplicate score for ${player}`);
    scoredPlayers.add(player);
    scores[player] = Number(match[2]);
  }
  if (scoredPlayers.size !== PLAYERS.length) fail('Expected one score for each seat');
  if (!/^\d+$/.test(fields[6]!)) fail(`Invalid no-progress round count: ${fields[6]}`);
  const roundsWithoutProgress = Number(fields[6]);

  const checkSources = emptyCheckSources();
  if (!/^[rbyg-]{4}$/.test(fields[7]!)) fail(`Invalid check-source field: ${fields[7]}`);
  PLAYERS.forEach((player, index) => {
    const source = fields[7]![index]!;
    if (source !== '-' && (!PLAYERS.includes(source as Player) || source === player)) fail(`Invalid check source for ${player}`);
    checkSources[player] = source === '-' ? null : source as Player;
  });

  let result: EndState | null = null;
  if (fields[8] !== '-') {
    const match = /^(elimination|repetition|insufficient-material|fifty-move|resignation):([rbyg]+|-)$/.exec(fields[8]!);
    requireFen(match, `Invalid result field: ${fields[8]}`);
    const winners = match[2] === '-' ? [] : [...match[2]!].map((char) => char as Player);
    if (new Set(winners).size !== winners.length) fail('Result winners must be unique');
    result = { cause: match[1] as EndCause, winners };
  }

  const active = PLAYERS.filter((player) => !eliminationOrder.includes(player));
  if (!result && active.length < 2) fail('An ongoing game must have at least two active seats');
  if (!result && !active.includes(turn)) fail('An ongoing game must have an active seat to move');
  for (const player of active) {
    if (!board.some((piece) => piece?.color === player && piece.type === 'k')) fail(`Active seat ${player} must have a King`);
  }
  for (const player of PLAYERS) {
    const line = homeLine(player);
    if (castleRights[player].left || castleRights[player].right) {
      const king = board[line[kingHomeIndex(player)]!];
      if (king?.color !== player || king.type !== 'k' || king.moved) fail(`Castling right requires ${player}'s unmoved home King`);
      if (castleRights[player].left) {
        const rook = board[line[0]!];
        if (rook?.color !== player || rook.type !== 'r' || rook.moved) fail(`Left castling right requires ${player}'s unmoved Rook`);
      }
      if (castleRights[player].right) {
        const rook = board[line[7]!];
        if (rook?.color !== player || rook.type !== 'r' || rook.moved) fail(`Right castling right requires ${player}'s unmoved Rook`);
      }
    }
  }
  return { board, turn, eliminationOrder, castleRights, enPassant, scores, roundsWithoutProgress, checkSources, result };
}

export class Game implements VariantGame<Player> {
  private board: Array<FourPiece | null>;
  private turnValue: Player = 'r';
  private eliminationOrder: Player[] = [];
  private castleRights = emptyRights();
  private enPassant: EnPassantState | null = null;
  private scores = zeroScores();
  private roundsWithoutProgress = 0;
  private checkSources = emptyCheckSources();
  private result: EndState | null = null;
  private positionCounts = new Map<string, number>();
  private history: VariantMoveRecord<Player>[] = [];
  private undoStack: Snapshot[] = [];
  private undoKinds: Array<VariantMoveRecord<Player> | null> = [];

  constructor(fen?: string) {
    if (fen === undefined) {
      this.board = startBoard();
      this.positionCounts.set(this.positionKey(), 1);
      return;
    }
    const parsed = readFen(fen);
    this.board = parsed.board;
    this.turnValue = parsed.turn;
    this.eliminationOrder = parsed.eliminationOrder;
    this.castleRights = parsed.castleRights;
    this.enPassant = parsed.enPassant;
    this.scores = parsed.scores;
    this.roundsWithoutProgress = parsed.roundsWithoutProgress;
    this.checkSources = parsed.checkSources;
    this.result = parsed.result;
    if (!this.result) {
      this.settleCurrentTurn();
      this.positionCounts.set(this.positionKey(), 1);
    }
  }

  get turn(): Player { return this.turnValue; }

  fen(): string {
    return [
      serializeBoard(this.board),
      this.turnValue,
      serializeRights(this.castleRights),
      serializeEnPassant(this.enPassant),
      this.eliminationOrder.join('') || '-',
      serializeScores(this.scores),
      String(this.roundsWithoutProgress),
      PLAYERS.map((player) => this.checkSources[player] ?? '-').join(''),
      serializeResult(this.result),
    ].join(' ');
  }

  pieceAt(square: number): FourPiece | null {
    return isPlayableSquare(square) ? copyPiece(this.board[square] ?? null) : null;
  }

  pieces(): Array<{ square: number; piece: FourPiece }> {
    return this.board.flatMap((piece, square) => piece ? [{ square, piece: { ...piece } }] : []);
  }

  hand(_player: Player): readonly string[] { return []; }

  legalUci(): string[] {
    return this.legalMovesFor(this.turnValue).map(encodeMove);
  }

  move(uci: string): VariantMoveRecord<Player> {
    if (this.isGameOver()) throw new IllegalMoveError(`The game is over: ${uci}`);
    const request = parseMove(uci);
    const move = request && this.legalMovesFor(this.turnValue).find((candidate) =>
      candidate.from === request.from && candidate.to === request.to &&
      (request.promotion ? candidate.promotion === request.promotion : !candidate.promotion || candidate.promotion === 'q'),
    );
    if (!move) throw new IllegalMoveError(`Illegal move: ${uci}`);

    this.undoStack.push(this.snapshot());
    const mover = this.turnValue;
    const movingPiece = this.board[move.from]!;
    const captureSquare = move.enPassant ?? move.to;
    const capturedPiece = this.board[captureSquare] ?? null;
    const wasPawn = movingPiece.type === 'p';
    const wasCapture = capturedPiece !== null;
    const activeBefore = new Set(this.activePlayers());
    const checksBefore = new Map(PLAYERS.map((player) => [player, this.inCheckColor(player)] as const));

    this.applyBoardMove(this.board, move);
    this.updateCastlingRights(mover, movingPiece, move, capturedPiece, captureSquare);
    const doubleStep = (fileOf(move.to) === fileOf(move.from) && Math.abs(rankOf(move.to) - rankOf(move.from)) === 2) ||
      (rankOf(move.to) === rankOf(move.from) && Math.abs(fileOf(move.to) - fileOf(move.from)) === 2);
    this.enPassant = wasPawn && doubleStep
      ? {
          target: squareAt((fileOf(move.to) + fileOf(move.from)) / 2, (rankOf(move.to) + rankOf(move.from)) / 2),
          victim: move.to,
          allowed: nextActive(mover, activeBefore) ?? nextPlayer(mover),
        }
      : null;

    if (capturedPiece && activeBefore.has(capturedPiece.color)) {
      this.scores[mover] += capturedPiece.promoted ? 1 : PIECE_VALUE[capturedPiece.type];
    }
    this.updateCheckSources(mover);
    this.scoreNewMultiChecks(mover, checksBefore, this.board[move.to]?.type ?? movingPiece.type);
    const checksAfterMove = new Map(PLAYERS.map((player) => [player, activeBefore.has(player) && this.inCheckOnBoard(this.board, player)] as const));
    const checkSourcesBeforeSettle = { ...this.checkSources };
    const givesCheck = [...checksAfterMove.values()].some(Boolean);

    const beforeOrder = PLAYERS.filter((player) => activeBefore.has(player));
    const nextBeforeElimination = nextActive(mover, activeBefore);
    const cycleWrapped = nextBeforeElimination !== null && PLAYERS.indexOf(nextBeforeElimination) <= PLAYERS.indexOf(mover);
    if (wasPawn || wasCapture) this.roundsWithoutProgress = 0;
    else if (cycleWrapped && beforeOrder.length > 0) this.roundsWithoutProgress++;

    this.turnValue = nextBeforeElimination ?? mover;
    this.settleCurrentTurn();
    const checkmateOccurred = PLAYERS.some((player) => activeBefore.has(player) && !this.isActive(player) &&
      checksAfterMove.get(player) && checkSourcesBeforeSettle[player] === mover);

    if (!this.result) {
      const key = this.positionKey();
      const count = (this.positionCounts.get(key) ?? 0) + 1;
      this.positionCounts.set(key, count);
      if (count >= 3) this.finishByPoints('repetition', true);
      else if (this.activePlayers().every((player) => this.onlyKingRemains(player))) this.finishByPoints('insufficient-material', true);
      else if (this.roundsWithoutProgress >= 50) this.finishByPoints('fifty-move', true);
    }

    const san = move.castle
      ? (move.castle === 'right' ? 'O-O' : 'O-O-O')
      : `${LETTER[movingPiece.type]}${squareName(move.from)}${capturedPiece ? 'x' : ''}${squareName(move.to)}${move.promotion ? '=Q' : ''}`;
    const record: VariantMoveRecord<Player> = {
      uci: encodeMove(move),
      san: `${san}${checkmateOccurred ? '#' : givesCheck ? '+' : ''}`,
      color: mover,
      piece: { color: movingPiece.color, type: movingPiece.type, promoted: movingPiece.promoted },
      captured: capturedPiece ? { color: capturedPiece.color, type: capturedPiece.type, promoted: capturedPiece.promoted } : null,
      to: move.to,
      fenAfter: '',
    };
    this.history.push(record);
    this.undoKinds.push(record);
    record.fenAfter = this.fen();
    return record;
  }

  /** A resignation is a game event, kept separate from ordinary move notation. */
  resign(player: Player): boolean {
    if (this.isGameOver() || !this.isActive(player)) return false;
    this.undoStack.push(this.snapshot());
    this.undoKinds.push(null);
    const previousTurn = this.turnValue;
    this.eliminate(player);
    if (this.activePlayers().length <= 1) {
      this.finishByPoints('resignation', false);
    } else if (player === previousTurn) {
      this.turnValue = nextActive(player, new Set(this.activePlayers())) ?? player;
      this.settleCurrentTurn();
    }
    return true;
  }

  undo(): VariantMoveRecord<Player> | null {
    const snapshot = this.undoStack.pop();
    if (!snapshot) return null;
    const action = this.undoKinds.pop() ?? null;
    this.restore(snapshot);
    return action;
  }

  moves(): VariantMoveRecord<Player>[] { return [...this.history]; }
  lastMove(): VariantMoveRecord<Player> | null { return this.history.at(-1) ?? null; }

  status(): GameStatus<Player> {
    if (!this.result) return { kind: 'ongoing' };
    const winners = [...this.result.winners];
    const winner = winners.length === 1 ? winners[0]! : null;
    return { kind: 'points', reason: this.result.cause, winners, winner, scores: { ...this.scores } };
  }

  isGameOver(): boolean { return this.result !== null; }
  inCheck(): boolean { return this.inCheckColor(this.turnValue); }
  checkedKingSquare(): number | null { return this.inCheck() ? this.kingSquare(this.turnValue) : null; }
  counting(): null { return null; }

  attackedSquares(player: Player): number[] {
    if (!this.isActive(player)) return [];
    const squares = new Set<number>();
    for (let from = 0; from < this.board.length; from++) {
      const piece = this.board[from];
      if (!piece || piece.color !== player) continue;
      for (const target of this.attacksFrom(this.board, from, piece)) squares.add(target);
    }
    return [...squares].sort((a, b) => a - b);
  }

  activePlayers(): Player[] { return PLAYERS.filter((player) => !this.eliminationOrder.includes(player)); }
  isActive(player: Player): boolean { return !this.eliminationOrder.includes(player); }
  isEliminated(player: Player): boolean { return this.eliminationOrder.includes(player); }
  score(player: Player): number { return this.scores[player]; }
  allScores(): Record<Player, number> { return { ...this.scores }; }
  winnerPlayers(): Player[] { return this.result ? [...this.result.winners] : []; }
  endCause(): EndCause | null { return this.result?.cause ?? null; }

  playerStatus(player: Player): 'playing' | 'check' | 'checkmate' | 'stalemate' | 'eliminated' | 'winner' {
    if (this.result?.winners.includes(player)) return 'winner';
    if (!this.isActive(player)) return 'eliminated';
    const checked = this.inCheckColor(player);
    const moves = this.legalMovesFor(player);
    if (!moves.length) return checked ? 'checkmate' : 'stalemate';
    return checked ? 'check' : 'playing';
  }

  private snapshot(): Snapshot {
    return {
      board: this.board.map(copyPiece),
      turn: this.turnValue,
      eliminationOrder: [...this.eliminationOrder],
      castleRights: cloneRights(this.castleRights),
      enPassant: this.enPassant ? { ...this.enPassant } : null,
      scores: { ...this.scores },
      roundsWithoutProgress: this.roundsWithoutProgress,
      checkSources: { ...this.checkSources },
      result: this.result ? { cause: this.result.cause, winners: [...this.result.winners] } : null,
      positionCounts: new Map(this.positionCounts),
      history: [...this.history],
    };
  }

  private restore(snapshot: Snapshot): void {
    this.board = snapshot.board.map(copyPiece);
    this.turnValue = snapshot.turn;
    this.eliminationOrder = [...snapshot.eliminationOrder];
    this.castleRights = cloneRights(snapshot.castleRights);
    this.enPassant = snapshot.enPassant ? { ...snapshot.enPassant } : null;
    this.scores = { ...snapshot.scores };
    this.roundsWithoutProgress = snapshot.roundsWithoutProgress;
    this.checkSources = { ...snapshot.checkSources };
    this.result = snapshot.result ? { cause: snapshot.result.cause, winners: [...snapshot.result.winners] } : null;
    this.positionCounts = new Map(snapshot.positionCounts);
    this.history = [...snapshot.history];
  }

  private activeBoardPlayers(): Set<Player> { return new Set(this.activePlayers()); }

  private positionKey(): string {
    return `${serializePositionBoard(this.board)} ${this.turnValue} ${serializeRights(this.castleRights)} ${serializeEnPassant(this.enPassant)} ${this.eliminationOrder.join('') || '-'}`;
  }

  private updateCastlingRights(player: Player, moving: FourPiece, move: Move, captured: FourPiece | null, captureSquare: number): void {
    if (moving.type === 'k') this.castleRights[player] = { left: false, right: false };
    const ownLine = homeLine(player);
    if (moving.type === 'r') {
      if (move.from === ownLine[0]) this.castleRights[player].left = false;
      if (move.from === ownLine[7]) this.castleRights[player].right = false;
    }
    if (captured?.type === 'r') {
      const victimLine = homeLine(captured.color);
      if (captureSquare === victimLine[0]) this.castleRights[captured.color].left = false;
      if (captureSquare === victimLine[7]) this.castleRights[captured.color].right = false;
    }
  }

  private applyBoardMove(board: Array<FourPiece | null>, move: Move): void {
    const moving = board[move.from];
    if (!moving) return;
    board[move.from] = null;
    if (move.enPassant !== undefined) board[move.enPassant] = null;
    if (move.castle) {
      const line = homeLine(moving.color);
      const rookFrom = move.castle === 'left' ? line[0]! : line[7]!;
      const rookTo = line[kingHomeIndex(moving.color) + (move.castle === 'left' ? -1 : 1)]!;
      const rook = board[rookFrom];
      board[rookFrom] = null;
      if (rook) board[rookTo] = { ...rook, moved: true };
    }
    board[move.to] = {
      ...moving,
      type: move.promotion ?? moving.type,
      promoted: moving.promoted || Boolean(move.promotion),
      moved: true,
    };
  }

  private legalMovesFor(player: Player): Move[] {
    if (this.result || !this.isActive(player)) return [];
    const legal: Move[] = [];
    for (let from = 0; from < this.board.length; from++) {
      const piece = this.board[from];
      if (!piece || piece.color !== player) continue;
      for (const move of this.pseudoMoves(from, piece)) {
        const board = this.board.map(copyPiece);
        this.applyBoardMove(board, move);
        if (!this.inCheckOnBoard(board, player)) legal.push(move);
      }
    }
    const seen = new Set<string>();
    return legal.filter((move) => {
      const key = encodeMove(move);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private pseudoMoves(from: number, piece: FourPiece): Move[] {
    const moves: Move[] = [];
    if (piece.type === 'p') {
      const [df, dr] = this.forward(piece.color);
      const f = fileOf(from), r = rankOf(from);
      const one = squareAt(f + df, r + dr);
      if (isPlayable(f + df, r + dr) && !this.board[one]) {
        this.addPawnMove(moves, from, one, piece);
        const twoFile = f + 2 * df, twoRank = r + 2 * dr;
        const two = squareAt(twoFile, twoRank);
        if (!piece.moved && this.isPawnHome(piece.color, from) && isPlayable(twoFile, twoRank) && !this.board[two]) {
          moves.push({ from, to: two });
        }
      }
      for (const [cFile, cRank] of this.pawnCaptures(piece.color)) {
        const targetFile = f + cFile, targetRank = r + cRank;
        if (!isPlayable(targetFile, targetRank)) continue;
        const target = squareAt(targetFile, targetRank);
        const occupant = this.board[target];
        if (occupant && this.canCapture(piece.color, occupant)) this.addPawnMove(moves, from, target, piece);
        else if (!occupant && this.enPassant?.target === target && this.enPassant.allowed === piece.color && this.enPassant.victim >= 0) {
          const victim = this.board[this.enPassant.victim];
          if (victim?.type === 'p' && victim.color !== piece.color && this.isActive(victim.color)) {
            moves.push({ from, to: target, enPassant: this.enPassant.victim });
          }
        }
      }
      return moves;
    }

    if (piece.type === 'k') this.addStepMoves(moves, from, piece, KING_STEPS);
    else if (piece.type === 'n') this.addStepMoves(moves, from, piece, KNIGHT_STEPS);
    else {
      const directions = piece.type === 'r' ? ORTHOGONAL : piece.type === 'b' ? DIAGONAL : KING_STEPS;
      this.addSlidingMoves(moves, from, piece, directions);
    }
    if (piece.type === 'k') moves.push(...this.castlingMoves(from, piece));
    return moves;
  }

  private addPawnMove(moves: Move[], from: number, to: number, piece: FourPiece): void {
    moves.push(this.isPromotionSquare(to, piece.color) ? { from, to, promotion: 'q' } : { from, to });
  }

  private addStepMoves(moves: Move[], from: number, piece: FourPiece, directions: readonly (readonly [number, number])[]): void {
    for (const [df, dr] of directions) {
      const file = fileOf(from) + df, rank = rankOf(from) + dr;
      if (!isPlayable(file, rank)) continue;
      const to = squareAt(file, rank);
      const target = this.board[to];
      if (!target || this.canCapture(piece.color, target)) moves.push({ from, to });
    }
  }

  private addSlidingMoves(moves: Move[], from: number, piece: FourPiece, directions: readonly (readonly [number, number])[]): void {
    for (const [df, dr] of directions) {
      let file = fileOf(from) + df, rank = rankOf(from) + dr;
      while (isPlayable(file, rank)) {
        const to = squareAt(file, rank);
        const target = this.board[to];
        if (!target) moves.push({ from, to });
        else {
          if (this.canCapture(piece.color, target)) moves.push({ from, to });
          break;
        }
        file += df;
        rank += dr;
      }
    }
  }

  private castlingMoves(from: number, king: FourPiece): Move[] {
    const line = homeLine(king.color);
    const kingIndex = kingHomeIndex(king.color);
    if (from !== line[kingIndex] || king.moved || this.inCheckColor(king.color)) return [];
    const moves: Move[] = [];
    for (const wing of ['left', 'right'] as const) {
      if (!this.castleRights[king.color][wing]) continue;
      const rookIndex = wing === 'left' ? 0 : 7;
      const rook = this.board[line[rookIndex]!];
      if (rook?.color !== king.color || rook.type !== 'r' || rook.moved) continue;
      const rookFile = wing === 'left' ? 0 : 7;
      const between = Array.from(
        { length: Math.abs(rookFile - kingIndex) - 1 },
        (_, index) => Math.min(rookFile, kingIndex) + index + 1,
      );
      if (between.some((index) => this.board[line[index]!] !== null)) continue;
      const direction = wing === 'left' ? -1 : 1;
      const kingPath = [kingIndex + direction, kingIndex + direction * 2];
      if (kingPath.some((index) => this.isAttackedByOpponent(line[index]!, king.color))) continue;
      moves.push({ from, to: line[kingIndex + direction * 2]!, castle: wing });
    }
    return moves;
  }

  private canCapture(player: Player, target: FourPiece): boolean {
    return target.color !== player && !(target.type === 'k' && this.isActive(target.color));
  }

  private forward(player: Player): readonly [number, number] {
    if (player === 'r') return [0, 1];
    if (player === 'b') return [1, 0];
    if (player === 'y') return [0, -1];
    return [-1, 0];
  }

  private pawnCaptures(player: Player): readonly (readonly [number, number])[] {
    const [df, dr] = this.forward(player);
    return df === 0 ? [[-1, dr], [1, dr]] : [[df, -1], [df, 1]];
  }

  private isPawnHome(player: Player, square: number): boolean {
    return pawnLine(player).includes(square);
  }

  private isPromotionSquare(square: number, player: Player): boolean {
    if (player === 'r') return rankOf(square) === 7;
    if (player === 'y') return rankOf(square) === 6;
    if (player === 'b') return fileOf(square) === 7;
    return fileOf(square) === 6;
  }

  private attacksFrom(board: readonly (FourPiece | null)[], from: number, piece: FourPiece): number[] {
    const targets: number[] = [];
    if (piece.type === 'p') {
      for (const [df, dr] of this.pawnCaptures(piece.color)) {
        const file = fileOf(from) + df, rank = rankOf(from) + dr;
        if (isPlayable(file, rank)) targets.push(squareAt(file, rank));
      }
      return targets;
    }
    if (piece.type === 'n' || piece.type === 'k') {
      const steps = piece.type === 'n' ? KNIGHT_STEPS : KING_STEPS;
      for (const [df, dr] of steps) {
        const file = fileOf(from) + df, rank = rankOf(from) + dr;
        if (isPlayable(file, rank)) targets.push(squareAt(file, rank));
      }
      return targets;
    }
    const directions = piece.type === 'r' ? ORTHOGONAL : piece.type === 'b' ? DIAGONAL : KING_STEPS;
    for (const [df, dr] of directions) {
      let file = fileOf(from) + df, rank = rankOf(from) + dr;
      while (isPlayable(file, rank)) {
        const square = squareAt(file, rank);
        targets.push(square);
        if (board[square]) break;
        file += df;
        rank += dr;
      }
    }
    return targets;
  }

  private kingSquare(player: Player, board: readonly (FourPiece | null)[] = this.board): number | null {
    const square = board.findIndex((piece) => piece?.color === player && piece.type === 'k');
    return square < 0 ? null : square;
  }

  private inCheckColor(player: Player): boolean {
    if (!this.isActive(player)) return false;
    return this.inCheckOnBoard(this.board, player);
  }

  private inCheckOnBoard(board: readonly (FourPiece | null)[], player: Player): boolean {
    const king = this.kingSquare(player, board);
    if (king === null) return true;
    return this.isAttackedByOpponentOnBoard(board, king, player);
  }

  private isAttackedByOpponent(square: number, player: Player): boolean {
    return this.isAttackedByOpponentOnBoard(this.board, square, player);
  }

  private isAttackedByOpponentOnBoard(board: readonly (FourPiece | null)[], square: number, player: Player): boolean {
    return PLAYERS.some((attacker) => attacker !== player && this.isActive(attacker) && this.attacksByPlayerOnBoard(board, attacker, square));
  }

  private attacksByPlayerOnBoard(board: readonly (FourPiece | null)[], attacker: Player, target: number): boolean {
    for (let from = 0; from < board.length; from++) {
      const piece = board[from];
      if (piece?.color === attacker && this.attacksFrom(board, from, piece).includes(target)) return true;
    }
    return false;
  }

  private updateCheckSources(mover: Player): void {
    for (const target of PLAYERS) {
      if (target === mover || !this.isActive(target)) {
        this.checkSources[target] = null;
        continue;
      }
      const king = this.kingSquare(target);
      if (king === null || !this.isAttackedByOpponent(king, target)) {
        this.checkSources[target] = null;
      } else if (this.attacksByPlayerOnBoard(this.board, mover, king)) {
        this.checkSources[target] = mover;
      } else if (!this.checkSources[target] || !this.isActive(this.checkSources[target]!)) {
        this.checkSources[target] = PLAYERS.find((attacker) => attacker !== target && this.isActive(attacker) && this.attacksByPlayerOnBoard(this.board, attacker, king)) ?? null;
      }
    }
  }

  private scoreNewMultiChecks(mover: Player, before: ReadonlyMap<Player, boolean>, checkingPiece: PieceType): void {
    const newlyChecked = PLAYERS.filter((player) => player !== mover && this.isActive(player) && !before.get(player) && this.inCheckBy(player, mover));
    if (newlyChecked.length < 2) return;
    const checkingQueen = checkingPiece === 'q';
    this.scores[mover] += newlyChecked.length === 2 ? (checkingQueen ? 1 : 5) : (checkingQueen ? 5 : 20);
  }

  private inCheckBy(target: Player, attacker: Player): boolean {
    const king = this.kingSquare(target);
    return king !== null && this.attacksByPlayerOnBoard(this.board, attacker, king);
  }

  private settleCurrentTurn(): void {
    let candidate: Player | null = this.turnValue;
    let iterations = 0;
    while (candidate && this.activePlayers().length > 0 && iterations < PLAYERS.length * 2) {
      if (!this.isActive(candidate)) {
        candidate = nextActive(candidate, new Set(this.activePlayers()));
        iterations++;
        continue;
      }
      this.turnValue = candidate;
      if (this.enPassant && candidate !== this.enPassant.allowed) this.enPassant = null;
      const moves = this.legalMovesFor(candidate);
      if (moves.length > 0) return;
      if (this.inCheckColor(candidate)) {
        const source = this.checkSources[candidate];
        this.eliminate(candidate);
        if (source && this.isActive(source)) this.scores[source] += 20;
      } else {
        this.eliminate(candidate);
        this.scores[candidate] += 20;
        for (const other of this.activePlayers()) this.scores[other] += 10;
      }
      if (this.activePlayers().length <= 1) {
        this.finishByPoints('elimination', false);
        return;
      }
      candidate = nextActive(candidate, new Set(this.activePlayers()));
      iterations++;
    }
    if (this.activePlayers().length === 0 && !this.result) this.finishByPoints('elimination', false);
  }

  private eliminate(player: Player): void {
    if (!this.isActive(player)) return;
    this.eliminationOrder.push(player);
    this.castleRights[player] = { left: false, right: false };
    this.checkSources[player] = null;
    for (const target of PLAYERS) {
      if (!this.isActive(target)) {
        this.checkSources[target] = null;
        continue;
      }
      const king = this.kingSquare(target);
      if (king === null || !this.isAttackedByOpponent(king, target)) {
        this.checkSources[target] = null;
      } else if (!this.checkSources[target] || !this.isActive(this.checkSources[target]!)) {
        this.checkSources[target] = PLAYERS.find((attacker) => attacker !== target && this.isActive(attacker) && this.attacksByPlayerOnBoard(this.board, attacker, king)) ?? null;
      }
    }
    if (this.enPassant?.allowed === player) this.enPassant = null;
  }

  private onlyKingRemains(player: Player): boolean {
    return this.board.filter((piece) => piece?.color === player).every((piece) => piece?.type === 'k');
  }

  private finishByPoints(cause: EndCause, awardActive: boolean): void {
    if (this.result) return;
    const eligible = awardActive ? this.activePlayers() : [...PLAYERS];
    if (awardActive) for (const player of eligible) this.scores[player] += 10;
    const highest = Math.max(...eligible.map((player) => this.scores[player]));
    const tied = eligible.filter((player) => this.scores[player] === highest);
    const survival = (player: Player) => this.eliminationOrder.indexOf(player) + 1;
    const latest = Math.max(...tied.map(survival));
    const winners = tied.filter((player) => survival(player) === latest);
    this.result = { cause, winners };
  }
}

const START_FEN = (() => {
  const rows = serializeBoard(startBoard());
  return `${rows} r rLRbLRyLRgLR - - r=0,b=0,y=0,g=0 0 ---- -`;
})();

export const fourchess: Variant<Game> = {
  id: 'fourchess',
  files: FILES,
  ranks: RANKS,
  isPlayable: (square) => isPlayableSquare(square),
  startFen: START_FEN,
  pieceTypes: ['p', 'n', 'b', 'r', 'q', 'k'],
  players: PLAYERS,
  hasHands: false,
  createGame: (fen = START_FEN) => new Game(fen),
};

export { IllegalMoveError } from '@chaturanga/rules-core';
export { parseSquare, squareName } from './layout';
