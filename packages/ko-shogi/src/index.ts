export { Game, koShogi, koShogiVariant } from './game';
export { BASE_PIECE_TYPES, BOARD_SIZE, FILES, PIECE_TYPES, PROMOTION_OF, RANKS, STARTING_PIECES, squareName, squareOf, type PieceType } from './position';
export { fenOf, parseFen, placementOf, positionKey, startingPosition, makePiece, type Board, type Piece, type Position } from './position';
export type { Square } from '@chaturanga/rules-core';
export { generateActions, attackedSquares, commandOutcome, winnerForCommand, attacksSoleObjective, destinationOfMove } from './movement';
export type { Candidate } from './movement';
