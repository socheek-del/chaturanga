import {
  IllegalMoveError, type Variant, type VariantGame, type VariantMoveRecord,
} from '@chaturanga/rules-core';
import {
  BOARD_SIZE, FILES, PLAYERS, RANKS, PROMOTIONS, diagonalTouchesWall, fileOf, forward, hasWallBetween,
  initialPieces, isPlayable, kingStart, nextSeat, parseSquare, pawnStartSquares, rankOf, rightFortress,
  rookStartSquares, sameTeam, squareAt, squareName, teamOf,
} from './geometry';
import { colorLetter, parseFen, serializeFen, type FortressPiece, type Position } from './fen';
import type { FortressStatus, Move, Piece, PieceType, Seat } from './types';

export const PIECE_TYPES: readonly PieceType[] = ['p', 'n', 'b', 'r', 'q', 'k'];
const HAND_START: readonly PieceType[] = ['b', 'n', 'r'];
const TYPE_LETTERS: Record<PieceType, string> = { p: '', n: 'N', b: 'B', r: 'R', q: 'Q', k: 'K' };
const ALL_CASTLE_RIGHTS = new Set(PLAYERS.flatMap((seat) => [`${seat}K`, `${seat}L`, `${seat}R`]));
const ORTHOGONAL: readonly (readonly [number, number])[] = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIAGONAL: readonly (readonly [number, number])[] = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const KING_STEPS = [...ORTHOGONAL, ...DIAGONAL];
const KNIGHT_OFFSETS: readonly (readonly [number, number])[] = [
  [2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2],
];

type InternalPiece = FortressPiece;

interface Snapshot {
  board: Array<InternalPiece | null>;
  turn: Seat;
  enPassant: number | null;
  enPassantPawn: Seat | null;
  eliminated: Set<Seat>;
  result: 'draw' | 'win' | null;
  winner: Seat | null;
  hands: Record<Seat, PieceType[]>;
  castleRights: Set<string>;
}

interface ParsedMove {
  type: 'place' | 'board';
  pieceType?: PieceType;
  move?: Move;
}

export class FortressIllegalMoveError extends IllegalMoveError {}

const clonePiece = (piece: InternalPiece | null): InternalPiece | null => piece ? { ...piece } : null;
const cloneHands = (hands: Record<Seat, PieceType[]>): Record<Seat, PieceType[]> => ({
  r: [...hands.r], b: [...hands.b], w: [...hands.w], k: [...hands.k],
});
const stepSquare = (square: number, dx: number, dy: number): number | null => {
  const file = fileOf(square) + dx;
  const rank = rankOf(square) + dy;
  if (file < 0 || file >= FILES || rank < 0 || rank >= RANKS) return null;
  const next = squareAt(file, rank);
  return isPlayable(next) ? next : null;
};
const seatColor = (seat: Seat): string => colorLetter(seat);
const pieceCopy = (piece: InternalPiece): Piece => ({ color: piece.color, type: piece.type, promoted: piece.promoted });
const cloneRecordPiece = (piece: InternalPiece | null): Piece | null => piece ? pieceCopy(piece) : null;

function initialPosition(): Position {
  const board: Array<InternalPiece | null> = Array<InternalPiece | null>(BOARD_SIZE).fill(null);
  for (const { square, type, color } of initialPieces()) board[square] = { color, type, promoted: false, moved: false };
  const hands: Record<Seat, PieceType[]> = {
    r: [...HAND_START], b: [...HAND_START], w: [...HAND_START], k: [...HAND_START],
  };
  return {
    board,
    turn: 'r',
    enPassant: null,
    enPassantPawn: null,
    eliminated: new Set(),
    result: null,
    winner: null,
    hands,
    castleRights: new Set(ALL_CASTLE_RIGHTS),
  };
}

const makeInitialFen = (): string => serializeFen(initialPosition());
export const START_FEN = makeInitialFen();

function parseMove(uci: string): ParsedMove | null {
  const placement = /^([NBR])@([a-p](?:1[0-6]|[1-9]))$/.exec(uci);
  if (placement) {
    const square = parseSquare(placement[2]!);
    if (square === null) return null;
    return { type: 'place', pieceType: placement[1]!.toLowerCase() as PieceType, move: {
      from: -1, to: square, promotion: null, castle: false, enPassant: false,
    } };
  }
  const match = /^([a-p](?:1[0-6]|[1-9]))([a-p](?:1[0-6]|[1-9]))([qrbn])?$/.exec(uci);
  if (!match) return null;
  const from = parseSquare(match[1]!);
  const to = parseSquare(match[2]!);
  if (from === null || to === null) return null;
  return { type: 'board', move: { from, to, promotion: (match[3] as PieceType | undefined) ?? null, castle: false, enPassant: false } };
}

