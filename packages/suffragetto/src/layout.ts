import { squareNameOf, type Square } from '@chaturanga/rules-core';

export const FILES = 17;
export const RANKS = 17;
export const BOARD_SIZE = FILES * RANKS;
export const BOARD_CELLS: readonly Square[] = Object.freeze(Array.from({ length: BOARD_SIZE }, (_, square) => square));

const FILE_LETTERS = 'abcdefghijklmnopq';

export function squareAt(file: string, rank: number): Square {
  const fileIndex = FILE_LETTERS.indexOf(file);
  if (fileIndex < 0 || fileIndex >= FILES || !Number.isInteger(rank) || rank < 1 || rank > RANKS)
    throw new RangeError(`Invalid Suffragetto coordinate: ${file}${rank}`);
  return (rank - 1) * FILES + fileIndex;
}

export const squareName = (target: Square): string => squareNameOf(target, FILES);
export const fileOf = (target: Square): number => target % FILES;
/** Zero-based rank index, matching the engine's square-array representation. */
export const rankOf = (target: Square): number => Math.floor(target / FILES);
export const onBoard = (file: number, rank: number): boolean =>
  Number.isInteger(file) && Number.isInteger(rank) && file >= 0 && file < FILES && rank >= 0 && rank < RANKS;

function rectangle(firstFile: string, lastFile: string, firstRank: number, lastRank: number): readonly Square[] {
  const result: Square[] = [];
  for (let rank = firstRank; rank <= lastRank; rank++) {
    for (let file = FILE_LETTERS.indexOf(firstFile); file <= FILE_LETTERS.indexOf(lastFile); file++)
      result.push(squareAt(FILE_LETTERS[file]!, rank));
  }
  return Object.freeze(result);
}

function fileRange(file: string, firstRank: number, lastRank: number): readonly Square[] {
  return Object.freeze(Array.from({ length: lastRank - firstRank + 1 }, (_, offset) => squareAt(file, firstRank + offset)));
}

function combine(...groups: readonly (readonly Square[])[]): readonly Square[] {
  return Object.freeze([...new Set(groups.flat())].sort((left, right) => left - right));
}

function asSet(squares: readonly Square[]): ReadonlySet<Square> {
  return new Set(squares);
}

export const HOUSE_OF_COMMONS = rectangle('h', 'j', 13, 14);
export const ALBERT_HALL = rectangle('h', 'j', 4, 5);
export const ARENA_ENVELOPE = rectangle('e', 'm', 1, RANKS);
export const PINK_ARENA = Object.freeze(ARENA_ENVELOPE.filter((target) =>
  !HOUSE_OF_COMMONS.includes(target) && !ALBERT_HALL.includes(target)));

export const PRISON = combine(fileRange('a', 1, RANKS), fileRange('b', 14, 17));
export const PRISON_YARD = fileRange('b', 1, 6);
export const HOSPITAL = combine(fileRange('q', 1, RANKS), fileRange('p', 1, 4));
export const HOSPITAL_GROUNDS = fileRange('p', 12, 17);

const houseSet = asSet(HOUSE_OF_COMMONS);
const hallSet = asSet(ALBERT_HALL);
const arenaSet = asSet(PINK_ARENA);
const prisonSet = asSet(PRISON);
const prisonYardSet = asSet(PRISON_YARD);
const hospitalSet = asSet(HOSPITAL);
const hospitalGroundsSet = asSet(HOSPITAL_GROUNDS);
const restrictedSet = asSet(combine(PRISON, PRISON_YARD, HOSPITAL, HOSPITAL_GROUNDS));

export const ORDINARY_CELLS = Object.freeze(BOARD_CELLS.filter((target) => !restrictedSet.has(target)));

export interface Setup {
  readonly cells: readonly Square[];
  readonly large: readonly Square[];
  readonly small: readonly Square[];
}

const suffragetteCells = combine(rectangle('g', 'g', 4, 4), rectangle('k', 'k', 4, 4),
  rectangle('e', 'g', 5, 5), rectangle('k', 'm', 5, 5), rectangle('c', 'o', 6, 6));
const policeCells = combine(rectangle('c', 'o', 12, 12), rectangle('e', 'g', 13, 13),
  rectangle('k', 'm', 13, 13), rectangle('g', 'g', 14, 14), rectangle('k', 'k', 14, 14));

function setup(cells: readonly Square[], largeNames: readonly string[]): Setup {
  const large = Object.freeze(largeNames.map((name) => squareAt(name[0]!, Number(name.slice(1)))));
  const largeSet = asSet(large);
  return Object.freeze({
    cells,
    large,
    small: Object.freeze(cells.filter((target) => !largeSet.has(target))),
  });
}

export const SUFFRAGETTE_SETUP = setup(suffragetteCells, ['i6', 'c6', 'o6', 'e5', 'm5']);
export const POLICE_SETUP = setup(policeCells, ['i12', 'c12', 'o12', 'e13', 'm13']);

export const isPinkArena = (target: Square): boolean => arenaSet.has(target);
export const isGoalCell = (target: Square): boolean => houseSet.has(target) || hallSet.has(target);
export const isPrisonOrHospital = (target: Square): boolean => prisonSet.has(target) || hospitalSet.has(target);
export const isStagingArea = (target: Square): boolean => prisonYardSet.has(target) || hospitalGroundsSet.has(target);
export const isHoldingOrStagingCell = (target: Square): boolean => restrictedSet.has(target);
