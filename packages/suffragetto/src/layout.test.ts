import { describe, expect, it } from 'vitest';
import {
  ALBERT_HALL,
  ARENA_ENVELOPE,
  BOARD_CELLS,
  BOARD_SIZE,
  FILES,
  HOSPITAL,
  HOSPITAL_GROUNDS,
  HOUSE_OF_COMMONS,
  ORDINARY_CELLS,
  PINK_ARENA,
  POLICE_SETUP,
  PRISON,
  PRISON_YARD,
  RANKS,
  SUFFRAGETTE_SETUP,
  isGoalCell,
  isHoldingOrStagingCell,
  isPinkArena,
  isPrisonOrHospital,
  isStagingArea,
  squareAt,
  squareName,
} from './layout';

describe('Suffragetto board transcription', () => {
  it('defines all 289 cells using a1 as the bottom-left coordinate', () => {
    expect(FILES).toBe(17);
    expect(RANKS).toBe(17);
    expect(BOARD_SIZE).toBe(289);
    expect(BOARD_CELLS).toHaveLength(289);
    expect(new Set(BOARD_CELLS).size).toBe(289);
    expect(squareAt('a', 1)).toBe(0);
    expect(squareAt('q', 17)).toBe(288);
    expect(squareName(squareAt('q', 17))).toBe('q17');
  });

  it('keeps the goal buildings out of the pink Arena mask', () => {
    expect(ARENA_ENVELOPE).toHaveLength(153);
    expect(HOUSE_OF_COMMONS).toHaveLength(6);
    expect(ALBERT_HALL).toHaveLength(6);
    expect(PINK_ARENA).toHaveLength(141);
    expect(PINK_ARENA.every((target) => !isGoalCell(target))).toBe(true);
    expect(isPinkArena(squareAt('e', 1))).toBe(true);
    expect(isPinkArena(squareAt('m', 17))).toBe(true);
    expect(isPinkArena(squareAt('h', 13))).toBe(false);
    expect(isPinkArena(squareAt('j', 5))).toBe(false);
  });

  it('records the 21-cell holdings and six-cell staging areas', () => {
    expect(PRISON).toHaveLength(21);
    expect(HOSPITAL).toHaveLength(21);
    expect(PRISON_YARD).toHaveLength(6);
    expect(HOSPITAL_GROUNDS).toHaveLength(6);
    expect(new Set([...PRISON, ...PRISON_YARD, ...HOSPITAL, ...HOSPITAL_GROUNDS]).size).toBe(54);
    expect(ORDINARY_CELLS).toHaveLength(235);
    for (const target of [...PRISON, ...HOSPITAL]) expect(isPrisonOrHospital(target)).toBe(true);
    for (const target of [...PRISON_YARD, ...HOSPITAL_GROUNDS]) expect(isStagingArea(target)).toBe(true);
    expect(isHoldingOrStagingCell(squareAt('b', 8))).toBe(false);
    expect(isHoldingOrStagingCell(squareAt('p', 11))).toBe(false);
  });

  it('matches all 21 marked starting cells and large-piece placement for both sides', () => {
    expect(SUFFRAGETTE_SETUP.cells).toHaveLength(21);
    expect(SUFFRAGETTE_SETUP.large.map(squareName)).toEqual(['i6', 'c6', 'o6', 'e5', 'm5']);
    expect(SUFFRAGETTE_SETUP.small).toHaveLength(16);
    expect(POLICE_SETUP.cells).toHaveLength(21);
    expect(POLICE_SETUP.large.map(squareName)).toEqual(['i12', 'c12', 'o12', 'e13', 'm13']);
    expect(POLICE_SETUP.small).toHaveLength(16);
    const mirror = (target: number) => (RANKS - 1 - Math.floor(target / FILES)) * FILES + target % FILES;
    expect(POLICE_SETUP.cells).toEqual(SUFFRAGETTE_SETUP.cells.map(mirror).sort((left, right) => left - right));
    expect([...SUFFRAGETTE_SETUP.cells, ...POLICE_SETUP.cells].every((target) => !isHoldingOrStagingCell(target))).toBe(true);
  });

  it('rejects invalid file and rank coordinates', () => {
    expect(() => squareAt('r', 1)).toThrow(RangeError);
    expect(() => squareAt('a', 0)).toThrow(RangeError);
    expect(() => squareAt('q', 18)).toThrow(RangeError);
  });
});