function encodeMove(move: Move): string {
  return `${squareName(move.from)}${squareName(move.to)}${move.promotion ?? ''}`;
}

function encodePlacement(type: PieceType, square: number): string {
  return `${type.toUpperCase()}@${squareName(square)}`;
}

export class Game implements VariantGame<Seat> {
  private board: Array<InternalPiece | null>;
  private turnValue: Seat;
  private enPassantValue: number | null;
  private enPassantPawnValue: Seat | null;
  private eliminated = new Set<Seat>();
  private result: 'draw' | 'win' | null = null;
  private winner: Seat | null = null;
  private hands: Record<Seat, PieceType[]>;
  private castleRights: Set<string>;
  private history: VariantMoveRecord<Seat>[] = [];
  private undoStack: Snapshot[] = [];

  constructor(fen?: string) {
    const position = fen === undefined ? initialPosition() : parseFen(fen);
    this.board = position.board.map(clonePiece);
    this.turnValue = position.turn;
    this.enPassantValue = position.enPassant;
    this.enPassantPawnValue = position.enPassantPawn;
    this.eliminated = new Set(position.eliminated);
    this.result = position.result;
    this.winner = position.winner;
    this.hands = cloneHands(position.hands);
    this.castleRights = new Set(position.castleRights);
    if (!this.isSetupPhase() && !this.isGameOver()) this.advanceToPlayableSeat(this.turnValue, null);
  }

  get turn(): Seat {
    return this.turnValue;
  }

  fen(): string {
    return serializeFen({
      board: this.board,
      turn: this.turnValue,
      enPassant: this.enPassantValue,
      enPassantPawn: this.enPassantPawnValue,
      eliminated: this.eliminated,
      result: this.result,
      winner: this.winner,
      hands: this.hands,
      castleRights: this.castleRights,
    });
  }

  pieceAt(square: number): Piece | null {
    const piece = this.board[square];
    return piece ? pieceCopy(piece) : null;
  }

  pieces(): Array<{ square: number; piece: Piece }> {
    return this.board.flatMap((piece, square) => piece ? [{ square, piece: pieceCopy(piece) }] : []);
  }

  hand(seat: Seat): readonly string[] {
    return [...this.hands[seat]];
  }

  isSetupPhase(): boolean {
    return PLAYERS.some((seat) => this.hands[seat].length > 0);
  }

  isEliminated(seat: Seat): boolean {
    return this.eliminated.has(seat);
  }

  legalUci(): string[] {
    if (this.isGameOver()) return [];
    if (this.isSetupPhase()) return this.legalPlacements(this.turnValue).map(({ type, square }) => encodePlacement(type, square));
    return this.legalMovesFor(this.turnValue).map(encodeMove);
  }

  move(uci: string): VariantMoveRecord<Seat> {
    if (this.isGameOver()) throw new FortressIllegalMoveError(`The game is over: ${uci}`);
    const request = parseMove(uci);
    if (!request) throw new FortressIllegalMoveError(`Illegal move: ${uci}`);
    const seat = this.turnValue;
    if (request.type === 'place') {
      if (!this.legalPlacements(seat).some(({ type, square }) => encodePlacement(type, square) === uci)) {
        throw new FortressIllegalMoveError(`Illegal move: ${uci}`);
      }
    } else {
      const legalMove = this.legalMovesFor(seat).find((candidate) => encodeMove(candidate) === uci);
      if (!legalMove) throw new FortressIllegalMoveError(`Illegal move: ${uci}`);
      request.move = legalMove;
    }
    this.undoStack.push(this.snapshot());
    const move = request.move!;
    if (request.type === 'place') {
      const type = request.pieceType!;
      const handIndex = this.hands[seat].indexOf(type);
      this.hands[seat].splice(handIndex, 1);
      this.board[move.to] = { color: seat, type, promoted: false, moved: false };
      this.advanceSetupSeat(seat);
      const record = this.makeRecord(uci, seat, { color: seat, type, promoted: false }, null, move.to);
      this.history.push(record);
      return record;
    }

    const piece = this.board[move.from]!;
    const pieceBefore = pieceCopy(piece);
    const capturedSquare = move.enPassant ? this.enPassantCaptureSquare(move.to) : move.to;
    const captured = capturedSquare === null ? null : this.board[capturedSquare] ?? null;
    this.applyBoardMove(move, seat);
    this.advanceToPlayableSeat(nextSeat(seat), seat);
    const san = this.san(move, pieceBefore, captured, seat);
    const record = this.makeRecord(san, seat, pieceBefore, cloneRecordPiece(captured), move.to, encodeMove(move), san);
    this.history.push(record);
    return record;
  }

