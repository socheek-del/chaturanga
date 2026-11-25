import type { Color, Square } from '@chaturanga/rules-core';
import {
  FILES,
  RANKS,
  RIVER_RANK,
  fileOf,
  onBoard,
  opposite,
  rankOf,
  squareName,
  type Board,
  type Piece,
  type Position,
} from './position';

type Offset = readonly [file: number, rank: number];
const directions: readonly Offset[] = [
  [-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1],
];
const orthogonal: readonly Offset[] = [[0, -1], [-1, 0], [1, 0], [0, 1]];
const lionFlyingDirections: readonly Offset[] = [
  [-1, -1], [0, -1], [1, -1], [-1, 1], [0, 1], [1, 1],
];

export interface Move {
  from: Square;
  to: Square;
  /** Each landing square in a Monkey's jump route; ordinary moves have one. */
  path: Square[];
  /** Squares of jumped pieces, in capture order. */
  captured: Square[];
  promotion: boolean;
}

export const moveUci = (move: Move): string =>
  squareName(move.from) + move.path.map(squareName).join('') + (move.promotion ? '+' : '');

function shift(from: Square, [dx, dy]: Offset): Square | null {
  const file = fileOf(from) + dx;
  const rank = rankOf(from) + dy;
  return onBoard(file, rank) ? rank * FILES + file : null;
}

function inCastle(square: Square, color: Color): boolean {
  const file = fileOf(square);
  const rank = rankOf(square);
  return file >= 2 && file <= 4 && (color === 'w' ? rank <= 2 : rank >= 4);
}

const river = (square: Square): boolean => rankOf(square) === RIVER_RANK;
const isFarBank = (square: Square, color: Color): boolean =>
  color === 'w' ? rankOf(square) >= RIVER_RANK + 1 : rankOf(square) <= RIVER_RANK - 1;
const backRank = (square: Square, color: Color): boolean =>
  color === 'w' ? rankOf(square) === RANKS - 1 : rankOf(square) === 0;
const isLion = (piece: Piece | null | undefined): boolean => piece?.type === 'l';

function canLand(position: Position, piece: Piece, to: Square): boolean {
  const target = position.board[to];
  if (target?.color === piece.color) return false;
  if (piece.type === 'l' && river(to)) return false;
  return true;
}

function lionFlyingCapture(position: Position, from: Square): Move[] {
  const piece = position.board[from]!;
  const moves: Move[] = [];
  for (const [dx, dy] of lionFlyingDirections) {
    for (let to = shift(from, [dx, dy]); to !== null; to = shift(to, [dx, dy])) {
      const target = position.board[to];
      if (!target) continue;
      if (target.color !== piece.color && isLion(target)) moves.push({ from, to, path: [to], captured: [to], promotion: false });
      break;
    }
  }
  return moves;
}

function addStep(position: Position, from: Square, to: Square | null, out: Move[], piece: Piece): void {
  if (to === null || !canLand(position, piece, to)) return;
  const promotes = piece.type === 'p' && backRank(to, piece.color);
  out.push({ from, to, path: [to], captured: position.board[to] ? [to] : [], promotion: promotes });
}

function addClearRetreat(position: Position, from: Square, piece: Piece, offsets: readonly Offset[], out: Move[]): void {
  for (const direction of offsets) {
    const first = shift(from, direction);
    if (first === null || position.board[first]) continue;
    addStep(position, from, first, out, piece);
    const second = shift(first, direction);
    if (second !== null && !position.board[second]) addStep(position, from, second, out, piece);
  }
}

