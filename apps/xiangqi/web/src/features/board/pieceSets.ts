import type { Piece } from '@chaturanga/xiangqi';

/**
 * The three ways this site can draw a piece (xq-012).
 *
 * `characters` is what a real Xiangqi set looks like and stays the default. `symbols` and `letters` exist
 * because a beginner who does not read Chinese cannot tell 傌 from 俥 — they are the two conventions
 * non-Chinese players use. The symbol diagrams are drawn from the tables below, which the tests compare with
 * the engine's own move generation, so a symbol can never show a move the piece does not have.
 */
export type PieceSetId = 'characters' | 'symbols' | 'letters';

export const PIECE_SETS: readonly PieceSetId[] = ['characters', 'symbols', 'letters'];

/** The eight directions, as seen by the piece's owner: north is forward, towards the river. */
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
  /** Leaps, as (file, rank) offsets from the piece: the horse's eight, the elephant's four. */
  jumps?: ReadonlyArray<readonly [number, number]>;
  /** Drawn as a hollow ring beyond the arrow: the cannon captures over a screen. */
  screen?: boolean;
}

/**
 * What each piece does with nothing in its way, keyed by piece type. A general and an advisor never leave
 * the palace, an elephant never crosses the river, and a soldier gains its sideways steps only after
 * crossing — the board decides that, so the diagram shows the piece's own pattern.
 */
export const PIECE_MOVES: Readonly<Record<string, PieceMoves>> = {
  k: { steps: ['n', 'e', 's', 'w'], slides: [] },
  a: { steps: ['ne', 'se', 'sw', 'nw'], slides: [] },
  b: {
    steps: [],
    slides: [],
    jumps: [
      [2, 2],
      [2, -2],
      [-2, 2],
      [-2, -2],
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
  p: { steps: ['n'], slides: [] },
};

export const pieceKey = (piece: Piece): string => piece.type;

/**
 * Latin letters, as English Xiangqi books and this site's move list write them: K for the General, A for an
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