  undo(): VariantMoveRecord<Seat> | null {
    const snapshot = this.undoStack.pop();
    if (!snapshot) return null;
    const removed = this.history.pop() ?? null;
    this.restore(snapshot);
    return removed;
  }

  moves(): VariantMoveRecord<Seat>[] {
    return [...this.history];
  }

  lastMove(): VariantMoveRecord<Seat> | null {
    return this.history.at(-1) ?? null;
  }

  status(): FortressStatus {
    if (this.result === 'draw') return { kind: 'stalemate' };
    if (this.result === 'win' && this.winner) return { kind: 'checkmate', winner: this.winner };
    return { kind: 'ongoing' };
  }

  isGameOver(): boolean {
    return this.result !== null;
  }

  inCheck(): boolean {
    return !this.isSetupPhase() && this.isInCheck(this.turnValue, this.board);
  }

  checkedKingSquare(): number | null {
    if (!this.inCheck()) return null;
    return this.kingSquare(this.turnValue, this.board);
  }

  attackedSquares(seat: Seat): number[] {
    if (this.eliminated.has(seat)) return [];
    const squares = new Set<number>();
    for (let from = 0; from < this.board.length; from++) {
      const piece = this.board[from];
      if (!piece || piece.color !== seat) continue;
      for (const move of this.movesFrom(from, piece, this.board, true)) squares.add(move.to);
    }
    return [...squares].sort((a, b) => a - b);
  }

  counting(): null {
    return null;
  }

  private snapshot(): Snapshot {
    return {
      board: this.board.map(clonePiece),
      turn: this.turnValue,
      enPassant: this.enPassantValue,
      enPassantPawn: this.enPassantPawnValue,
      eliminated: new Set(this.eliminated),
      result: this.result,
      winner: this.winner,
      hands: cloneHands(this.hands),
      castleRights: new Set(this.castleRights),
    };
  }

  private restore(snapshot: Snapshot): void {
    this.board = snapshot.board.map(clonePiece);
    this.turnValue = snapshot.turn;
    this.enPassantValue = snapshot.enPassant;
    this.enPassantPawnValue = snapshot.enPassantPawn;
    this.eliminated = new Set(snapshot.eliminated);
    this.result = snapshot.result;
    this.winner = snapshot.winner;
    this.hands = cloneHands(snapshot.hands);
    this.castleRights = new Set(snapshot.castleRights);
  }

  private makeRecord(
    uci: string,
    seat: Seat,
    piece: Piece,
    captured: Piece | null,
    to: number,
    recordUci = uci,
    san = uci,
  ): VariantMoveRecord<Seat> {
    return { uci: recordUci, san, color: seat, piece, captured, to, fenAfter: this.fen() };
  }

  private advanceSetupSeat(placedBy: Seat): void {
    if (this.hands[placedBy].length > 0) {
      this.turnValue = placedBy;
      return;
    }
    let candidate = nextSeat(placedBy);
    for (let i = 0; i < PLAYERS.length; i++) {
      if (this.hands[candidate].length > 0) {
        this.turnValue = candidate;
        return;
      }
      candidate = nextSeat(candidate);
    }
    // Setup is complete. After the last seat places its reserve, the first move is Red's.
    this.turnValue = 'r';
  }

  private legalPlacements(seat: Seat): Array<{ type: PieceType; square: number }> {
    if (this.eliminated.has(seat)) return [];
    const destinations = rightFortress(seat).filter((square) => this.board[square] === null);
    return this.hands[seat].flatMap((type) => destinations.map((square) => ({ type, square })));
  }