function ordinaryMoves(position: Position, from: Square, piece: Piece): Move[] {
  const out: Move[] = [];
  const file = fileOf(from);
  const rank = rankOf(from);

  if (piece.type === 'l') {
    for (const [dx, dy] of directions) {
      const to = shift(from, [dx, dy]);
      if (to !== null && inCastle(to, piece.color)) addStep(position, from, to, out, piece);
    }
    return [...out, ...lionFlyingCapture(position, from)];
  }

  if (piece.type === 'z') {
    for (const [dx, dy] of [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]] as const) {
      addStep(position, from, onBoard(file + dx, rank + dy) ? (rank + dy) * FILES + file + dx : null, out, piece);
    }
    return out;
  }

  if (piece.type === 'e') {
    for (const [dx, dy] of orthogonal) {
      for (const distance of [1, 2]) {
        const targetFile = file + dx * distance;
        const targetRank = rank + dy * distance;
        if (onBoard(targetFile, targetRank)) addStep(position, from, targetRank * FILES + targetFile, out, piece);
      }
    }
    return out;
  }

  if (piece.type === 'g') {
    for (const [dx, dy] of directions) {
      const targetFile = file + dx * 2;
      const targetRank = rank + dy * 2;
      if (onBoard(targetFile, targetRank)) addStep(position, from, targetRank * FILES + targetFile, out, piece);
      const adjacent = shift(from, [dx, dy]);
      if (adjacent !== null && !position.board[adjacent]) out.push({ from, to: adjacent, path: [adjacent], captured: [], promotion: false });
    }
    return out;
  }

  if (piece.type === 'c') {
    for (const direction of directions) addStep(position, from, shift(from, direction), out, piece);
    const slideDirections: readonly Offset[] = river(from)
      ? [[-1, 0], [1, 0]]
      : [[0, rank < RIVER_RANK ? 1 : -1]];
    for (const direction of slideDirections) {
      for (let to = shift(from, direction); to !== null && (river(from) ? rankOf(to) === RIVER_RANK :
        (rank < RIVER_RANK ? rankOf(to) <= RIVER_RANK : rankOf(to) >= RIVER_RANK)); to = shift(to, direction)) {
        const target = position.board[to];
        if (target?.color === piece.color) break;
        out.push({ from, to, path: [to], captured: target ? [to] : [], promotion: false });
        if (target) break;
      }
    }
    return out;
  }

  if (piece.type === 'm') {
    for (const direction of directions) {
      const to = shift(from, direction);
      if (to !== null && !position.board[to]) out.push({ from, to, path: [to], captured: [], promotion: false });
    }
    return out;
  }

  const forward = piece.color === 'w' ? 1 : -1;
  const backward = -forward;
  const forwardDirections: Offset[] = [[0, forward], [-1, forward], [1, forward]];
  for (const direction of forwardDirections) addStep(position, from, shift(from, direction), out, piece);

  if (piece.type === 's') {
    for (const dx of [-1, 1]) addStep(position, from, shift(from, [dx, 0]), out, piece);
    addClearRetreat(position, from, piece, directions.filter(([, dy]) => dy === backward), out);
  } else if (isFarBank(from, piece.color)) {
    addClearRetreat(position, from, piece, [[0, backward]], out);
  }
  return out;
}

function monkeyCaptureMoves(position: Position, from: Square): Move[] {
  const initial = position.board[from]!;
  const out: Move[] = [];
  const visit = (board: Board, current: Square, path: Square[], captures: Square[], seen: ReadonlySet<Square>): void => {
    for (const direction of directions) {
      const jumped = shift(current, direction);
      if (jumped === null || board[jumped]?.color !== opposite(initial.color) || seen.has(jumped)) continue;
      const landing = shift(jumped, direction);
      if (landing === null || board[landing] !== null || (initial.type === 'l' && river(landing))) continue;

      const nextPath = [...path, landing];
      const nextCaptures = [...captures, jumped];
      const takesLion = isLion(board[jumped]);
      const move: Move = { from, to: landing, path: nextPath, captured: nextCaptures, promotion: false };
      out.push(move); // Congo capture is optional; a player may stop after any jump.
      if (takesLion) continue;

      const nextBoard = board.slice();
      nextBoard[current] = null;
      nextBoard[landing] = initial;
      // Jumped pieces stay in place as blockers until the complete route ends.
      visit(nextBoard, landing, nextPath, nextCaptures, new Set(seen).add(jumped));
    }
  };
  visit(position.board, from, [], [], new Set());
  return out;
}

