import type { Variant } from '@chaturanga/rules-core';
import { START_FEN } from './fen';
import { Game } from './game';

/** Chess as a rules-core Variant, so server, AI and UI code can hold it without knowing chess rules. */
export const chess = {
  id: 'chess',
  files: 8,
  ranks: 8,
  startFen: START_FEN,
  pieceTypes: ['k', 'q', 'r', 'b', 'n', 'p'],
  hasHands: false,
  createGame: (fen?: string) => new Game(fen),
} satisfies Variant<Game>;
