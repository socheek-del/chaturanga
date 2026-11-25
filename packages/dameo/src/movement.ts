import type { Color, Square } from '@chaturanga/rules-core';
import { FILES, RANKS } from './layout';
import { opposite, squareName, type Board, type DameoPiece, type Position } from './position';

type Direction = readonly [file: number, rank: number];

const ORTHOGONAL: readonly Direction[] = [[0, 1], [1, 0], [0, -1], [-1, 0]];
const DIAGONAL: readonly Direction[] = [[1, 1], [-1, 1], [1, -1], [-1, -1]];

export interface CapturedPiece {
  readonly square: Square;
  readonly piece: DameoPiece;
}

export interface Move {
  readonly kind: 'step' | 'line' | 'king' | 'capture';
  readonly color: Color;
  readonly from: Square;
  readonly to: Square;
  /** Start square followed by each legal landing; line moves include the friendly line cells shifted. */
  readonly path: readonly Square[];
  readonly captures: readonly CapturedPiece[];
  readonly uci: string;
}

export function shifted(square: Square, [df, dr]: Direction): Square | null {
  const file = square % FILES + df;
  const rank = Math.floor(square / FILES) + dr;
  return file < 0 || file >= FILES || rank < 0 || rank >= RANKS ? null : rank * FILES + file;
}

function forward(color: Color): readonly Direction[] {
  return color === 'w' ? [[0, 1], [1, 1], [-1, 1]] : [[0, -1], [1, -1], [-1, -1]];
}

function routeUci(path: readonly Square[]): string {
  return path.map(squareName).join('');
}

function quietMoves(board: Board, color: Color): Move[] {
  const result: Move[] = [];
  for (let from = 0; from < board.length; from++) {
    const piece = board[from];
    if (piece?.color !== color) continue;
    if (piece.type === 'm') {
      for (const direction of forward(color)) {
        const path: Square[] = [from];
        let cursor = from;
        let lineCount = 1;
        while (true) {
          const next = shifted(cursor, direction);
          if (next === null) break;
          const nextPiece = board[next];
          if (nextPiece?.color === color && nextPiece.type === 'm') {
            path.push(next);
            cursor = next;
            lineCount++;
            continue;
          }
          if (nextPiece === null) {
            const completePath = [...path, next];
            result.push({
              kind: lineCount === 1 ? 'step' : 'line', color, from, to: next,
              path: completePath, captures: [], uci: routeUci(completePath),
            });
          }
          break;
        }
      }
      continue;
    }

    for (const direction of [...ORTHOGONAL, ...DIAGONAL]) {
      let cursor = from;
      while (true) {
        const next = shifted(cursor, direction);
        if (next === null || board[next] !== null) break;
        const path = [from, next];
        result.push({ kind: 'king', color, from, to: next, path, captures: [], uci: routeUci(path) });
        cursor = next;
      }
    }
  }
  return result;
}

interface CaptureStep {
  readonly to: Square;
  readonly over: Square;
}

function captureSteps(
  board: Board,
  current: Square,
  piece: DameoPiece,
  alreadyCaptured: ReadonlySet<Square>,
): CaptureStep[] {
  const result: CaptureStep[] = [];
  for (const direction of ORTHOGONAL) {
    const first = shifted(current, direction);
    if (first === null) continue;
    const target = board[first];
    if (piece.type === 'm') {
      const landing = shifted(first, direction);
      if (target && target.color !== piece.color && !alreadyCaptured.has(first) && landing !== null && board[landing] === null)
        result.push({ over: first, to: landing });
      continue;
    }

    let over = first;
    while (board[over] === null) {
      const next = shifted(over, direction);
      if (next === null) break;
      over = next;
    }
    const enemy = board[over];
    if (!enemy || enemy.color === piece.color || alreadyCaptured.has(over)) continue;
    let landing = shifted(over, direction);
    while (landing !== null && board[landing] === null) {
      result.push({ over, to: landing });
      landing = shifted(landing, direction);
    }
  }
  return result;
}

