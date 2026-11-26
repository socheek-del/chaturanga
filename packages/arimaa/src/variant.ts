import type { Variant } from '@chaturanga/rules-core';
import { PIECE_TYPES } from './board';
import { START_FEN } from './fen';
import { Game } from './game';

export const arimaa = {
  id: 'arimaa',
  files: 8,
  ranks: 8,
  startFen: START_FEN,
  pieceTypes: [...PIECE_TYPES],
  hasHands: true,
  hasSetupPhase: true,
  createGame: (fen?: string) => new Game(fen),
} satisfies Variant<Game>;
