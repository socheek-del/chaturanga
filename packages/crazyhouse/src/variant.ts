import type { Variant } from '@chaturanga/rules-core';
import { START_FEN } from './fen';
import { Game } from './game';

/** Standard Crazyhouse as a rules-core Variant. */
export const crazyhouse = {
  id: 'crazyhouse',
  files: 8,
  ranks: 8,
  startFen: START_FEN,
  pieceTypes: ['k', 'q', 'r', 'b', 'n', 'p'],
  hasHands: true,
  hasSetupPhase: false,
  createGame: (fen?: string) => new Game(fen),
} satisfies Variant<Game>;
