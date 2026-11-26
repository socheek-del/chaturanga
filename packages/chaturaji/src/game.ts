import {
  FenError,
  IllegalMoveError as CoreIllegalMoveError,
  type GameStatus,
  type Variant,
  type VariantGame,
  type VariantMoveRecord,
} from '@chaturanga/rules-core';
import { ALLY, FILES, FORWARD, initialBoard, isOnBoard, KING_HOME, parseSquare, rankOf, squareAt, squareName } from './layout';
import { PIECE_TYPES, PLAYERS, type Piece, type PieceType, type Player } from './types';

const DIE_TYPES: Readonly<Record<number, readonly PieceType[]>> = {
  1: ['p', 'k'], 2: ['b'], 3: ['h'], 4: ['e'], 5: ['p', 'k'], 6: ['e'],
};
const CAPTURE_POINTS: Readonly<Record<PieceType, number>> = { p: 1, b: 2, h: 3, e: 4, k: 5 };
const LETTER: Readonly<Record<PieceType, string>> = { p: '', b: 'B', h: 'H', e: 'E', k: 'K' };
const ORTHOGONAL = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;
const DIAGONAL = [[1, 1], [1, -1], [-1, 1], [-1, -1]] as const;
const KING_STEPS = [...ORTHOGONAL, ...DIAGONAL] as const;
const KNIGHT_STEPS = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]] as const;

type InternalPiece = Piece;
type Result = Player[] | null;
interface Position {
  board: Array<InternalPiece | null>;
  turn: Player;
  army: Player;
  dice: [number, number] | null;
  dieIndex: number;
  scores: Record<Player, number>;
  pools: Record<Player, PieceType[]>;
  controllers: Record<Player, Player>;
  kingTakers: Record<Player, Player | null>;
  result: Result;
}
interface HistoryEntry { record: VariantMoveRecord<Player>; before: Position }

const zeroScores = (): Record<Player, number> => ({ r: 0, g: 0, y: 0, b: 0 });
const emptyPools = (): Record<Player, PieceType[]> => ({ r: [], g: [], y: [], b: [] });
const defaultControllers = (): Record<Player, Player> => ({ r: 'r', g: 'g', y: 'y', b: 'b' });
const emptyKingTakers = (): Record<Player, Player | null> => ({ r: null, g: null, y: null, b: null });
const copyPiece = (piece: InternalPiece | null): InternalPiece | null => piece ? { ...piece } : null;

/** Deterministically maps one injected 32-bit seed to two six-sided dice. */
export function diceForSeed(seed: number): [number, number] {
  let state = seed >>> 0;
  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 0x1_0000_0000;
  };
  return [Math.floor(next() * 6) + 1, Math.floor(next() * 6) + 1];
}

function encodeBoard(board: readonly (InternalPiece | null)[]): string {
  return Array.from({ length: 8 }, (_, displayRank) => {
    const rank = 7 - displayRank;
    return Array.from({ length: 8 }, (_, file) => {
      const piece = board[squareAt(file, rank)];
      return piece ? `${piece.color}${piece.type}${piece.promoted ? '~' : ''}` : '-';
    }).join(',');
  }).join('/');
}

function encodeScores(scores: Record<Player, number>): string {
  return PLAYERS.map((player) => `${player}=${scores[player]}`).join(',');
}
function encodePools(pools: Record<Player, PieceType[]>): string {
  return PLAYERS.map((player) => `${player}=${pools[player].join('') || '-'}`).join(',');
}
function encodeControllers(controllers: Record<Player, Player>): string {
  return PLAYERS.map((army) => `${army}=${controllers[army]}`).join(',');
}
function encodeKingTakers(takers: Record<Player, Player | null>): string {
  return PLAYERS.map((player) => `${player}=${takers[player] ?? 'none'}`).join(',');
}

