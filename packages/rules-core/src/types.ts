export type Color = 'w' | 'b';

/** 0..63 with a1 = 0, b1 = 1, …, h8 = 63. */
export type Square = number;

export interface Piece<T extends string = string, C extends string = Color> {
  color: C;
  /** FEN letter in lower case, e.g. 'k'. */
  type: T;
  /** True for a piece that reached its type by promotion. */
  promoted: boolean;
}

/** Every way a game can end across the supported variants; each variant reports a subset. */
export type GameStatus<C extends string = Color> =
  | { kind: 'ongoing' }
  | { kind: 'checkmate'; winner: C }
  /** A draw for Makruk and Sittuyin; a win for the side left with moves in a variant like Xiangqi. */
  | { kind: 'stalemate'; winner?: C }
  /** A draw, unless the variant settles it by points (Janggi): then that side wins. */
  | { kind: 'repetition'; winner?: C }
  /** A counting rule's limit ran out before mate. */
  | { kind: 'counting' }
  /** A draw, unless the variant settles it by points (Janggi). */
  | { kind: 'fifty-move'; winner?: C }
  /** Neither side can force mate (Fairy-Stockfish insufficient-material rule). */
  | { kind: 'insufficient-material' }
  /** A king was left without other pieces. The variant may award a win or draw. */
  | { kind: 'bare-king'; winner?: C }
  /** A repeated position where the same side repeats check indefinitely; that side loses (Xiangqi). */
  | { kind: 'perpetual-check'; winner: C }
  /** A repeated position where the same side repeats an illegal chase indefinitely; that side loses (Xiangqi). */
  | { kind: 'perpetual-chase'; winner: C }
  /** The generals faced each other for two positions in a row; the points decide (Janggi). */
  | { kind: 'bikjang'; winner: C }
  /** Both sides passed in a row; the points decide (Janggi). */
  | { kind: 'double-pass'; winner: C };
