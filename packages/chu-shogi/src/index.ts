export { Game, chuShogi, chuShogiVariant } from './game';
export { FenError, IllegalMoveError } from '@chaturanga/rules-core';
export { START_FEN, PIECE_TYPES, fenOf, makePiece, parseFen, square } from './position';
export { START_POSITION, keyOf, opposite, placementOf, startingPosition } from './position';
export type { Board, Counterstrike, Piece, PieceType, Position } from './position';
export {
  applyMove,
  attackedSquares,
  generateMoves,
  isLastRank,
  isPromotionZone,
  isRoyalPiece,
  legalMoves,
  promotionAvailable,
  royalSquares,
  squareAttackedBy,
} from './movement';
export type { Capture, Move } from './movement';
export {
  BASE_PIECE_TYPES,
  BOARD_CELLS,
  BOARD_SIZE,
  FILES,
  FILE_NAMES,
  RANKS,
  STARTING_PIECES,
  coordinateOf,
  fileOf,
  onBoard,
  rankOf,
  squareAt,
  squareName,
} from './layout';
export type { BasePieceType, Coordinate, SetupPiece } from './layout';
