import type { Variant } from '@chaturanga/rules-core';
import { START_FEN } from './fen';
import { Game } from './game';

/** Shogi as a rules-core Variant, so server, AI and UI code can hold it without knowing Shogi rules. */
export const shogi = {
  id: 'shogi',
  files: 9,
  ranks: 9,
  startFen: START_FEN,
  pieceTypes: ['k', 'r', 'b', 'g', 's', 'n', 'l', 'p'],
  hasHands: true,
  // Hands fill from captures during play, so a non-empty hand never means a setup phase (plat-012).
  hasSetupPhase: false,
  createGame: (fen?: string) => new Game(fen),
} satisfies Variant<Game>;
