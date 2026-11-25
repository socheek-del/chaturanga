import type { Color, Square } from '@chaturanga/rules-core';
import {
  ALBERT_HALL,
  BOARD_SIZE,
  FILES,
  HOSPITAL,
  HOSPITAL_GROUNDS,
  HOUSE_OF_COMMONS,
  PRISON,
  PRISON_YARD,
  isHoldingOrStagingCell,
  isPinkArena,
} from './layout';
import { fileOf, onBoard, opposite, rankOf, squareName, type Board, type Piece, type Position } from './position';

type Direction = readonly [file: number, rank: number];

const DIRECTIONS: readonly Direction[] = [
  [-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1],
];

export interface CaptureTransfer {
  readonly atPathIndex: number;
  readonly from: Square;
  readonly to: Square;
  readonly piece: Piece;
}

export interface ReleaseTransfer {
  readonly from: Square;
  readonly to: Square;
  readonly piece: Piece;
}

export interface RouteMove {
  readonly kind: 'route';
  readonly color: Color;
  readonly from: Square;
  readonly to: Square;
  readonly path: readonly Square[];
  readonly captures: readonly CaptureTransfer[];
  readonly uci: string;
}

export interface ExchangeMove {
  readonly kind: 'exchange';
  readonly color: Color;
  readonly to: Square;
  readonly smallPairs: number;
  readonly largePairs: number;
  readonly releasedOwn: readonly ReleaseTransfer[];
  readonly releasedOpponent: readonly ReleaseTransfer[];
  readonly uci: string;
}

export type Move = RouteMove | ExchangeMove;

function shifted(target: Square, [df, dr]: Direction): Square | null {
  const file = fileOf(target) + df;
  const rank = rankOf(target) + dr;
  return onBoard(file, rank) ? rank * FILES + file : null;
}

function canEnter(color: Color, from: Square, to: Square): boolean {
  if (isHoldingOrStagingCell(to)) return false;
  if (color === 'w' && ALBERT_HALL.includes(to)) return false;
  if (color === 'b' && HOUSE_OF_COMMONS.includes(to)) return false;

  const ownGoal = color === 'w' ? HOUSE_OF_COMMONS : ALBERT_HALL;
  if (ownGoal.includes(from) && !ownGoal.includes(to)) return false;
  return true;
}

function firstOpenHolding(board: Board, color: Color): Square | null {
  const cells = color === 'w' ? PRISON : HOSPITAL;
  return cells.find((target) => board[target] === null) ?? null;
}

function isLarge(piece: Piece): boolean {
  return piece.type === 'l' || piece.type === 'i';
}

function canCapture(piece: Piece, target: Piece, from: Square, over: Square): boolean {
  if (piece.color === target.color || !isPinkArena(over)) return false;
  const diagonal = fileOf(from) !== fileOf(over) && rankOf(from) !== rankOf(over);
  return isLarge(piece) || diagonal;
}

function isGoalFull(board: Board, color: Color): boolean {
  const cells = color === 'w' ? HOUSE_OF_COMMONS : ALBERT_HALL;
  return cells.every((target) => board[target]?.color === color);
}

function routeUci(from: Square, path: readonly Square[]): string {
  return squareName(from) + path.map(squareName).join('');
}

function routeMoves(position: Position, from: Square, piece: Piece): RouteMove[] {
  const board = position.board;
  const result: RouteMove[] = [];

  for (const direction of DIRECTIONS) {
    const to = shifted(from, direction);
    if (to !== null && board[to] === null && canEnter(piece.color, from, to)) {
      const path = [to];
      result.push({ kind: 'route', color: piece.color, from, to, path, captures: [], uci: routeUci(from, path) });
    }
  }

  const visited = new Set<Square>([from]);
  const visitHops = (current: Square, currentBoard: Board, path: Square[], captures: CaptureTransfer[]): void => {
    for (const direction of DIRECTIONS) {
      const over = shifted(current, direction);
      const to = over === null ? null : shifted(over, direction);
      if (over === null || to === null || visited.has(to) ||
          !canEnter(piece.color, current, over) || !canEnter(piece.color, current, to)) continue;
      const target = currentBoard[over];
      if (!target || currentBoard[to] !== null) continue;

      const nextBoard = currentBoard.slice();
      nextBoard[current] = null;
      const nextCaptures = captures.slice();
      if (canCapture(piece, target, current, over)) {
        const holding = firstOpenHolding(nextBoard, target.color);
        if (holding === null) continue;
        nextBoard[over] = null;
        nextBoard[holding] = target;
        nextCaptures.push({ atPathIndex: path.length, from: over, to: holding, piece: target });
      }
      nextBoard[to] = piece;
      const nextPath = [...path, to];
      const move: RouteMove = {
        kind: 'route', color: piece.color, from, to, path: nextPath, captures: nextCaptures,
        uci: routeUci(from, nextPath),
      };
      result.push(move);

      // A completed six-cell building ends play immediately; do not add irrelevant continuations.
      if (isGoalFull(nextBoard, piece.color)) continue;
      visited.add(to);
      visitHops(to, nextBoard, nextPath, nextCaptures);
      visited.delete(to);
    }
  };

  visitHops(from, board, [], []);
  return result;
}