function encodeFen(position: Position): string {
  const dice = position.dice ? `${position.dice[0]}${position.dice[1]}` : '-';
  return [
    encodeBoard(position.board), position.turn, position.army, dice, String(position.dieIndex),
    encodeScores(position.scores), encodePools(position.pools), encodeControllers(position.controllers),
    encodeKingTakers(position.kingTakers), position.result ? `points:${position.result.join('')}` : '-',
  ].join(' ');
}

function parsePlayer(value: string): Player | null {
  return PLAYERS.includes(value as Player) ? value as Player : null;
}

function parseMap<T>(field: string, parseValue: (value: string) => T | null, name: string, fen: string): Record<Player, T> {
  const values = {} as Record<Player, T>;
  const tokens = field.split(',');
  if (tokens.length !== PLAYERS.length) throw new FenError(`Expected four ${name} values`, fen);
  for (const token of tokens) {
    const match = /^([rgby])=(.+)$/.exec(token);
    if (!match) throw new FenError(`Invalid ${name} entry: ${token}`, fen);
    const player = match[1] as Player;
    const value = parseValue(match[2]!);
    if (value === null || Object.hasOwn(values, player)) throw new FenError(`Invalid ${name} entry: ${token}`, fen);
    values[player] = value;
  }
  if (PLAYERS.some((player) => !Object.hasOwn(values, player))) throw new FenError(`Expected four ${name} values`, fen);
  return values;
}

function decodeFen(fen: string): Position {
  const fail = (message: string): never => { throw new FenError(message, fen); };
  const fields = fen.trim().split(/\s+/);
  if (fields.length !== 10) fail('Chaturaji FEN must have ten fields');
  const rows = fields[0]!.split('/');
  if (rows.length !== 8) fail('Chaturaji board must have eight ranks');
  const board: Array<InternalPiece | null> = Array(64).fill(null);
  for (let displayRank = 0; displayRank < 8; displayRank++) {
    const cells = rows[displayRank]!.split(',');
    if (cells.length !== 8) fail(`Board rank ${8 - displayRank} must have eight cells`);
    const rank = 7 - displayRank;
    for (let file = 0; file < 8; file++) {
      const token = cells[file]!;
      if (token === '-') continue;
      const match = /^([rgby])([pbhek])(~?)$/.exec(token);
      if (!match) throw new FenError(`Invalid piece token: ${token}`, fen);
      board[squareAt(file, rank)] = { color: match[1] as Player, type: match[2] as PieceType, promoted: match[3] === '~' };
    }
  }
  const activeTurn = parsePlayer(fields[1]!);
  const activeArmy = parsePlayer(fields[2]!);
  if (!activeTurn || !activeArmy) throw new FenError('Invalid turn or active army', fen);
  const turn = activeTurn;
  const army = activeArmy;
  let dice: [number, number] | null = null;
  if (fields[3] !== '-') {
    const diceMatch = /^([1-6])([1-6])$/.exec(fields[3]!);
    if (!diceMatch) throw new FenError('Dice must be two faces from 1 through 6, or -', fen);
    dice = [Number(diceMatch[1]), Number(diceMatch[2])];
  }
  if (!/^\d$/.test(fields[4]!)) fail('Invalid die index');
  const dieIndex = Number(fields[4]);
  if (dieIndex > 1 || (!dice && dieIndex !== 0)) fail('Die index does not match the dice state');

  const scores = parseMap(fields[5]!, (value) => /^\d+$/.test(value) ? Number(value) : null, 'score', fen);
  const pools = parseMap(fields[6]!, (value) => {
    if (value === '-') return [];
    return /^[pbhek]+$/.test(value) ? [...value] as PieceType[] : null;
  }, 'captured-piece pool', fen);
  const controllers = parseMap(fields[7]!, parsePlayer, 'controller', fen);
  const encodedKingTakers = parseMap<Player | 'none'>(fields[8]!, (value) => value === 'none' ? 'none' : parsePlayer(value), 'King-capture owner', fen);
  const kingTakers = Object.fromEntries(PLAYERS.map((player) => [player, encodedKingTakers[player] === 'none' ? null : encodedKingTakers[player]])) as Record<Player, Player | null>;
  let result: Result = null;
  if (fields[9] !== '-') {
    const resultMatch = /^points:([rgby]{1,4})$/.exec(fields[9]!);
    if (!resultMatch || new Set(resultMatch[1]!).size !== resultMatch[1]!.length) throw new FenError(`Invalid result: ${fields[9]}`, fen);
    result = [...resultMatch[1]!] as Player[];
  }
  if (turn !== controllers[army]) fail('The player to move must control the active army');
  const capturedKingCount = Object.values(kingTakers).filter((owner) => owner !== null).length;
  if (!result && capturedKingCount >= 3) fail('A game with three captured Kings must have a result');
  if (result && capturedKingCount < 3) fail('A points result requires three captured Kings');
  for (const player of PLAYERS) {
    if (kingTakers[player] === null && !board.some((piece) => piece?.color === player && piece.type === 'k' && !piece.promoted))
      fail(`King-capture record does not match ${player}'s King`);
  }
  return {
    board, turn, army, dice,
    dieIndex, scores, pools, controllers, kingTakers, result,
  };
}