  private advanceToPlayableSeat(candidate: Seat, lastMover: Seat | null): void {
    if (this.isSetupPhase() || this.result) {
      this.turnValue = candidate;
      return;
    }
    for (let i = 0; i < PLAYERS.length; i++) {
      if (this.eliminated.has(candidate) || !this.kingSquare(candidate, this.board)) {
        this.enPassantValue = null;
        this.enPassantPawnValue = null;
        if (!this.eliminated.has(candidate)) this.eliminate(candidate);
        candidate = nextSeat(candidate);
        continue;
      }
      const legal = this.legalMovesFor(candidate);
      if (legal.length > 0) {
        this.turnValue = candidate;
        if (lastMover) this.finishIfTeamWon(lastMover);
        return;
      }
      if (!this.isInCheck(candidate, this.board)) {
        this.enPassantValue = null;
        this.enPassantPawnValue = null;
        this.result = 'draw';
        this.winner = null;
        this.turnValue = candidate;
        return;
      }
      this.eliminate(candidate);
      if (lastMover) this.finishIfTeamWon(lastMover);
      if (this.result) return;
      this.enPassantValue = null;
      this.enPassantPawnValue = null;
      candidate = nextSeat(candidate);
    }
    if (!this.result) {
      const survivors = PLAYERS.filter((seat) => !this.eliminated.has(seat));
      if (survivors.length === 0) {
        this.result = 'draw';
        this.winner = null;
      } else if (lastMover) this.finishIfTeamWon(lastMover);
      else this.turnValue = survivors[0]!;
    }
  }

  private finishIfTeamWon(lastMover: Seat): void {
    const opposing = PLAYERS.filter((seat) => teamOf(seat) !== teamOf(lastMover));
    if (!opposing.every((seat) => this.eliminated.has(seat))) return;
    this.result = 'win';
    this.winner = PLAYERS.find((seat) => teamOf(seat) === teamOf(lastMover) && !this.eliminated.has(seat)) ?? lastMover;
  }

  private eliminate(seat: Seat): void {
    this.eliminated.add(seat);
    this.hands[seat] = [];
    for (let square = 0; square < this.board.length; square++) {
      if (this.board[square]?.color === seat) this.board[square] = null;
    }
    for (const key of [...this.castleRights]) if (key.startsWith(seat)) this.castleRights.delete(key);
  }

  private legalMovesFor(seat: Seat): Move[] {
    if (this.eliminated.has(seat) || this.isSetupPhase() || this.result) return [];
    const moves: Move[] = [];
    for (let from = 0; from < this.board.length; from++) {
      const piece = this.board[from];
      if (piece?.color !== seat) continue;
      for (const move of this.movesFrom(from, piece, this.board, false)) {
        if (!this.leavesKingSafe(seat, move, this.board)) continue;
        moves.push(move);
      }
    }
    for (const move of this.castlingMoves(seat, this.board)) {
      if (this.leavesKingSafe(seat, move, this.board)) moves.push(move);
    }
    return moves;
  }

  private movesFrom(from: number, piece: InternalPiece, board: Array<InternalPiece | null>, attacksOnly: boolean): Move[] {
    switch (piece.type) {
      case 'p': return this.pawnMoves(from, piece, board, attacksOnly);
      case 'n': return this.knightMoves(from, piece, board, attacksOnly);
      case 'b': return this.slidingMoves(from, piece, board, DIAGONAL, attacksOnly);
      case 'r': return this.slidingMoves(from, piece, board, ORTHOGONAL, attacksOnly);
      case 'q': return this.slidingMoves(from, piece, board, [...ORTHOGONAL, ...DIAGONAL], attacksOnly);
      case 'k': return this.kingMoves(from, piece, board, attacksOnly);
    }
  }

