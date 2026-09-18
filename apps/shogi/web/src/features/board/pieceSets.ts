import type { Piece } from '@chaturanga/shogi';

/**
 * The three ways this site can draw a piece (sg-012).
 *
 * `kanji` is what a real Shogi set looks like and stays the default. `symbols` and `letters` exist because a
 * beginner who does not read Japanese cannot tell 桂 from 香 — they are the two conventions non-Japanese
 * players use. The symbol diagrams are drawn from the tables below, which the tests check against the engine's
 * own move generation, so a symbol can never show a move the piece does not have.
 */
export type PieceSetId = 'kanji' | 'symbols' | 'letters';

export const PIECE_SETS: readonly PieceSetId[] = ['kanji', 'symbols', 'letters'];

/** The eight directions, as seen by the piece's owner: north is forward. */
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
  /** One square in these directions. */
  steps: readonly Direction[];
  /** Any distance in these directions. */
  slides: readonly Direction[];
  /** Jumps, as (file, rank) offsets from the piece; only the knight has any. */
  jumps?: ReadonlyArray<readonly [number, number]>;
}

const GOLD: PieceMoves = { steps: ['n', 'ne', 'e', 's', 'w', 'nw'], slides: [] };

/** What each piece does, keyed as `type` or `+type`. Checked against the engine in pieceSets.test.ts. */
export const PIECE_MOVES: Readonly<Record<string, PieceMoves>> = {
  k: { steps: ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'], slides: [] },
  r: { steps: [], slides: ['n', 'e', 's', 'w'] },
  b: { steps: [], slides: ['ne', 'se', 'sw', 'nw'] },
  g: GOLD,
  s: { steps: ['n', 'ne', 'se', 'sw', 'nw'], slides: [] },
  n: { steps: [], slides: [], jumps: [[-1, 2], [1, 2]] },
  l: { steps: [], slides: ['n'] },
  p: { steps: ['n'], slides: [] },
  '+r': { steps: ['ne', 'se', 'sw', 'nw'], slides: ['n', 'e', 's', 'w'] },
  '+b': { steps: ['n', 'e', 's', 'w'], slides: ['ne', 'se', 'sw', 'nw'] },
  '+s': GOLD,
  '+n': GOLD,
  '+l': GOLD,
  '+p': GOLD,
};

/** Key into PIECE_MOVES and the letter table. */
export const pieceKey = (piece: Piece): string => (piece.promoted ? `+${piece.type}` : piece.type);

/**
 * Latin letters, as Western Shogi books and engine output write them: the piece's letter, with `+` for a
 * promoted piece. They match the SAN this site's move list shows.
 */
export const PIECE_LETTERS: Readonly<Record<string, string>> = {
  k: 'K',
  r: 'R',
  b: 'B',
  g: 'G',
  s: 'S',
  n: 'N',
  l: 'L',
  p: 'P',
  '+r': '+R',
  '+b': '+B',
  '+s': '+S',
  '+n': '+N',
  '+l': '+L',
  '+p': '+P',
};
