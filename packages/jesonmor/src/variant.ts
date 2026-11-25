import type { Variant } from '@chaturanga/rules-core';
import { BLACK_TO_MOVE_FEN, START_FEN } from './fen';
import { Game } from './game';

export const jesonMor = {
  id: 'jesonmor',
  files: 9,
  ranks: 9,
  startFen: START_FEN,
  startFens: [START_FEN, BLACK_TO_MOVE_FEN],
  pieceTypes: ['n'],
  hasHands: false,
  createGame: (fen?: string) => new Game(fen),
} satisfies Variant<Game>;