  private pawnMoves(from: number, piece: InternalPiece, board: Array<InternalPiece | null>, attacksOnly: boolean): Move[] {
    const result: Move[] = [];
    const [dx, dy] = forward(piece.color);
    for (const side of [-1, 1]) {
      // The two diagonal directions are perpendicular to the pawn's forward axis.
      const diagonal = this.pawnDiagonalTarget(from, piece.color, side);
      if (diagonal === null || diagonalTouchesWall(from, diagonal)) continue;
      if (attacksOnly) {
        result.push({ from, to: diagonal, promotion: null, castle: false, enPassant: false });
        continue;
      }
      const target = board[diagonal];
      if (target && !sameTeam(piece.color, target.color) && target.type !== 'k') {
        result.push(...this.pawnMoveVariants(from, diagonal, piece.color));
      } else if (!target && diagonal === this.enPassantValue) {
        const captureSquare = this.enPassantCaptureSquare(diagonal);
        const captured = captureSquare === null ? null : board[captureSquare];
        if (captured?.type === 'p' && captured.color === this.enPassantPawnValue && !sameTeam(piece.color, captured.color)) {
          result.push({ from, to: diagonal, promotion: null, castle: false, enPassant: true });
        }
      }
    }
    if (attacksOnly) return result;
    const one = stepSquare(from, dx, dy);
    if (one === null || board[one] || hasWallBetween(from, one)) return result;
    result.push(...this.pawnMoveVariants(from, one, piece.color));
    const starts = pawnStartSquares(piece.color);
    const two = stepSquare(one, dx, dy);
    if (starts.includes(from) && two !== null && !board[two] && !hasWallBetween(one, two)) {
      result.push({ from, to: two, promotion: null, castle: false, enPassant: false });
    }
    return result;
  }

  private pawnDiagonalTarget(from: number, seat: Seat, side: number): number | null {
    switch (seat) {
      case 'r': return stepSquare(from, side, -1);
      case 'b': return stepSquare(from, -1, side);
      case 'w': return stepSquare(from, side, 1);
      case 'k': return stepSquare(from, 1, side);
    }
  }

  private pawnMoveVariants(from: number, to: number, seat: Seat): Move[] {
    return this.isPromotionSquare(seat, to)
      ? PROMOTIONS.map((promotion) => ({ from, to, promotion, castle: false, enPassant: false }))
      : [{ from, to, promotion: null, castle: false, enPassant: false }];
  }

  private isPromotionSquare(seat: Seat, square: number): boolean {
    const home: Record<Seat, (target: number) => boolean> = {
      r: (target) => rankOf(target) === 13 && fileOf(target) >= 4 && fileOf(target) <= 11,
      b: (target) => fileOf(target) === 13 && rankOf(target) >= 4 && rankOf(target) <= 11,
      w: (target) => rankOf(target) === 2 && fileOf(target) >= 4 && fileOf(target) <= 11,
      k: (target) => fileOf(target) === 2 && rankOf(target) >= 4 && rankOf(target) <= 11,
    };
    return PLAYERS.some((other) => other !== seat && home[other](square));
  }

  private knightMoves(from: number, piece: InternalPiece, board: Array<InternalPiece | null>, attacksOnly: boolean): Move[] {
    const result: Move[] = [];
    for (const [dx, dy] of KNIGHT_OFFSETS) {
      const to = stepSquare(from, dx, dy);
      if (to === null || !this.knightRouteAllowed(from, dx, dy)) continue;
      if (this.targetAllowed(piece.color, to, board, attacksOnly)) result.push({ from, to, promotion: null, castle: false, enPassant: false });
    }
    return result;
  }

  private knightRouteAllowed(from: number, dx: number, dy: number): boolean {
    const sx = Math.sign(dx);
    const sy = Math.sign(dy);
    const orthFirst = Math.abs(dx) === 2 ? [sx, 0] as const : [0, sy] as const;
    const diag = Math.abs(dx) === 2 ? [sx, sy] as const : [sx, sy] as const;
    const first = stepSquare(from, orthFirst[0], orthFirst[1]);
    const firstTo = first === null ? null : stepSquare(first, diag[0], diag[1]);
    const firstOk = first !== null && firstTo !== null && !hasWallBetween(from, first) &&
      !diagonalTouchesWall(first, firstTo);
    const diagFirst = stepSquare(from, diag[0], diag[1]);
    const second = diagFirst === null ? null : stepSquare(diagFirst, orthFirst[0], orthFirst[1]);
    const secondOk = diagFirst !== null && second !== null && !diagonalTouchesWall(from, diagFirst) && !hasWallBetween(diagFirst, second);
    return firstOk || secondOk;
  }

