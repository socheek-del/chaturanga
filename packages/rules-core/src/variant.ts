import type { Color, GameStatus, Piece, Square } from './types';
import { IllegalMoveError } from './errors';

/** What every rules engine records for a played move. */
export interface VariantMoveRecord<C extends string = Color> {
  /** Fairy-Stockfish coordinate notation, e.g. `e3e4`, `a5a6m`, `h5g4f`, `K@h3`. */
  uci: string;
  san: string;
  color: C;
  /** The piece that moved or was placed, as it was before any promotion. */
  piece: Piece<string, C>;
  captured: Piece<string, C> | null;
  /** The action kind when a variant has captures or drops that do not follow ordinary board movement. */
  action?: 'move' | 'capture' | 'drop' | 'pass' | 'roll';
  /** Additional pieces removed by a multi-capture move, in route order. */
  captures?: Piece<string, C>[];
  /** True when a legal move's mover is removed at turn end, as with Congo river drowning. */
  movedPieceRemoved?: boolean;
  /** The final coordinate may contain an opposing piece when a multi-piece turn ends with a pull. */
  multiPieceMove?: boolean;
  /** Destination square; the placement square for a drop. Non-board actions use -1. */
  to: Square;
  fenAfter: string;
}

/**
 * A game in progress. Moves are strings end to end (protocol, server, stores, URLs), so only the rules
 * engine ever parses them.
 */
export interface VariantGame<C extends string = Color> {
  readonly turn: C;
  /** Seats allowed to act in the current phase; omitted for ordinary turn-taking games. */
  activePlayers?(): readonly C[];
  fen(): string;
  pieceAt(square: Square): Piece<string, C> | null;
  pieces(): Array<{ square: Square; piece: Piece<string, C> }>;
  /** Piece types a side still holds in hand (setup placements, drops); always empty without hands. */
  hand(color: C): readonly string[];
  legalUci(): string[];
  /** Legal actions for a seat during a concurrent phase; omitted when only `turn` may act. */
  legalUciFor?(color: C): string[];
  /** Plays a move in coordinate notation; throws IllegalMoveError. */
  move(uci: string): VariantMoveRecord<C>;
  /** Applies a validated action on behalf of `color` during a concurrent phase. */
  moveFor?(color: C, uci: string): VariantMoveRecord<C>;
  /** Applies a chance event from an injected seed when the game is waiting for one, if applicable. */
  prepareTurn?(seed: number): VariantMoveRecord<C> | null;
  undo(): VariantMoveRecord<C> | null;
  moves(): VariantMoveRecord<C>[];
  lastMove(): VariantMoveRecord<C> | null;
  status(): GameStatus<C>;
  isGameOver(): boolean;
  inCheck(): boolean;
  /** Square of the side-to-move's king if it is in check, otherwise null. */
  checkedKingSquare(): Square | null;
  /**
   * Every square a piece of `color` on the board attacks: where it could capture an enemy piece standing
   * there, ignoring pins and whose turn it is. Squares holding `color`'s own pieces count (they are
   * defended). Pieces in hand attack nothing. Drives the attack-map overlay (plat-015).
   */
  attackedSquares(color: C): Square[];
  /** Running count of a counting rule, in plies; null when no count is running. */
  counting(): { limitPlies: number; plies: number } | null;
}

export interface Variant<G extends VariantGame<string> = VariantGame> {
  /** Stable id used in protocol messages and storage, e.g. 'makruk', 'sittuyin'. */
  readonly id: string;
  readonly files: number;
  readonly ranks: number;
  /** If provided, identifies the playable cells inside the rectangular coordinate grid. */
  readonly isPlayable?: (square: Square) => boolean;
  readonly startFen: string;
  /**
   * Every position a game may start from, when players choose how to set out their pieces (Janggi). Left out,
   * `startFen` is the only one. The server accepts no other start for an online room.
   */
  readonly startFens?: readonly string[];
  /** Lower-case FEN letters of the piece types this variant uses. */
  readonly pieceTypes: readonly string[];
  /** Seats in turn order. Omitted for the traditional White/Black pair. */
  readonly players?: readonly G['turn'][];
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

/** The seat-specific form of a move, needed when multiple seats can act before the turn changes. */
export interface VariantAction<C extends string = Color> {
  color: C;
  uci: string;
}

/** The seats that may act now; ordinary variants keep their existing `turn` behavior. */
export function activePlayers<G extends VariantGame<string>>(game: G): readonly string[] {
  return game.activePlayers?.() ?? [game.turn];
}

/** Legal actions for a seat, with a turn-based default for existing games. */
export function legalUciFor<G extends VariantGame<string>>(game: G, color: string): string[] {
  if (game.legalUciFor) return game.legalUciFor(color);
  return game.turn === color ? game.legalUci() : [];
}

/** Applies a move for a specific seat while preserving the ordinary turn-based default. */
export function moveFor<G extends VariantGame<string>>(game: G, color: string, uci: string): VariantMoveRecord<string> {
  if (game.moveFor) return game.moveFor(color, uci);
  if (game.turn !== color) throw new IllegalMoveError(uci);
  return game.move(uci);
}

/** Rebuilds a game from coordinate moves and their actors. Older turn-based histories omit actors. */
export function replayVariantMoves<G extends VariantGame<string>>(
  variant: Variant<G>,
  startFen: string,
  moves: readonly string[],
  actors?: readonly string[],
): G {
  if (actors && actors.length !== moves.length) throw new RangeError('Move actor history must match move history');
  const game = variant.createGame(startFen);
  for (let index = 0; index < moves.length; index++) {
    const uci = moves[index]!;
    const actor = actors?.[index];
    if (actor === undefined) game.move(uci);
    else moveFor(game, actor, uci);
  }
  return game;
}

/** Whether a non-empty hand in this variant means a setup phase rather than pieces to drop in play. */
export function usesSetupPhase(variant: Pick<Variant, 'hasHands' | 'hasSetupPhase'>): boolean {
  return variant.hasSetupPhase ?? variant.hasHands;
}
