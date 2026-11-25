import type { Variant } from '@chaturanga/rules-core';
import { FILES, RANKS } from './layout';
import { Game } from './game';
import { PIECE_TYPES, START_FEN } from './position';

/** The linked article's described most-common Rithmomachia rules family, with digital conventions in RULES.md. */
export const rithmomachia = {
  id: 'rithmomachia',
  files: FILES,
  ranks: RANKS,
  startFen: START_FEN,
  pieceTypes: PIECE_TYPES,
  players: ['b', 'w'],
  hasHands: true,
  hasSetupPhase: false,
  createGame: (fen?: string) => new Game(fen),
} satisfies Variant<Game>;
