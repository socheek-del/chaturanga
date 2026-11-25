import type { Seat } from './types';

export const FILES = 16;
export const RANKS = 16;
export const BOARD_SIZE = FILES * RANKS;
export const PLAYERS: readonly Seat[] = ['r', 'b', 'w', 'k'];
export const PROMOTIONS = ['q', 'r', 'b', 'n'] as const;

export const squareAt = (file: number, rank: number): number => rank * FILES + file;
export const fileOf = (square: number): number => square % FILES;
export const rankOf = (square: number): number => Math.floor(square / FILES);
const inRange = (value: number, min: number, max: number): boolean => value >= min && value <= max;

/** 12×12 core with the four 4×4 corner fortresses; 2×2 overlaps are counted once. */
export function isPlayable(square: number): boolean {
  if (!Number.isInteger(square) || square < 0 || square >= BOARD_SIZE) return false;
  const file = fileOf(square);
  const rank = rankOf(square);
  const inCore = inRange(file, 2, 13) && inRange(rank, 2, 13);
  const inCornerFort = (inRange(file, 0, 3) || inRange(file, 12, 15)) &&
    (inRange(rank, 0, 3) || inRange(rank, 12, 15));
  return inCore || inCornerFort;
}

export function squareName(square: number): string {
  if (!isPlayable(square)) throw new RangeError(`Invalid fortress square: ${square}`);
  return `${String.fromCharCode(97 + fileOf(square))}${rankOf(square) + 1}`;
}

export function parseSquare(name: string): number | null {
  const match = /^([a-p])(1[0-6]|[1-9])$/.exec(name.toLowerCase());
  if (!match) return null;
  const square = squareAt(match[1]!.charCodeAt(0) - 97, Number(match[2]) - 1);
  return isPlayable(square) ? square : null;
}

interface WallSegment {
  axis: 'vertical' | 'horizontal';
  x: number;
  y: number;
  length: number;
}

// Cell-edge coordinates for the two two-cell walls at each fort. A vertical
// segment is between files x-1|x; a horizontal segment is between ranks y|y+1.
const WALLS: readonly WallSegment[] = [
  // Bottom-right fortress.
  { axis: 'vertical', x: 13, y: 2, length: 2 },
  { axis: 'horizontal', x: 12, y: 4, length: 2 },
  // Bottom-left, top-right, and top-left: rotations of the same pattern.
  { axis: 'vertical', x: 3, y: 2, length: 2 },
  { axis: 'horizontal', x: 2, y: 4, length: 2 },
  { axis: 'vertical', x: 13, y: 12, length: 2 },
  { axis: 'horizontal', x: 12, y: 12, length: 2 },
  { axis: 'vertical', x: 3, y: 12, length: 2 },
  { axis: 'horizontal', x: 2, y: 12, length: 2 },
];

const VERTICAL_WALLS = new Set<string>();
const HORIZONTAL_WALLS = new Set<string>();
const WALL_VERTICES = new Set<string>();
const key = (x: number, y: number): string => `${x},${y}`;

for (const wall of WALLS) {
  for (let offset = 0; offset < wall.length; offset++) {
    if (wall.axis === 'vertical') VERTICAL_WALLS.add(key(wall.x, wall.y + offset));
    else HORIZONTAL_WALLS.add(key(wall.x + offset, wall.y));
  }
  for (let offset = 0; offset <= wall.length; offset++) {
    WALL_VERTICES.add(wall.axis === 'vertical' ? key(wall.x, wall.y + offset) : key(wall.x + offset, wall.y));
  }
}

export function hasWallBetween(from: number, to: number): boolean {
  const dx = fileOf(to) - fileOf(from);
  const dy = rankOf(to) - rankOf(from);
  if (Math.abs(dx) + Math.abs(dy) !== 1) return false;
  if (dx !== 0) return VERTICAL_WALLS.has(key(Math.max(fileOf(from), fileOf(to)), rankOf(from)));
  return HORIZONTAL_WALLS.has(key(fileOf(from), Math.max(rankOf(from), rankOf(to))));
}

/** A diagonal is barred whenever it touches a wall vertex, including a wall end. */
export function diagonalTouchesWall(from: number, to: number): boolean {
  const dx = fileOf(to) - fileOf(from);
  const dy = rankOf(to) - rankOf(from);
  if (Math.abs(dx) !== 1 || Math.abs(dy) !== 1) return false;
  const vertexX = dx > 0 ? fileOf(from) + 1 : fileOf(from);
  const vertexY = dy > 0 ? rankOf(from) + 1 : rankOf(from);
  return WALL_VERTICES.has(key(vertexX, vertexY));
}