/** Build an initial position whose first dice pair comes from the supplied seed. */
export function createSeededStartFen(seed: number): string {
  const dice = diceForSeed(seed);
  return encodeFen({
    board: initialBoard(), turn: 'r', army: 'r', dice, dieIndex: 0,
    scores: zeroScores(), pools: emptyPools(), controllers: defaultControllers(), kingTakers: emptyKingTakers(), result: null,
  });
}

function dieAt(position: Position): number | null {
  return position.dice?.[position.dieIndex] ?? null;
}

function allowedTypes(face: number): readonly PieceType[] {
  return DIE_TYPES[face] ?? [];
}

function clonePosition(position: Position): Position {
  return {
    board: position.board.map(copyPiece),
    turn: position.turn,
    army: position.army,
    dice: position.dice ? [...position.dice] as [number, number] : null,
    dieIndex: position.dieIndex,
    scores: { ...position.scores },
    pools: { r: [...position.pools.r], g: [...position.pools.g], y: [...position.pools.y], b: [...position.pools.b] },
    controllers: { ...position.controllers },
    kingTakers: { ...position.kingTakers },
    result: position.result ? [...position.result] : null,
  };
}

function placeholder(color: Player): Piece { return { color, type: 'p', promoted: false }; }

export class IllegalMoveError extends CoreIllegalMoveError {
  constructor(uci: string) { super(uci); }
}

export class Game implements VariantGame<Player> {
  private position: Position;
  private history: HistoryEntry[] = [];

  constructor(fen = createSeededStartFen(0x43484154)) {
    this.position = decodeFen(fen);
  }

  get turn(): Player { return this.position.turn; }
  get activeArmy(): Player { return this.position.army; }
  get dice(): readonly [number, number] | null { return this.position.dice; }
  get dieIndex(): number { return this.position.dieIndex; }
  get scores(): Readonly<Record<Player, number>> { return this.position.scores; }
  get controllers(): Readonly<Record<Player, Player>> { return this.position.controllers; }
  get capturedPools(): Readonly<Record<Player, readonly PieceType[]>> { return this.position.pools; }
  get kingCaptureOwners(): Readonly<Record<Player, Player | null>> { return this.position.kingTakers; }

  fen(): string { return encodeFen(this.position); }
  pieceAt(square: number): Piece | null { return copyPiece(this.position.board[square] ?? null); }
  pieces(): Array<{ square: number; piece: Piece }> {
    return this.position.board.flatMap((piece, square) => piece ? [{ square, piece: { ...piece } }] : []);
  }
  hand(_color: Player): readonly string[] { return []; }

  /** Generate and append one auditable roll event when a new seat turn is waiting for dice. */
  prepareTurn(seed: number): VariantMoveRecord<Player> | null {
    if (this.isGameOver() || this.position.dice !== null) return null;
    const [first, second] = diceForSeed(seed);
    return this.move(`ROLL${first}${second}`);
  }

