import { type Square, squareOf } from '@chaturanga/rules-core';

// Re-exported so existing board-ui consumers are unchanged; the canonical definitions moved to
// rules-core (plat-007) so the lesson player and the conformance suite can use them too.
export { squareNameOf, squareOf } from '@chaturanga/rules-core';

export type ParsedMove =
  /** `R@a1`: a piece placed from hand (type in lower case). */
  | { kind: 'drop'; type: string; to: Square; uci: string }
  /** `e3e4`, promotion with a suffix letter (`a5a6m`, `h5g4f`) or `+` (`g8g9+`), in place when from equals to. */
  | { kind: 'move'; from: Square; to: Square; promotion: boolean; uci: string };

/** Parses an engine move in Fairy-Stockfish coordinate notation. */
export function parseUci(uci: string, files: number): ParsedMove | null {
  const drop = /^([A-Z])@([a-p]\d{1,2})$/.exec(uci);
  if (drop) {
    const to = squareOf(drop[2]!, files);
    return to === null ? null : { kind: 'drop', type: drop[1]!.toLowerCase(), to, uci };
  }
  const move = /^([a-p]\d{1,2})([a-p]\d{1,2})([a-z+]?)$/.exec(uci);
  if (!move) return null;
  const from = squareOf(move[1]!, files);
  const to = squareOf(move[2]!, files);
  if (from === null || to === null) return null;
  return { kind: 'move', from, to, promotion: move[3] !== '', uci };
}
