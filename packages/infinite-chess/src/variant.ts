import type { Variant } from '@chaturanga/rules-core';
import { Game } from './game';
import { START_FEN } from './fen';

/** InfiniteChess.org's official Classical default with an unbounded square lattice. */
export const infiniteChess = {
  id: 'infinite-chess',
  files: 0,
  ranks: 0,
  boardTopology: 'unbounded',
  startFen: START_FEN,
  pieceTypes: ['k', 'q', 'r', 'b', 'n', 'p'],
  hasHands: false,
  createGame: (fen?: string) => new Game(fen),
} satisfies Variant<Game>;
