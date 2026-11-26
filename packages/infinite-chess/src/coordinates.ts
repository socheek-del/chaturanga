import type { Point, Square } from './types';

const SQUARE = /^(-?\d+),(-?\d+)$/;

export function keyOf(x: bigint, y: bigint): Square {
  return `${x},${y}`;
}

export function pointOf(square: Square): Point {
  const match = SQUARE.exec(square);
  if (!match) throw new RangeError(`Invalid Infinite Chess square: ${square}`);
  return { x: BigInt(match[1]!), y: BigInt(match[2]!) };
}

export function canonicalSquare(square: string): Square | null {
  const match = SQUARE.exec(square);
  if (!match) return null;
  return keyOf(BigInt(match[1]!), BigInt(match[2]!));
}

export function squareOf(square: string): Point | null {
  try {
    return pointOf(square);
  } catch {
    return null;
  }
}

export function abs(value: bigint): bigint {
  return value < 0n ? -value : value;
}

export function sign(value: bigint): bigint {
  return value < 0n ? -1n : value > 0n ? 1n : 0n;
}

export function gcd(a: bigint, b: bigint): bigint {
  let x = abs(a);
  let y = abs(b);
  while (y !== 0n) [x, y] = [y, x % y];
  return x;
}

/** Unit directions supported by orthodox rook, bishop and queen movement. */
export function sliderDirection(dx: bigint, dy: bigint): Point | null {
  if (dx === 0n && dy === 0n) return null;
  if (dx === 0n || dy === 0n || abs(dx) === abs(dy)) return { x: sign(dx), y: sign(dy) };
  return null;
}

export function sameLine(a: Point, b: Point, c: Point): boolean {
  return (b.x - a.x) * (c.y - a.y) === (b.y - a.y) * (c.x - a.x);
}

export function compareSquares(a: Square, b: Square): number {
  const pa = pointOf(a);
  const pb = pointOf(b);
  return pa.y < pb.y ? -1 : pa.y > pb.y ? 1 : pa.x < pb.x ? -1 : pa.x > pb.x ? 1 : 0;
}