  legalUci(): string[] {
    if (this.isGameOver() || this.position.dice === null) return [];
    const face = dieAt(this.position);
    if (face === null) return [];
    const moves: string[] = [];
    for (let from = 0; from < 64; from++) {
      const piece = this.position.board[from];
      if (!piece || piece.color !== this.position.army || !allowedTypes(face).includes(piece.type)) continue;
      for (const to of this.movesFrom(from, piece, this.position.board)) moves.push(`${squareName(from)}${squareName(to)}`);
    }
    moves.push('pass');
    return moves;
  }

  move(uci: string): VariantMoveRecord<Player> {
    if (this.isGameOver()) throw new IllegalMoveError(uci);
    const roll = /^ROLL([1-6])([1-6])$/.exec(uci);
    if (roll) {
      if (this.position.dice !== null || this.position.dieIndex !== 0) throw new IllegalMoveError(uci);
      this.pushSnapshot();
      this.position.dice = [Number(roll[1]), Number(roll[2])];
      return this.record(uci, `Roll ${roll[1]} and ${roll[2]}`, this.position.turn, 'roll');
    }
    if (this.position.dice === null || !this.legalUci().includes(uci)) throw new IllegalMoveError(uci);
    const mover = this.position.turn;
    const army = this.position.army;
    const face = dieAt(this.position)!;
    if (uci === 'pass') {
      this.pushSnapshot();
      const record = this.record(uci, `Pass (${face})`, mover, 'pass');
      this.completeDieAction();
      record.fenAfter = this.fen();
      return record;
    }

    const from = parseSquare(uci.slice(0, 2));
    const to = parseSquare(uci.slice(2, 4));
    if (from === null || to === null) throw new IllegalMoveError(uci);
    const piece = this.position.board[from];
    if (!piece) throw new IllegalMoveError(uci);
    this.pushSnapshot();
    const movedBefore = { ...piece };
    const captured = this.position.board[to];
    this.position.board[from] = null;
    this.position.board[to] = piece;
    if (captured) this.capture(captured, mover);
    const promoted = this.promoteIfEarned(army, to, mover);
    if (movedBefore.type === 'k' && PLAYERS.some((player) => player !== army && KING_HOME[player] === to)) {
      const throneOwner = PLAYERS.find((player) => KING_HOME[player] === to)!;
      if (throneOwner === ALLY[army]) this.position.controllers[throneOwner] = mover;
    }
    const additional = movedBefore.type === 'b' ? this.boatTriumph(to, mover) : [];
    this.settleIfThirdKingCaptured();
    const name = `${army.toUpperCase()}: ${LETTER[movedBefore.type]}${squareName(from)}-${squareName(to)}${promoted ? `=${LETTER[piece.type] || 'P'}` : ''}${captured ? 'x' : ''}`;
    const primaryCapture = captured ?? additional[0] ?? null;
    const record = this.record(uci, name, mover, primaryCapture ? 'capture' : 'move', movedBefore, primaryCapture, to, additional);
    if (!this.isGameOver()) this.completeDieAction();
    record.fenAfter = this.fen();
    return record;
  }

  undo(): VariantMoveRecord<Player> | null {
    const entry = this.history.pop();
    if (!entry) return null;
    this.position = entry.before;
    return entry.record;
  }
  moves(): VariantMoveRecord<Player>[] { return this.history.map(({ record }) => record); }
  lastMove(): VariantMoveRecord<Player> | null { return this.history.at(-1)?.record ?? null; }

  status(): GameStatus<Player> {
    if (!this.position.result) return { kind: 'ongoing' };
    const scores = { ...this.position.scores };
    const winners = this.position.result;
    return {
      kind: 'points', reason: 'elimination', winners, winner: winners.length === 1 ? winners[0]! : null, scores,
    };
  }
  isGameOver(): boolean { return this.position.result !== null; }
  inCheck(): boolean { return false; }
  checkedKingSquare(): null { return null; }
  attackedSquares(color: Player): number[] {
    const attacked = new Set<number>();
    for (let from = 0; from < 64; from++) {
      const piece = this.position.board[from];
      if (!piece || this.position.controllers[piece.color] !== color) continue;
      for (const square of this.attacksFrom(from, piece, this.position.board)) attacked.add(square);
    }
    return [...attacked].sort((a, b) => a - b);
  }
  counting(): null { return null; }