  private kingMoves(from: number, piece: InternalPiece, board: Array<InternalPiece | null>, attacksOnly: boolean): Move[] {
    const result: Move[] = [];
    for (const [dx, dy] of KING_STEPS) {
      const to = stepSquare(from, dx, dy);
      if (to === null || (dx === 0 || dy === 0 ? hasWallBetween(from, to) : diagonalTouchesWall(from, to))) continue;
      if (this.targetAllowed(piece.color, to, board, attacksOnly)) result.push({ from, to, promotion: null, castle: false, enPassant: false });
    }
    return result;
  }

  private slidingMoves(
    from: number,
    piece: InternalPiece,
    board: Array<InternalPiece | null>,
    directions: readonly (readonly [number, number])[],
    attacksOnly: boolean,
  ): Move[] {
    const result: Move[] = [];
    for (const [dx, dy] of directions) {
      let current = from;
      while (true) {
        const to = stepSquare(current, dx, dy);
        if (to === null || (dx === 0 || dy === 0 ? hasWallBetween(current, to) : diagonalTouchesWall(current, to))) break;
        const target = board[to];
        if (!target) {
          result.push({ from, to, promotion: null, castle: false, enPassant: false });
          current = to;
          continue;
        }
        if (attacksOnly || (!sameTeam(piece.color, target.color) && target.type !== 'k')) {
          result.push({ from, to, promotion: null, castle: false, enPassant: false });
        }
        break;
      }
    }
    return result;
  }

  private targetAllowed(seat: Seat, to: number, board: Array<InternalPiece | null>, attacksOnly: boolean): boolean {
    const target = board[to];
    if (!target || attacksOnly) return true;
    return !sameTeam(seat, target.color) && target.type !== 'k';
  }

  private castlingMoves(seat: Seat, board: Array<InternalPiece | null>): Move[] {
    if (!this.castleRights.has(`${seat}K`) || this.isInCheck(seat, board)) return [];
    const from = kingStart(seat);
    const king = board[from];
    if (king?.color !== seat || king.type !== 'k') return [];
    const rooks = rookStartSquares(seat);
    const result: Move[] = [];
    for (const flank of ['L', 'R'] as const) {
      if (!this.castleRights.has(`${seat}${flank}`)) continue;
      const rookFrom = rooks[flank === 'L' ? 'left' : 'right'];
      const rook = board[rookFrom];
      if (rook?.color !== seat || rook.type !== 'r') continue;
      const dx = Math.sign(fileOf(rookFrom) - fileOf(from));
      const dy = Math.sign(rankOf(rookFrom) - rankOf(from));
      const to = stepSquare(stepSquare(from, dx, dy) ?? -1, dx, dy);
      if (to === null) continue;
      let current = from;
      let clear = true;
      while (current !== rookFrom) {
        const next = stepSquare(current, dx, dy);
        if (next === null || hasWallBetween(current, next) || (next !== rookFrom && board[next])) {
          clear = false;
          break;
        }
        if (next !== rookFrom && this.isSquareAttacked(next, seat, board)) {
          clear = false;
          break;
        }
        current = next;
      }
      if (clear && !this.isSquareAttacked(to, seat, board)) result.push({ from, to, promotion: null, castle: true, enPassant: false });
    }
    return result;
  }

  private leavesKingSafe(seat: Seat, move: Move, board: Array<InternalPiece | null>): boolean {
    const copy = board.map(clonePiece);
    this.applyMoveToBoard(copy, move, seat, false);
    return !this.isInCheck(seat, copy);
  }

  private applyBoardMove(move: Move, seat: Seat): void {
    this.applyMoveToBoard(this.board, move, seat, true);
  }

