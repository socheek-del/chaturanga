import { describe, expect, it } from 'vitest';
import { formatScore, graphPoints, plyAt, squareCenter, whiteShare } from './geometry';

const sq = (name: string) => (name.charCodeAt(1) - 49) * 8 + (name.charCodeAt(0) - 97);

describe('review geometry (ch-016)', () => {
  it('puts squares where the board shows them, in both orientations', () => {
    expect(squareCenter(sq('a1'), 'w')).toEqual({ x: 0.5, y: 7.5 });
    expect(squareCenter(sq('h8'), 'w')).toEqual({ x: 7.5, y: 0.5 });
    expect(squareCenter(sq('e2'), 'w')).toEqual({ x: 4.5, y: 6.5 });
    expect(squareCenter(sq('a1'), 'b')).toEqual({ x: 7.5, y: 0.5 });
    expect(squareCenter(sq('e2'), 'b')).toEqual({ x: 3.5, y: 1.5 });
  });

  it('draws White up in the graph and spreads plies over the width', () => {
    expect(graphPoints([50, 100, 0], 300, 60)).toEqual([
      { x: 0, y: 30 },
      { x: 150, y: 0 },
      { x: 300, y: 60 },
    ]);
    expect(plyAt(0, 300, 40)).toBe(0);
    expect(plyAt(150, 300, 40)).toBe(20);
    expect(plyAt(299, 300, 40)).toBe(40);
    expect(plyAt(-10, 300, 40)).toBe(0);
    expect(plyAt(400, 300, 40)).toBe(40);
  });

  it('keeps a sliver of the bar for the side that is lost', () => {
    expect(whiteShare(50)).toBe(50);
    expect(whiteShare(100)).toBe(96);
    expect(whiteShare(0)).toBe(4);
  });

  it('writes scores as players read them', () => {
    expect(formatScore({ cp: 35 })).toBe('+0.35');
    expect(formatScore({ cp: -120 })).toBe('−1.20');
    expect(formatScore({ cp: 0 })).toBe('0.00');
    expect(formatScore({ mate: 3 })).toBe('M3');
    expect(formatScore({ mate: -2 })).toBe('−M2');
  });
});