  private pushSnapshot(): void { this.history.push({ record: undefined as never, before: clonePosition(this.position) }); }

  private record(
    uci: string,
    san: string,
    color: Player,
    action: 'move' | 'capture' | 'pass' | 'roll',
    piece = placeholder(color),
    captured: Piece | null = null,
    to = -1,
    captures: Piece[] = [],
  ): VariantMoveRecord<Player> {
    const record: VariantMoveRecord<Player> = {
      uci, san, color, piece, captured: captured ? { ...captured } : null, action,
      ...(captures.length ? { captures: captures.map((entry) => ({ ...entry })) } : {}), to, fenAfter: this.fen(),
    };
    this.history.at(-1)!.record = record;
    return record;
  }

  private completeDieAction(): void {
    this.position.dieIndex++;
    if (this.position.dieIndex < 2) return;
    const current = PLAYERS.indexOf(this.position.army);
    this.position.army = PLAYERS[(current + 1) % PLAYERS.length]!;
    this.position.turn = this.position.controllers[this.position.army];
    this.position.dice = null;
    this.position.dieIndex = 0;
  }

  private capture(piece: InternalPiece, captor: Player): void {
    this.position.scores[captor] += CAPTURE_POINTS[piece.type];
    this.position.pools[captor].push(piece.type);
    if (piece.type === 'k' && !piece.promoted) this.position.kingTakers[piece.color] = captor;
  }

  private settleIfThirdKingCaptured(): void {
    if (Object.values(this.position.kingTakers).filter((owner) => owner !== null).length < 3) return;
    for (const player of PLAYERS) {
      if (this.position.kingTakers[player] === null &&
        PLAYERS.filter((other) => other !== player).every((other) => this.position.kingTakers[other] === player)) this.position.scores[player] = 54;
    }
    const highScore = Math.max(...PLAYERS.map((player) => this.position.scores[player]));
    this.position.result = PLAYERS.filter((player) => this.position.scores[player] === highScore);
  }

  private promoteIfEarned(army: Player, square: number, owner: Player): boolean {
    const pawn = this.position.board[square];
    if (!pawn || pawn.type !== 'p') return false;
    const file = square % FILES;
    const rank = rankOf(square);
    let target: PieceType | null = null;
    if (army === 'r' && file === 0) target = (['b', 'h', 'e', 'k'] as const)[rank - 4] ?? null;
    if (army === 'g' && rank === 7) target = (['b', 'h', 'e', 'k'] as const)[file - 4] ?? null;
    if (army === 'y' && file === 7) target = (['b', 'h', 'e', 'k'] as const)[rank] ?? null;
    if (army === 'b' && rank === 0) target = (['b', 'h', 'e', 'k'] as const)[file] ?? null;
    if (!target) return false;
    const available = this.position.pools[owner].indexOf(target);
    if (available < 0) return false;
    this.position.pools[owner].splice(available, 1);
    pawn.type = target;
    pawn.promoted = true;
    return true;
  }

  private boatTriumph(destination: number, owner: Player): Piece[] {
    const file = destination % FILES;
    const rank = rankOf(destination);
    for (let left = file - 1; left <= file; left++) for (let bottom = rank - 1; bottom <= rank; bottom++) {
      if (!isOnBoard(left, bottom) || !isOnBoard(left + 1, bottom + 1)) continue;
      const squares = [squareAt(left, bottom), squareAt(left + 1, bottom), squareAt(left, bottom + 1), squareAt(left + 1, bottom + 1)];
      const boats = squares.map((square) => ({ square, piece: this.position.board[square] })).filter((cell) => cell.piece?.type === 'b');
      if (boats.length !== 4 || new Set(boats.map(({ piece }) => piece!.color)).size !== 4) continue;
      const removed: Piece[] = [];
      for (const { square, piece } of boats) {
        if (square === destination || !piece) continue;
        removed.push({ ...piece });
        this.position.board[square] = null;
        this.capture(piece, owner);
      }
      return removed;
    }
    return [];
  }