  private applyMoveToBoard(board: Array<InternalPiece | null>, move: Move, seat: Seat, updateRights: boolean): void {
    const piece = board[move.from];
    if (!piece) return;
    const originalType = piece.type;
    const capturedSquare = move.enPassant ? this.enPassantCaptureSquare(move.to) : move.to;
    const captured = capturedSquare === null ? null : board[capturedSquare];
    if (updateRights) {
      if (originalType === 'k') {
        for (const right of ['K', 'L', 'R']) this.castleRights.delete(`${seat}${right}`);
      }
      if (originalType === 'r') this.clearRookRight(seat, move.from);
      if (captured?.type === 'r') this.clearRookRight(captured.color, capturedSquare!);
    }
    board[move.from] = null;
    if (capturedSquare !== null) board[capturedSquare] = null;
    piece.moved = true;
    if (move.promotion) piece.type = move.promotion;
    board[move.to] = piece;
    if (move.castle) {
      const flank = this.castleFlankFromMove(seat, move);
      const rookFrom = rookStartSquares(seat)[flank === 'L' ? 'left' : 'right'];
      const dx = Math.sign(fileOf(rookFrom) - fileOf(move.from));
      const dy = Math.sign(rankOf(rookFrom) - rankOf(move.from));
      const rookTo = stepSquare(move.from, dx, dy)!;
      const rook = board[rookFrom];
      board[rookFrom] = null;
      if (rook) {
        rook.moved = true;
        board[rookTo] = rook;
      }
      if (updateRights) this.castleRights.delete(`${seat}${flank}`);
    }
    if (updateRights) {
      this.enPassantValue = null;
      this.enPassantPawnValue = null;
      if (originalType === 'p' && this.isDoublePawnMove(move, seat)) {
        const [dx, dy] = forward(seat);
        this.enPassantValue = stepSquare(move.from, dx, dy);
        this.enPassantPawnValue = seat;
      }
    }
  }

  private castleFlankFromMove(seat: Seat, move: Move): 'L' | 'R' {
    const rooks = rookStartSquares(seat);
    for (const flank of ['L', 'R'] as const) {
      const rookFrom = rooks[flank === 'L' ? 'left' : 'right'];
      const dx = Math.sign(fileOf(rookFrom) - fileOf(move.from));
      const dy = Math.sign(rankOf(rookFrom) - rankOf(move.from));
      const first = stepSquare(move.from, dx, dy);
      const second = first === null ? null : stepSquare(first, dx, dy);
      if (second === move.to) return flank;
    }
    return 'L';
  }

  private clearRookRight(seat: Seat, square: number): void {
    const starts = rookStartSquares(seat);
    if (square === starts.left) this.castleRights.delete(`${seat}L`);
    if (square === starts.right) this.castleRights.delete(`${seat}R`);
  }

  private isDoublePawnMove(move: Move, seat: Seat): boolean {
    const [dx, dy] = forward(seat);
    return fileOf(move.to) - fileOf(move.from) === 2 * dx && rankOf(move.to) - rankOf(move.from) === 2 * dy;
  }

  private enPassantCaptureSquare(target: number): number | null {
    if (this.enPassantPawnValue === null) return null;
    const [dx, dy] = forward(this.enPassantPawnValue);
    return stepSquare(target, dx, dy);
  }

  private isInCheck(seat: Seat, board: Array<InternalPiece | null>): boolean {
    const king = this.kingSquare(seat, board);
    return king !== null && this.isSquareAttacked(king, seat, board);
  }

  private kingSquare(seat: Seat, board: Array<InternalPiece | null>): number | null {
    const found = board.findIndex((piece) => piece?.color === seat && piece.type === 'k');
    return found < 0 ? null : found;
  }

  private isSquareAttacked(square: number, defender: Seat, board: Array<InternalPiece | null>): boolean {
    for (const seat of PLAYERS) {
      if (sameTeam(seat, defender) || this.eliminated.has(seat)) continue;
      for (let from = 0; from < board.length; from++) {
        const piece = board[from];
        if (piece?.color !== seat) continue;
        if (this.movesFrom(from, piece, board, true).some((move) => move.to === square)) return true;
      }
    }
    return false;
  }

  private san(move: Move, piece: Piece, captured: InternalPiece | null, seat: Seat): string {
    const prefix = TYPE_LETTERS[piece.type] || (piece.type === 'p' ? '' : piece.type.toUpperCase());
    const suffix = move.promotion ? `=${move.promotion.toUpperCase()}` : '';
    const capture = captured || move.enPassant ? 'x' : '-';
    const target = squareName(move.to);
    const check = this.isGameOver() && this.result === 'win' ? '#' : this.inCheck() ? '+' : '';
    return `${seatColor(seat)}:${prefix}${squareName(move.from)}${capture}${target}${suffix}${move.castle ? 'O-O' : ''}${check}`;
  }
}

export const fortress = {
  id: 'fortress',
  files: FILES,
  ranks: RANKS,
  isPlayable,
  startFen: START_FEN,
  pieceTypes: PIECE_TYPES,
  players: PLAYERS,
  hasHands: true,
  hasSetupPhase: true,
  createGame: (fen?: string) => new Game(fen),
} satisfies Variant<Game>;
