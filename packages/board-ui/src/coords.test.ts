import { describe, expect, it } from 'vitest';
import { parseUci, squareNameOf, squareOf } from './coords';

describe('parseUci', () => {
  it('parses ordinary moves, promotions and drop coordinates', () => {
    expect(parseUci('e3e4', 8)).toMatchObject({ kind: 'move', from: 20, to: 28, path: [28], promotion: null });
    expect(parseUci('e7e8q', 8)).toMatchObject({ kind: 'move', from: 52, to: 60, path: [60], promotion: 'q' });
    expect(parseUci('S@a2', 9)).toMatchObject({ kind: 'drop', type: 's', to: 9 });
  });

  it('parses every landing square in a capture chain on a wide board', () => {
    expect(parseUci('c5d6f7', 7)).toMatchObject({ kind: 'move', from: 30, to: 47, path: [38, 47], promotion: null });
    expect(parseUci('d13d14b', 7)).toMatchObject({ kind: 'move', from: 87, to: 94, path: [94], promotion: 'b' });
  });

  it('rejects malformed paths and off-board coordinates', () => {
    expect(parseUci('a1b2c0', 8)).toBeNull();
    expect(parseUci('z1a2', 8)).toBeNull();
    expect(parseUci('a0b1', 7)).toBeNull();
  });
});

describe('17×17 board coordinates', () => {
  it('round-trips q17 and parses routes ending on the q-file', () => {
    expect(squareOf('q17', 17)).toBe(288);
    expect(squareNameOf(288, 17)).toBe('q17');
    expect(parseUci('p16q17', 17)).toMatchObject({
      kind: 'move', from: 270, to: 288, path: [288], promotion: null,
    });
  });
});
