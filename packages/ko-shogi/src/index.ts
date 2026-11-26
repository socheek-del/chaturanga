export { Game, koShogi, koShogiVariant } from './game';
export { BOARD_SIZE, FILES, PIECE_TYPES, RANKS, STARTING_PIECES, squareName, squareOf, type PieceType } from './position';
export { fenOf, parseFen, placementOf, positionKey, startingPosition, makePiece, type Board, type Piece, type Position } from './position';
export { generateActions, attackedSquares, commandOutcome, winnerForCommand, attacksSoleObjective, destinationOfMove } from './movement';
export type { Candidate } from './movement';
