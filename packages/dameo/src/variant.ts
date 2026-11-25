import type { Variant } from '@chaturanga/rules-core';
import { START_FEN } from './position';
import { Game } from './game';

export const dameo = {
  id: 'dameo',
  files: 8,
  ranks: 8,
  startFen: START_FEN,
  pieceTypes: ['m', 'k'],
  hasHands: false,
  createGame: (fen?: string) => new Game(fen),
} satisfies Variant<Game>;