function holdingPieces(position: Position, color: Color, large: boolean): Array<{ from: Square; piece: Piece }> {
  const zone = color === 'w' ? PRISON : HOSPITAL;
  return zone.flatMap((from) => {
    const piece = position.board[from];
    return piece?.color === color && isLarge(piece) === large ? [{ from, piece }] : [];
  });
}

function stageCells(color: Color): readonly Square[] {
  return color === 'w' ? PRISON_YARD : HOSPITAL_GROUNDS;
}

function exchangeCode(smallPairs: number, largePairs: number, to: Square): string {
  return `X${smallPairs}${largePairs}@${squareName(to)}`;
}

function exchangeMoves(position: Position): ExchangeMove[] {
  const whitePrisoners = PRISON.filter((target) => position.board[target]?.color === 'w').length;
  const blackPrisoners = HOSPITAL.filter((target) => position.board[target]?.color === 'b').length;
  if (whitePrisoners < 12 || blackPrisoners < 12 ||
      PRISON_YARD.some((target) => position.board[target] !== null) ||
      HOSPITAL_GROUNDS.some((target) => position.board[target] !== null)) return [];

  const maxSmall = Math.min(6, holdingPieces(position, 'w', false).length, holdingPieces(position, 'b', false).length);
  const maxLarge = Math.min(6, holdingPieces(position, 'w', true).length, holdingPieces(position, 'b', true).length);
  const ownStage = stageCells(position.turn);
  const firstDestination = ownStage.find((target) => position.board[target] === null);
  if (firstDestination === undefined) return [];

  const result: ExchangeMove[] = [];
  for (let smallPairs = 0; smallPairs <= maxSmall; smallPairs++) {
    for (let largePairs = 0; largePairs <= maxLarge; largePairs++) {
      const pairs = smallPairs + largePairs;
      if (pairs < 1 || pairs > 6) continue;

      const release = (color: Color): ReleaseTransfer[] => {
        const ownStages = stageCells(color);
        const selected = [
          ...holdingPieces(position, color, true).slice(0, largePairs),
          ...holdingPieces(position, color, false).slice(0, smallPairs),
        ];
        return selected.map(({ from, piece }, index) => ({ from, to: ownStages[index]!, piece }));
      };

      const releasedOwn = release(position.turn);
      const releasedOpponent = release(opposite(position.turn));
      const to = releasedOwn[0]!.to;
      result.push({
        kind: 'exchange', color: position.turn, to, smallPairs, largePairs,
        releasedOwn, releasedOpponent, uci: exchangeCode(smallPairs, largePairs, to),
      });
    }
  }
  return result;
}

export function legalMoves(position: Position): Move[] {
  const moves: Move[] = [];
  for (let from = 0; from < BOARD_SIZE; from++) {
    const piece = position.board[from];
    if (!piece || piece.color !== position.turn ||
        (PRISON.includes(from) && piece.color === 'w') || (HOSPITAL.includes(from) && piece.color === 'b')) continue;
    moves.push(...routeMoves(position, from, piece));
  }
  moves.push(...exchangeMoves(position));
  return moves;
}

export function applyMove(position: Position, move: Move): Position {
  const board = position.board.slice();
  if (move.kind === 'exchange') {
    for (const release of [...move.releasedOwn, ...move.releasedOpponent]) {
      board[release.from] = null;
      board[release.to] = release.piece;
    }
  } else {
    const piece = board[move.from]!;
    let current = move.from;
    for (const [pathIndex, to] of move.path.entries()) {
      board[current] = null;
      for (const capture of move.captures) {
        if (capture.atPathIndex !== pathIndex) continue;
        board[capture.from] = null;
        board[capture.to] = capture.piece;
      }
      board[to] = piece;
      current = to;
    }
  }
  return { board, turn: opposite(position.turn) };
}

export function attackedSquares(board: Board, color: Color): Square[] {
  const attacks = new Set<Square>();
  for (let from = 0; from < BOARD_SIZE; from++) {
    const piece = board[from];
    if (!piece || piece.color !== color ||
        (PRISON.includes(from) && color === 'w') || (HOSPITAL.includes(from) && color === 'b')) continue;
    for (const direction of DIRECTIONS) {
      const over = shifted(from, direction);
      const to = over === null ? null : shifted(over, direction);
      if (over === null || to === null || !canEnter(color, from, over) || !canEnter(color, from, to)) continue;
      const target = board[over];
      if (target && canCapture(piece, target, from, over) && board[to] === null) attacks.add(over);
    }
  }
  return [...attacks].sort((left, right) => left - right);
}

export function moveUci(move: Move): string {
  return move.uci;
}
