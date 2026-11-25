/** Pure rules and coordinate masks for the surviving Sargeant Bros. second-edition Suffragetto board. */
export { Game, suffragetto, suffragettoVariant } from './game';
export { FenError, IllegalMoveError } from '@chaturanga/rules-core';
export {
  PIECE_TYPES,
  START_FEN,
  POLICE_START_FEN,
  parseFen,
  square,
} from './position';
export type { Piece, PieceType } from './position';
/** Source-derived immutable coordinate masks for the historic board. */
export {
  ALBERT_HALL,
  ARENA_ENVELOPE,
  BOARD_CELLS,
  BOARD_SIZE,
  FILES,
  HOSPITAL,
  HOSPITAL_GROUNDS,
  HOUSE_OF_COMMONS,
  ORDINARY_CELLS,
  PINK_ARENA,
  POLICE_SETUP,
  PRISON,
  PRISON_YARD,
  RANKS,
  SUFFRAGETTE_SETUP,
  fileOf,
  isGoalCell,
  isHoldingOrStagingCell,
  isPinkArena,
  isPrisonOrHospital,
  isStagingArea,
  onBoard,
  rankOf,
  squareAt,
  squareName,
} from './layout';
export type { Setup } from './layout';
