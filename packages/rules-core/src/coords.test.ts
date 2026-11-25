import { describe, expect, it } from 'vitest';
import { squareNameOf, squareOf } from './coords';

describe('squareNameOf / squareOf', () => {
  it('round-trips an 8x8 board (Makruk/Sittuyin) the same way board8.squareName does', () => {
    expect(squareNameOf(0, 8)).toBe('a1');
    expect(squareNameOf(63, 8)).toBe('h8');
    expect(squareOf('a1', 8)).toBe(0);
    expect(squareOf('h8', 8)).toBe(63);
    for (let sq = 0; sq < 64; sq++) expect(squareOf(squareNameOf(sq, 8), 8)).toBe(sq);
  });

  it('handles a 9x10 board (Xiangqi) with two-digit ranks', () => {
    expect(squareNameOf(0, 9)).toBe('a1');
    expect(squareNameOf(8, 9)).toBe('i1');
    expect(squareNameOf(81, 9)).toBe('a10');
    expect(squareNameOf(89, 9)).toBe('i10');
    expect(squareOf('a10', 9)).toBe(81);
    expect(squareOf('i10', 9)).toBe(89);
    for (let sq = 0; sq < 90; sq++) expect(squareOf(squareNameOf(sq, 9), 9)).toBe(sq);
  });

  it('handles the q-file and two-digit ranks on 17×17 boards', () => {
    expect(squareOf('q17', 17)).toBe(288);
    expect(squareNameOf(288, 17)).toBe('q17');
    for (let sq = 0; sq < 17 * 17; sq++) expect(squareOf(squareNameOf(sq, 17), 17)).toBe(sq);
    expect(squareOf('q1', 16)).toBeNull();
    expect(squareOf('a0', 17)).toBeNull();
  });

  it('rejects names that are not square names', () => {
    expect(squareOf('', 8)).toBeNull();
    expect(squareOf('z1', 8)).toBeNull();
    expect(squareOf('e4x', 8)).toBeNull();
  });
});
