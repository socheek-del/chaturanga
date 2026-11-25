/** Source-derived 8×8 Dameo coordinate masks and standard starting position. */
export { Game } from './game';
export { FenError, IllegalMoveError } from '@chaturanga/rules-core';
export { dameo } from './variant';
export { START_FEN, parseFen, placementOf, serializeFen, square } from './position';
export {
  BLACK_SETUP,
  BOARD_CELLS,
  BOARD_SIZE,
  FILE_NAMES,
  FILES,
  RANKS,
  STARTING_SQUARES,
  WHITE_SETUP,
  squareAt,
  squareName,
} from './layout';
