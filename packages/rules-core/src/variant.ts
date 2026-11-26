import type { Color, GameStatus, Piece, Square, VariantSquare } from './types';
import { IllegalMoveError } from './errors';

/** What every rules engine records for a played move. */
export interface VariantMoveRecord<C extends string = Color, S extends VariantSquare = Square> {
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
  to: S | -1;
  fenAfter: string;
}

/**
 * A game in progress. Moves are strings end to end (protocol, server, stores, URLs), so only the rules
 * engine ever parses them.
 */
export interface VariantGame<C extends string = Color, S extends VariantSquare = Square> {
  readonly turn: C;
  /** Seats allowed to act in the current phase; omitted for ordinary turn-taking games. */
  activePlayers?(): readonly C[];
  fen(): string;
  pieceAt(square: S): Piece<string, C> | null;
  /** Enumerates occupied squares only; an unbounded board must remain sparse. */
  pieces(): Array<{ square: S; piece: Piece<string, C> }>;
  /** Piece types a side still holds in hand (setup placements, drops); always empty without hands. */
  hand(color: C): readonly string[];
  /** Complete move list for a bounded game; omitted when the board has infinitely many destinations. */
  legalUci?(): string[];
  /** Complete legal moves whose destination is in this caller-supplied finite set (unbounded boards). */
  legalUciIn?(squares: readonly S[]): string[];
  /** Legal actions for a seat during a concurrent phase; omitted when only `turn` may act. */
  legalUciFor?(color: C): string[];
  /** Plays a move in coordinate notation; throws IllegalMoveError. */
  move(uci: string): VariantMoveRecord<C, S>;
  /** Applies a validated action on behalf of `color` during a concurrent phase. */
  moveFor?(color: C, uci: string): VariantMoveRecord<C, S>;
  /** Applies a chance event from an injected seed when the game is waiting for one, if applicable. */
  prepareTurn?(seed: number): VariantMoveRecord<C, S> | null;
  undo(): VariantMoveRecord<C, S> | null;
  moves(): VariantMoveRecord<C, S>[];
  lastMove(): VariantMoveRecord<C, S> | null;
  status(): GameStatus<C>;
  isGameOver(): boolean;
  inCheck(): boolean;
  /** Square of the side-to-move's king if it is in check, otherwise null. */
  checkedKingSquare(): S | null;
  /**
   * Every square a piece of `color` on the board attacks: where it could capture an enemy piece standing
   * there, ignoring pins and whose turn it is. Squares holding `color`'s own pieces count (they are
   * defended). Pieces in hand attack nothing. Drives the attack-map overlay (plat-015).
   */
  /** Complete attack map for bounded boards; omitted when the set of attacked squares is infinite. */
  attackedSquares?(color: C): S[];
  /** Answers one exact attack query without enumerating an unbounded attack map. */
  isAttackedAt?(color: C, square: S): boolean;
  /** Running count of a counting rule, in plies; null when no count is running. */
  counting(): { limitPlies: number; plies: number } | null;
}

/** The coordinate type a particular rules engine uses. */
export type VariantSquareOf<G extends VariantGame<string, VariantSquare>> =
  G extends VariantGame<string, infer S> ? S : never;

/** Requirements for components that draw or enumerate a bounded board. */
export type FiniteVariantGame<C extends string = Color> = VariantGame<C, Square> & {
  legalUci(): string[];
  attackedSquares(color: C): Square[];
};

export interface Variant<G extends VariantGame<string, VariantSquare> = VariantGame> {
  /** Stable id used in protocol messages and storage, e.g. 'makruk', 'sittuyin'. */
  readonly id: string;
  readonly files: number;
  readonly ranks: number;
  /** Missing means a bounded board. Unbounded variants set files/ranks to 0 and provide sparse square keys. */
  readonly boardTopology?: 'unbounded';
  /** If provided, identifies the playable cells inside the bounded rectangular coordinate grid. */
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
export function activePlayers<G extends VariantGame<string, VariantSquare>>(game: G): readonly string[] {
  return game.activePlayers?.() ?? [game.turn];
}

/** Legal actions for a seat, with a turn-based default for existing games. */
export function legalUciFor<G extends VariantGame<string, VariantSquare>>(game: G, color: string): string[] {
  if (game.legalUciFor) return game.legalUciFor(color);
  return game.turn === color ? game.legalUci?.() ?? [] : [];
}

/** Legal moves to a finite set of destination squares, with a bounded-board fallback. */
export function legalUciInFor<G extends VariantGame<string, VariantSquare>>(
  game: G,
  color: string,
  squares: readonly (G extends VariantGame<string, infer S> ? S : never)[],
): string[] {
  if (game.legalUciIn) return game.turn === color ? game.legalUciIn(squares) : [];
  return game.turn === color ? game.legalUci?.() ?? [] : [];
}

/** Applies a move for a specific seat while preserving the ordinary turn-based default. */
export function moveFor<G extends VariantGame<string, VariantSquare>>(
  game: G,
  color: string,
  uci: string,
): ReturnType<G['move']> {
  if (game.moveFor) return game.moveFor(color, uci) as ReturnType<G['move']>;
  if (game.turn !== color) throw new IllegalMoveError(uci);
  return game.move(uci) as ReturnType<G['move']>;
}

/** Rebuilds a game from coordinate moves and their actors. Older turn-based histories omit actors. */
export function replayVariantMoves<G extends VariantGame<string, VariantSquare>>(
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
