import type { Variant } from '@chaturanga/rules-core';
import { START_FEN, START_FENS } from './fen';
import { Game } from './game';

/** Janggi as a rules-core Variant, so server, AI and UI code can hold it without knowing Janggi rules. */
export const janggi = {
  id: 'janggi',
  files: 9,
  ranks: 10,
  startFen: START_FEN,
  startFens: START_FENS,
  pieceTypes: ['k', 'a', 'b', 'n', 'r', 'c', 'p'],
  hasHands: false,
  createGame: (fen?: string) => new Game(fen),
} satisfies Variant<Game>;
