import type { Color, GameStatus, Piece, Square } from './types';

/** What every rules engine records for a played move. */
export interface VariantMoveRecord {
  /** Fairy-Stockfish coordinate notation, e.g. `e3e4`, `a5a6m`, `h5g4f`, `K@h3`. */
  uci: string;
  san: string;
  color: Color;
  /** The piece that moved or was placed, as it was before any promotion. */
  piece: Piece;
  captured: Piece | null;
  /** Destination square; the placement square for a drop. */
  to: Square;
  fenAfter: string;
}

/**
 * A game in progress. Moves are strings end to end (protocol, server, stores, URLs), so only the rules
 * engine ever parses them.
 */
export interface VariantGame {
  readonly turn: Color;
  fen(): string;
  pieceAt(square: Square): Piece | null;
  pieces(): Array<{ square: Square; piece: Piece }>;
  /** Piece types a side still holds in hand (setup placements, drops); always empty without hands. */
  hand(color: Color): readonly string[];
  legalUci(): string[];
  /** Plays a move in coordinate notation; throws IllegalMoveError. */
  move(uci: string): VariantMoveRecord;
  undo(): VariantMoveRecord | null;
  moves(): VariantMoveRecord[];
  lastMove(): VariantMoveRecord | null;
  status(): GameStatus;
  isGameOver(): boolean;
  inCheck(): boolean;
  /** Square of the side-to-move's king if it is in check, otherwise null. */
  checkedKingSquare(): Square | null;
  /** Running count of a counting rule, in plies; null when no count is running. */
  counting(): { limitPlies: number; plies: number } | null;
}

export interface Variant<G extends VariantGame = VariantGame> {
  /** Stable id used in protocol messages and storage, e.g. 'makruk', 'sittuyin'. */
  readonly id: string;
  readonly files: number;
  readonly ranks: number;
  readonly startFen: string;
  /** Lower-case FEN letters of the piece types this variant uses. */
  readonly pieceTypes: readonly string[];
  /** True when pieces can be held in hand and placed (Sittuyin setup, Shogi drops). */
  readonly hasHands: boolean;
  /**
   * True when a non-empty hand means the game has not started yet, as in Sittuyin, where both sides place
   * their pieces before the first move. False for a game whose hands fill from captures during play
   * (Shogi). Left out it follows `hasHands`, which is what the first games with hands meant.
   */
  readonly hasSetupPhase?: boolean;
  /** Creates a game from a FEN, by default the start position; throws FenError. */
  createGame(fen?: string): G;
}

/** Whether a non-empty hand in this variant means a setup phase rather than pieces to drop in play. */
export function usesSetupPhase(variant: Pick<Variant, 'hasHands' | 'hasSetupPhase'>): boolean {
  return variant.hasSetupPhase ?? variant.hasHands;
}