export function rightFortress(seat: Seat): number[] {
  const bounds: Record<Seat, { minFile: number; minRank: number }> = {
    r: { minFile: 0, minRank: 12 },
    b: { minFile: 12, minRank: 12 },
    w: { minFile: 12, minRank: 0 },
    k: { minFile: 0, minRank: 0 },
  };
  const { minFile, minRank } = bounds[seat];
  return Array.from({ length: 16 }, (_, index) => squareAt(minFile + index % 4, minRank + Math.floor(index / 4)));
}

export const nextSeat = (seat: Seat): Seat => PLAYERS[(PLAYERS.indexOf(seat) + 1) % PLAYERS.length]!;
export const teamOf = (seat: Seat): 0 | 1 => seat === 'r' || seat === 'w' ? 0 : 1;
export const sameTeam = (a: Seat, b: Seat): boolean => teamOf(a) === teamOf(b);

export function forward(seat: Seat): readonly [number, number] {
  switch (seat) {
    case 'r': return [0, -1];
    case 'b': return [-1, 0];
    case 'w': return [0, 1];
    case 'k': return [1, 0];
  }
}

export function pawnStartSquares(seat: Seat): number[] {
  switch (seat) {
    case 'r': return Array.from({ length: 8 }, (_, i) => squareAt(4 + i, 12));
    case 'b': return Array.from({ length: 8 }, (_, i) => squareAt(12, 4 + i));
    case 'w': return Array.from({ length: 8 }, (_, i) => squareAt(4 + i, 3));
    case 'k': return Array.from({ length: 8 }, (_, i) => squareAt(3, 4 + i));
  }
}

export function kingStart(seat: Seat): number {
  const coords: Record<Seat, readonly [number, number]> = {
    r: [7, 13], b: [13, 8], w: [8, 2], k: [2, 7],
  };
  return squareAt(...coords[seat]);
}

export function rookStartSquares(seat: Seat): { left: number; right: number } {
  const coords: Record<Seat, { left: readonly [number, number]; right: readonly [number, number] }> = {
    r: { left: [11, 13], right: [4, 13] },
    b: { left: [13, 4], right: [13, 11] },
    w: { left: [4, 2], right: [11, 2] },
    k: { left: [2, 11], right: [2, 4] },
  };
  const value = coords[seat];
  return { left: squareAt(...value.left), right: squareAt(...value.right) };
}

export function initialPieces(): Array<{ square: number; type: 'p' | 'n' | 'b' | 'r' | 'q' | 'k'; color: Seat }> {
  const result: Array<{ square: number; type: 'p' | 'n' | 'b' | 'r' | 'q' | 'k'; color: Seat }> = [];
  const add = (seat: Seat, type: 'p' | 'n' | 'b' | 'r' | 'q' | 'k', file: number, rank: number) => {
    result.push({ square: squareAt(file, rank), type, color: seat });
  };
  // The back rows follow Petrov's king-to-the-player's-right arrangement.
  const top: readonly ['r' | 'n' | 'b' | 'q' | 'k', number][] = [
    ['r', 4], ['n', 5], ['b', 6], ['k', 7], ['q', 8], ['b', 9], ['n', 10], ['r', 11],
  ];
  const bottom: readonly ['r' | 'n' | 'b' | 'q' | 'k', number][] = [
    ['r', 4], ['n', 5], ['b', 6], ['q', 7], ['k', 8], ['b', 9], ['n', 10], ['r', 11],
  ];
  for (const [type, file] of top) add('r', type, file, 13);
  for (let file = 4; file <= 11; file++) add('r', 'p', file, 12);
  for (const [type, rank] of [
    ['r', 4], ['n', 5], ['b', 6], ['q', 7], ['k', 8], ['b', 9], ['n', 10], ['r', 11],
  ] as const) add('b', type, 13, rank);
  for (let rank = 4; rank <= 11; rank++) add('b', 'p', 12, rank);
  for (const [type, file] of bottom) add('w', type, file, 2);
  for (let file = 4; file <= 11; file++) add('w', 'p', file, 3);
  for (const [type, rank] of [
    ['r', 11], ['n', 10], ['b', 9], ['q', 8], ['k', 7], ['b', 6], ['n', 5], ['r', 4],
  ] as const) add('k', type, 2, rank);
  for (let rank = 4; rank <= 11; rank++) add('k', 'p', 3, rank);
  return result;
}
