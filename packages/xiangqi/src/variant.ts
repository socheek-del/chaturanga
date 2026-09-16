import type { Variant } from '@chaturanga/rules-core';
import { START_FEN } from './fen';
import { Game } from './game';

/** Xiangqi as a rules-core Variant, so server, AI and UI code can hold it without knowing Xiangqi rules. */
export const xiangqi = {
  id: 'xiangqi',
  files: 9,
  ranks: 10,
  startFen: START_FEN,
  pieceTypes: ['k', 'a', 'b', 'n', 'r', 'c', 'p'],
  hasHands: false,
  createGame: (fen?: string) => new Game(fen),
} satisfies Variant<Game>;
