import type { Piece } from '@chaturanga/janggi';

/**
 * The four ways this site can draw a piece (jg-004).
 *
 * `characters` is what a real Janggi set looks like and stays the default. `hangul` says the same in Korean
 * script; `symbols` and `letters` are for players who read neither. The symbol diagrams are drawn from the
 * tables below, which the tests compare with the engine's own move generation, so a symbol can never show a
 * move the piece does not have.
 */
export type PieceSetId = 'characters' | 'hangul' | 'symbols' | 'letters';

export const PIECE_SETS: readonly PieceSetId[] = ['characters', 'hangul', 'symbols', 'letters'];

/** The eight directions, as seen by the piece's owner: north is forward, towards the enemy. */
export type Direction = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

export const DIRECTION_VECTOR: Readonly<Record<Direction, readonly [number, number]>> = {
  n: [0, -1],
  ne: [1, -1],
  e: [1, 0],
  se: [1, 1],
  s: [0, 1],
  sw: [-1, 1],
  w: [-1, 0],
  nw: [-1, -1],
};

export interface PieceMoves {
  /** One point in these directions. */
  steps: readonly Direction[];
  /** Any distance in these directions. */
  slides: readonly Direction[];
  /** Leaps, as (file, rank) offsets from the piece: the horse's eight and the elephant's eight. */
  jumps?: ReadonlyArray<readonly [number, number]>;
  /** Drawn as a hollow ring before the arrow: the cannon only moves by jumping a piece. */
  screen?: boolean;
}

/**
 * What each piece does with nothing in its way, keyed by piece type. A general and an advisor step along the
 * lines of the palace (all eight from its centre, as drawn here) and never leave it, and inside a palace
 * chariots, cannons and soldiers also use the diagonals: the board decides that.
 */
export const PIECE_MOVES: Readonly<Record<string, PieceMoves>> = {
  k: { steps: ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'], slides: [] },
  a: { steps: ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'], slides: [] },
  b: {
    steps: [],
    slides: [],
    jumps: [
      [2, 3],
      [3, 2],
      [3, -2],
      [2, -3],
      [-2, -3],
      [-3, -2],
      [-3, 2],
      [-2, 3],
    ],
  },
  n: {
    steps: [],
    slides: [],
    jumps: [
      [1, 2],
      [2, 1],
      [2, -1],
      [1, -2],
      [-1, -2],
      [-2, -1],
      [-2, 1],
      [-1, 2],
    ],
  },
  r: { steps: [], slides: ['n', 'e', 's', 'w'] },
  c: { steps: [], slides: ['n', 'e', 's', 'w'], screen: true },
  p: { steps: ['n', 'e', 'w'], slides: [] },
};

export const pieceKey = (piece: Piece): string => piece.type;

/**
 * Latin letters, as this site's move list writes them: K for the General, A for an
 * Advisor, E for an Elephant, H for a Horse, R for a Chariot, C for a Cannon, P for a Soldier.
 */
export const PIECE_LETTERS: Readonly<Record<string, string>> = {
  k: 'K',
  a: 'A',
  b: 'E',
  n: 'H',
  r: 'R',
  c: 'C',
  p: 'P',
};