  private movesFrom(from: number, piece: InternalPiece, board: Array<InternalPiece | null>): number[] {
    const result: number[] = [];
    const push = (file: number, rank: number): boolean => {
      if (!isOnBoard(file, rank)) return false;
      const to = squareAt(file, rank);
      const target = board[to];
      if (target?.color === piece.color) return false;
      result.push(to);
      return target === null;
    };
    const file = from % FILES;
    const rank = rankOf(from);
    if (piece.type === 'p') {
      const [dx, dy] = FORWARD[piece.color];
      const nextFile = file + dx;
      const nextRank = rank + dy;
      if (isOnBoard(nextFile, nextRank) && board[squareAt(nextFile, nextRank)] === null) result.push(squareAt(nextFile, nextRank));
      for (const side of [-1, 1]) {
        const captureFile = nextFile + (dx === 0 ? side : 0);
        const captureRank = nextRank + (dy === 0 ? side : 0);
        if (!isOnBoard(captureFile, captureRank)) continue;
        const target = board[squareAt(captureFile, captureRank)];
        if (target && target.color !== piece.color) result.push(squareAt(captureFile, captureRank));
      }
      return result;
    }
    if (piece.type === 'k') {
      for (const [dx, dy] of KING_STEPS) push(file + dx, rank + dy);
    } else if (piece.type === 'h') {
      for (const [dx, dy] of KNIGHT_STEPS) push(file + dx, rank + dy);
    } else if (piece.type === 'b') {
      for (const [dx, dy] of DIAGONAL) push(file + 2 * dx, rank + 2 * dy);
    } else if (piece.type === 'e') {
      for (const [dx, dy] of ORTHOGONAL) {
        for (let distance = 1; distance < 8; distance++) {
          const keepSliding = push(file + distance * dx, rank + distance * dy);
          if (!keepSliding) break;
        }
      }
    }
    return result;
  }

  private attacksFrom(from: number, piece: InternalPiece, board: Array<InternalPiece | null>): number[] {
    const file = from % FILES;
    const rank = rankOf(from);
    const attacked: number[] = [];
    const add = (x: number, y: number): boolean => {
      if (!isOnBoard(x, y)) return false;
      const square = squareAt(x, y);
      attacked.push(square);
      return board[square] === null;
    };
    if (piece.type === 'p') {
      const [dx, dy] = FORWARD[piece.color];
      for (const side of [-1, 1]) {
        const x = file + dx + (dx === 0 ? side : 0);
        const y = rank + dy + (dy === 0 ? side : 0);
        if (isOnBoard(x, y)) attacked.push(squareAt(x, y));
      }
      return attacked;
    }
    const steps = piece.type === 'k' ? KING_STEPS : piece.type === 'h' ? KNIGHT_STEPS : piece.type === 'b' ? DIAGONAL.map(([dx, dy]) => [2 * dx, 2 * dy] as const) : null;
    if (steps) {
      for (const [dx, dy] of steps) add(file + dx, rank + dy);
      return attacked;
    }
    if (piece.type === 'e') for (const [dx, dy] of ORTHOGONAL) {
      for (let distance = 1; distance < 8; distance++) if (!add(file + distance * dx, rank + distance * dy)) break;
    }
    return attacked;
  }
}

const START_FEN = createSeededStartFen(0x43484154);

export const chaturaji = {
  id: 'chaturaji',
  files: FILES,
  ranks: 8,
  startFen: START_FEN,
  pieceTypes: PIECE_TYPES,
  players: PLAYERS,
  hasHands: false,
  createGame: (fen?: string) => new Game(fen),
} satisfies Variant<Game>;

export { parseSquare, squareName };
