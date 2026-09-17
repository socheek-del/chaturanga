import { describe, expect, it } from 'vitest';
import { fittedBoardWidth } from './fittedBoard';

describe('fittedBoardWidth (plat-009)', () => {
  it('keeps the square-board result for an aspect of 1', () => {
    // The formula before plat-009 was floor(max(160, min(columnWidth, availableHeight))).
    for (const [width, height] of [
      [358, 520],
      [358, 300],
      [700, 1200],
      [390, 100],
      [412.6, 480.4],
    ] as const) {
      expect(fittedBoardWidth(width, height)).toBe(Math.floor(Math.max(160, Math.min(width, height))));
      expect(fittedBoardWidth(width, height, 1)).toBe(fittedBoardWidth(width, height));
    }
  });

  it('narrows a board taller than it is wide so its height still fits', () => {
    // A 9x10 board in 400px of height may be only 360px wide.
    expect(fittedBoardWidth(390, 400, 9 / 10)).toBe(360);
    // With room to spare, the column width wins.
    expect(fittedBoardWidth(358, 800, 9 / 10)).toBe(358);
  });

  it('never goes below the playable minimum', () => {
    expect(fittedBoardWidth(390, 50, 9 / 10)).toBe(160);
  });
});
