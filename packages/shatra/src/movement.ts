import type { Color, Square } from '@chaturanga/rules-core';
import {
  BOARD_SIZE,
  FILES,
  RANKS,
  deploymentFields,
  deploymentSide,
  fileOf,
  fortressOwner,
  isFortress,
  isGate,
  isPlayable,
  opposite,
  promotionTarget,
  rankOf,
  reserveShatras,
  squareName,
  type Board,
  type Piece,
  type Position,
} from './position';

type Offset = readonly [file: number, rank: number];
export interface Move {
  from: Square;
  to: Square;
  /** Every landing square, in order; a normal move contains just its destination. */
  path: Square[];
  captured: Square[];
  promotion: boolean;
  deployment: boolean;
}

const directions: readonly Offset[] = [
  [-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1],
];
const diagonal: readonly Offset[] = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
const orthogonal: readonly Offset[] = [[0, -1], [-1, 0], [1, 0], [0, 1]];

export const moveUci = (move: Move): string =>
  squareName(move.from) + move.path.map(squareName).join('') + (move.promotion ? 'b' : '');

export function shift(from: Square, [dx, dy]: Offset): Square | null {
  const file = fileOf(from) + dx;
  const rank = rankOf(from) + dy;
  if (file < 0 || file >= FILES || rank < 0 || rank >= RANKS) return null;
  const to = rank * FILES + file;
  return isPlayable(to) ? to : null;
}

function canLand(board: Board, piece: Piece, from: Square, to: Square): boolean {
  const owner = fortressOwner(to);
  if (owner !== piece.color) return true;
  if (piece.type === 's' && !isFortress(from)) return false;
  if ((piece.type === 'k' || piece.type === 'b') && reserveShatras(board, piece.color) > 0 && !isFortress(from)) return false;
  return true;
}

function shatraLockAllows(position: Position, piece: Piece, from: Square, to: Square): boolean {
  if (piece.type !== 's') return true;
  const lock = position.locks[piece.color];
  if (!lock || lock.square !== from || rankOf(to) !== rankOf(from)) return true;
  const direction = Math.sign(fileOf(to) - fileOf(from));
  return direction !== -lock.direction;
}

function quietMoves(position: Position, from: Square, piece: Piece): Move[] {
  const { board } = position;
  const moves: Move[] = [];
  const add = (to: Square, deployment = false) => {
    if (board[to] !== null || !canLand(board, piece, from, to)) return;
    if (!deployment && !shatraLockAllows(position, piece, from, to)) return;
    const promotion = piece.type === 's' && promotionTarget(to, piece.color);
    moves.push({ from, to, path: [to], captured: [], promotion, deployment });
  };

  if (piece.type === 'k') {
    for (const direction of directions) {
      const to = shift(from, direction);
      if (to !== null) add(to);
    }
  } else if (piece.type === 's') {
    const forward = piece.color === 'w' ? 1 : -1;
    const steps: readonly Offset[] = [[0, forward], [-1, forward], [1, forward], [-1, 0], [1, 0]];
    const hasInitialReserve = reserveShatras(board, piece.color) > 0;
    const isOwnFortress = isFortress(from) && fortressOwner(from) === piece.color;
    if (!isOwnFortress || !hasInitialReserve) {
      for (const direction of steps) {
        const to = shift(from, direction);
        if (to !== null) add(to);
      }
    }
  } else {
    for (const [dx, dy] of directions) {
      for (let to = shift(from, [dx, dy]); to !== null; to = shift(to, [dx, dy])) {
        if (board[to]) break;
        add(to);
      }
    }
  }

  const targetHalf = deploymentSide(from);
  if (targetHalf !== null) {
    for (const to of deploymentFields(targetHalf)) add(to, true);
  }
  return moves;
}

interface CaptureOption { to: Square; over: Square }

function captureOptions(board: Board, from: Square, piece: Piece, alreadyCaptured: ReadonlySet<Square>): CaptureOption[] {
  const options: CaptureOption[] = [];
  if (piece.type === 'k' || piece.type === 's') {
    for (const direction of directions) {
      const over = shift(from, direction);
      if (over === null || board[over]?.color !== opposite(piece.color) || alreadyCaptured.has(over)) continue;
      const to = shift(over, direction);
      if (to !== null && board[to] === null && canLand(board, piece, from, to)) options.push({ to, over });
    }
    return options;
  }

  for (const [dx, dy] of directions) {
    let over: Square | null = null;
    for (let current = shift(from, [dx, dy]); current !== null; current = shift(current, [dx, dy])) {
      const target = board[current];
      if (!over) {
        if (!target) continue;
        if (target.color === piece.color || alreadyCaptured.has(current)) break;
        over = current;
        continue;
      }
      if (target) break;
      if (canLand(board, piece, from, current)) options.push({ to: current, over });
    }
  }
  return options;
}