export function legalMoves(position: Position): Move[] {
  const moves = position.board.flatMap((piece, from) => {
    if (piece?.color !== position.turn) return [];
    return piece.type === 'm'
      ? [...ordinaryMoves(position, from, piece), ...monkeyCaptureMoves(position, from)]
      : ordinaryMoves(position, from, piece);
  });
  return [...new Map(moves.map((move) => [moveUci(move), move])).values()];
}

export function attackedSquares(board: Board, color: Color): Square[] {
  const attacked = new Set<Square>();
  board.forEach((piece, from) => {
    if (piece?.color !== color) return;
    const file = fileOf(from);
    const rank = rankOf(from);
    const addOffset = (dx: number, dy: number) => {
      const targetFile = file + dx;
      const targetRank = rank + dy;
      if (onBoard(targetFile, targetRank)) attacked.add(targetRank * FILES + targetFile);
    };
    if (piece.type === 'l') {
      for (const [dx, dy] of directions) {
        const to = shift(from, [dx, dy]);
        if (to !== null && inCastle(to, color)) attacked.add(to);
      }
      for (const to of lionFlyingCapture({ board, turn: color, halfmove: 0, fullmove: 1 }, from).map((move) => move.to)) attacked.add(to);
    } else if (piece.type === 'z') {
      for (const [dx, dy] of [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]] as const) addOffset(dx, dy);
    } else if (piece.type === 'e') {
      for (const [dx, dy] of orthogonal) for (const distance of [1, 2]) addOffset(dx * distance, dy * distance);
    } else if (piece.type === 'g') {
      for (const [dx, dy] of directions) addOffset(dx * 2, dy * 2);
    } else if (piece.type === 'c') {
      for (const direction of directions) {
        const to = shift(from, direction);
        if (to !== null) attacked.add(to);
      }
      const slideDirections: readonly Offset[] = river(from)
        ? [[-1, 0], [1, 0]]
        : [[0, rank < RIVER_RANK ? 1 : -1]];
      for (const direction of slideDirections) {
        for (let to = shift(from, direction); to !== null && (river(from) ? rankOf(to) === RIVER_RANK :
          (rank < RIVER_RANK ? rankOf(to) <= RIVER_RANK : rankOf(to) >= RIVER_RANK)); to = shift(to, direction)) {
          attacked.add(to);
          if (board[to]) break;
        }
      }
    } else if (piece.type === 'm') {
      for (const [dx, dy] of directions) {
        const jumped = shift(from, [dx, dy]);
        const landing = jumped === null ? null : shift(jumped, [dx, dy]);
        if (jumped !== null && landing !== null && board[landing] === null) attacked.add(jumped);
      }
    } else {
      const forward = piece.color === 'w' ? 1 : -1;
      addOffset(0, forward);
      addOffset(-1, forward);
      addOffset(1, forward);
      if (piece.type === 's') {
        addOffset(-1, 0);
        addOffset(1, 0);
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

  const moved: Piece = move.promotion
    ? { color: piece.color, type: 's', promoted: true, riverDeadline: false }
    : { ...piece, riverDeadline: false };
  if (river(move.to) && moved.type !== 'c' && !piece.riverDeadline) moved.riverDeadline = true;
  board[move.to] = moved;

  // Resolve deadlines that existed before this turn. A due mover drowns if its route ends in the river;
  // all other due friendly pieces drown at the end of this turn, even if they did not move.
  if (piece.riverDeadline && river(move.to)) board[move.to] = null;
  board.forEach((other, square) => {
    if (square !== move.to && other?.color === piece.color && other.riverDeadline) board[square] = null;
  });

  return {
    board,
    turn: opposite(position.turn),
    halfmove: move.captured.length || move.promotion ? 0 : position.halfmove + 1,
    fullmove: position.fullmove + (position.turn === 'b' ? 1 : 0),
  };
}