function capturesFrom(board: Board, from: Square, piece: DameoPiece, color: Color): Move[] {
  const result: Move[] = [];
  const captured = new Set<Square>();
  const captures: CapturedPiece[] = [];
  const path: Square[] = [from];

  const extend = (currentBoard: Board, current: Square): void => {
    const nextSteps = captureSteps(currentBoard, current, piece, captured);
    if (nextSteps.length === 0) {
      if (captures.length > 0) {
        const movePath = [...path];
        result.push({
          kind: 'capture', color, from, to: current, path: movePath,
          captures: [...captures], uci: routeUci(movePath),
        });
      }
      return;
    }

    for (const step of nextSteps) {
      const target = currentBoard[step.over]!;
      const nextBoard = currentBoard.slice();
      nextBoard[current] = null;
      nextBoard[step.to] = piece;
      captured.add(step.over);
      captures.push({ square: step.over, piece: target });
      path.push(step.to);
      extend(nextBoard, step.to);
      path.pop();
      captures.pop();
      captured.delete(step.over);
    }
  };

  extend(board, from);
  return result;
}

/** Enumerate all complete capture routes, before applying the global majority-capture rule. */
export function allCaptureRoutes(board: Board, color: Color): Move[] {
  const result: Move[] = [];
  for (let from = 0; from < board.length; from++) {
    const piece = board[from];
    if (piece?.color === color) result.push(...capturesFrom(board, from, piece, color));
  }
  return result;
}

export function legalMoves(position: Position): Move[] {
  const captures = allCaptureRoutes(position.board, position.turn);
  if (captures.length > 0) {
    const maximum = Math.max(...captures.map((move) => move.captures.length));
    return captures.filter((move) => move.captures.length === maximum).sort((a, b) => a.uci.localeCompare(b.uci));
  }
  return quietMoves(position.board, position.turn).sort((a, b) => a.uci.localeCompare(b.uci));
}

export function attackSquares(board: Board, color: Color): Square[] {
  const attacked = new Set<Square>();
  for (let from = 0; from < board.length; from++) {
    const piece = board[from];
    if (piece?.color !== color) continue;
    for (const direction of ORTHOGONAL) {
      let target = shifted(from, direction);
      if (target === null) continue;
      if (piece.type === 'm') {
        const landing = shifted(target, direction);
        if (board[target] !== null && landing !== null && board[landing] === null) attacked.add(target);
        continue;
      }

      while (target !== null && board[target] === null) target = shifted(target, direction);
      if (target === null) continue;
      const landing = shifted(target, direction);
      if (landing !== null && board[landing] === null) attacked.add(target);
    }
  }
  return [...attacked].sort((a, b) => a - b);
}

export function applyMove(position: Position, move: Move): Position {
  const board = position.board.slice();
  const piece = board[move.from]!;
  if (move.kind === 'line') {
    const oldSquares = move.path.slice(0, -1);
    const linePieces = oldSquares.map((source) => board[source]!);
    const promotedHead = oldSquares.at(-1)!;
    for (const source of oldSquares) board[source] = null;
    for (let index = 0; index < oldSquares.length; index++) {
      const target = move.path[index + 1]!;
      const original = linePieces[index]!;
      const movingPiece = oldSquares[index] === promotedHead && Math.floor(target / FILES) === (piece.color === 'w' ? RANKS - 1 : 0)
        ? { ...original, type: 'k' as const, promoted: true }
        : original;
      board[target] = movingPiece;
    }
    return { board, turn: opposite(position.turn) };
  }

  board[move.from] = null;
  for (const capture of move.captures) board[capture.square] = null;
  const promotes = piece.type === 'm' && Math.floor(move.to / FILES) === (piece.color === 'w' ? RANKS - 1 : 0);
  board[move.to] = promotes ? { ...piece, type: 'k', promoted: true } : piece;
  return { board, turn: opposite(position.turn) };
}