function captureMovesFrom(position: Position, from: Square): Move[] {
  const initial = position.board[from];
  if (!initial) return [];
  const out: Move[] = [];
  const lock = position.locks[initial.color];
  const startingHorizontalLock = lock?.square === from ? lock.direction : null;

  const visit = (
    board: Board,
    current: Square,
    piece: Piece,
    path: Square[],
    captures: Square[],
    alreadyCaptured: Set<Square>,
    horizontalDirection: -1 | 1 | null,
  ): void => {
    const options = captureOptions(board, current, piece, alreadyCaptured);
    if (options.length === 0) {
      if (path.length) out.push({ from, to: current, path, captured: captures, promotion: piece.type === 'b' && initial.type === 's', deployment: false });
      return;
    }

    for (const { to, over } of options) {
      let nextHorizontalDirection = horizontalDirection;
      if (piece.type === 's' && rankOf(current) === rankOf(to) && fileOf(current) !== fileOf(to)) {
        const direction = fileOf(to) > fileOf(current) ? 1 : -1;
        if (nextHorizontalDirection === -direction) continue;
        nextHorizontalDirection = direction;
      }
      const nextBoard = board.slice();
      nextBoard[current] = null;
      const nextPiece: Piece = piece.type === 's' && promotionTarget(to, piece.color)
        ? { color: piece.color, type: 'b', promoted: true }
        : piece;
      nextBoard[to] = nextPiece;
      const nextPath = [...path, to];
      const nextCaptures = [...captures, over];
      const nextCaptured = new Set(alreadyCaptured).add(over);
      const takenBiy = board[over]?.type === 'k';
      const move: Move = {
        from,
        to,
        path: nextPath,
        captured: nextCaptures,
        promotion: nextPiece.type === 'b' && initial.type === 's',
        deployment: false,
      };

      // A Biy may choose to stop after any jump. Any piece that reaches a gate may exercise the same right.
      if (piece.type === 'k' || isGate(to) || takenBiy) out.push(move);
      if (takenBiy) continue;
      visit(nextBoard, to, nextPiece, nextPath, nextCaptures, nextCaptured, nextHorizontalDirection);
    }
  };

  visit(position.board, from, initial, [], [], new Set(), startingHorizontalLock);
  return out;
}

function allCaptureMoves(position: Position): Move[] {
  return position.board.flatMap((piece, from) =>
    piece?.color === position.turn ? captureMovesFrom(position, from) : []);
}

function allQuietMoves(position: Position): Move[] {
  return position.board.flatMap((piece, from) =>
    piece?.color === position.turn ? quietMoves(position, from, piece) : []);
}

export function legalMoves(position: Position): Move[] {
  const unique = (moves: Move[]) => [...new Map(moves.map((move) => [moveUci(move), move])).values()];
  const captures = allCaptureMoves(position);
  if (captures.length === 0) return unique(allQuietMoves(position));

  const hasNonBiyCapture = captures.some((move) => position.board[move.from]?.type !== 'k');
  const hasBiyCapture = captures.some((move) => position.board[move.from]?.type === 'k');
  const gatedQuiet = allQuietMoves(position).filter((move) => isGate(move.from));
  const biyQuiet = hasBiyCapture && !hasNonBiyCapture
    ? allQuietMoves(position).filter((move) => position.board[move.from]?.type === 'k')
    : [];
  return unique([...captures, ...gatedQuiet, ...biyQuiet]);
}

export function attackedSquares(board: Board, color: Color): Square[] {
  const attacked = new Set<Square>();
  board.forEach((piece, from) => {
    if (piece?.color !== color) return;
    if (piece.type === 'k' || piece.type === 's') {
      directions.forEach((direction) => {
        const to = shift(from, direction);
        if (to !== null) attacked.add(to);
      });
    } else {
      for (const direction of directions) {
        for (let to = shift(from, direction); to !== null; to = shift(to, direction)) {
          attacked.add(to);
          if (board[to]) break;
        }
      }
    }
  });
  return [...attacked].sort((a, b) => a - b);
}

export function applyMove(position: Position, move: Move): Position {
  const board = position.board.slice();
  const piece = board[move.from]!;
  board[move.from] = null;
  for (const captured of move.captured) board[captured] = null;
  board[move.to] = move.promotion ? { color: piece.color, type: 'b', promoted: true } : piece;

  const locks = { ...position.locks };
  locks[piece.color] = null;
  if (piece.type === 's') {
    let horizontalDirection: -1 | 1 | null = null;
    let previous = move.from;
    for (const to of move.path) {
      if (rankOf(previous) === rankOf(to) && fileOf(previous) !== fileOf(to)) {
        horizontalDirection = fileOf(to) > fileOf(previous) ? 1 : -1;
      }
      previous = to;
    }
    if (horizontalDirection !== null) locks[piece.color] = { square: move.to, direction: horizontalDirection };
  }
  return {
    board,
    turn: opposite(position.turn),
    locks,
    halfmove: move.captured.length || move.promotion || move.deployment ? 0 : position.halfmove + 1,
    fullmove: position.fullmove + (position.turn === 'b' ? 1 : 0),
  };
}

export function emptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () => null);
}

export const movementGeometry = { directions, diagonal, orthogonal } as const;
