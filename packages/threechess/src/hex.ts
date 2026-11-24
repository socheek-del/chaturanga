import type { Player } from './types';

export const RADIUS = 5;
export const SIZE = RADIUS * 2 + 1;
export type Hex = readonly [q: number, r: number];
export const EDGES: readonly Hex[] = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
export const DIAGONALS: readonly Hex[] = EDGES.map(([q, r], i) => {
  const [nextQ, nextR] = EDGES[(i + 1) % EDGES.length]!;
  return [q + nextQ, r + nextR];
});
export const KNIGHTS: readonly Hex[] = EDGES.flatMap(([q, r], i) =>
  [-1, 1].map((offset): Hex => {
    const [nextQ, nextR] = EDGES[(i + offset + EDGES.length) % EDGES.length]!;
    return [2 * q + nextQ, 2 * r + nextR];
  }),
);

export function seatHex([q, r]: Hex, player: Player): Hex {
  if (player === 'b') return [r, -q - r];
  if (player === 'r') return [-q - r, q];
  return [q, r];
}

export function hexAt(q: number, r: number): number | null {
  if (Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)) > RADIUS) return null;
  return (r + RADIUS) * SIZE + q + RADIUS;
}

export function hexOf(square: number): Hex {
  return [square % SIZE - RADIUS, Math.floor(square / SIZE) - RADIUS];
}

export function step(square: number, [dq, dr]: Hex): number | null {
  const [q, r] = hexOf(square);
  return hexAt(q + dq, r + dr);
}
