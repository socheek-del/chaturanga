import { type Square, squareOf } from '@chaturanga/rules-core';

// Re-exported so existing board-ui consumers are unchanged; the canonical definitions moved to
// rules-core (plat-007) so the lesson player and the conformance suite can use them too.
export { squareNameOf, squareOf } from '@chaturanga/rules-core';

export type ParsedMove =
  /** `R@a1`: a piece placed from hand (type in lower case). */
  | { kind: 'drop'; type: string; to: Square; uci: string }
  /**
   * `e3e4`, promotion with a suffix letter (`a5a6m`, `h5g4f`, `e7e8q`) or `+` (`g8g9+`), in place when from
   * equals to. `promotion` is the suffix itself, so a game with a choice of pieces (chess) can tell its
   * promotions apart; `null` when the move does not promote.
   */
  | { kind: 'move'; from: Square; to: Square; path: Square[]; promotion: string | null; uci: string };

/** Parses an engine move in Fairy-Stockfish coordinate notation. */
export function parseUci(uci: string, files: number): ParsedMove | null {
  const drop = /^([A-Z])@([a-p]\d{1,2})$/.exec(uci);
  if (drop) {
    const to = squareOf(drop[2]!, files);
    return to === null ? null : { kind: 'drop', type: drop[1]!.toLowerCase(), to, uci };
  }
  const promotionMatch = /([a-z+])$/.exec(uci);
  const promotion = promotionMatch?.[1] ?? null;
  const coordinates = promotion ? uci.slice(0, -promotion.length) : uci;
  const names = coordinates.match(/[a-p]\d{1,2}/g);
  if (!names || names.length < 2 || names.join('') !== coordinates) return null;
  const path = names.slice(1).map((name) => squareOf(name, files));
  const from = squareOf(names[0]!, files);
  if (from === null || from < 0 || path.some((square) => square === null || square < 0)) return null;
  const squares = path as Square[];
  return { kind: 'move', from, to: squares.at(-1)!, path: squares, promotion, uci };
}
