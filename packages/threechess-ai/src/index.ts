import { Game, hexOf, parseSquare, type PieceType, type Player } from '@chaturanga/threechess';

const seats = ['w', 'b', 'r'] as const;
const material: Record<PieceType, number> = { p: 100, n: 310, b: 350, r: 550, q: 900, k: 0 };
const decisive = 20_000;
type Scores = Record<Player, number>;

function evaluate(game: Game): Scores {
  const status = game.status();
  if (status.kind === 'checkmate') {
    return { w: status.winner === 'w' ? decisive : -decisive,
      b: status.winner === 'b' ? decisive : -decisive, r: status.winner === 'r' ? decisive : -decisive };
  }
  if (status.kind === 'stalemate') return { w: 0, b: 0, r: 0 };

  const scores: Scores = { w: 0, b: 0, r: 0 };
  for (const { piece, square } of game.pieces()) {
    if (game.isEliminated(piece.color)) continue;
    const [q, r] = hexOf(square);
    const center = 5 - Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r));
    scores[piece.color] += material[piece.type] + (piece.type === 'k' ? 0 : 5 * center);
  }
  return {
    w: game.isEliminated('w') ? -decisive : scores.w * 2 - Math.max(scores.b, scores.r),
    b: game.isEliminated('b') ? -decisive : scores.b * 2 - Math.max(scores.w, scores.r),
    r: game.isEliminated('r') ? -decisive : scores.r * 2 - Math.max(scores.w, scores.b),
  };
}

function orderedMoves(game: Game): string[] {
  return game.legalUci().map((uci) => {
    const destination = uci.match(/[a-k]\d{1,2}/g)!.at(-1)!;
    const captured = game.pieceAt(parseSquare(destination)!);
    const promotion = uci.at(-1) === 'q' ? material.q : 0;
    return { uci, score: promotion + (captured ? material[captured.type] : 0) };
  }).sort((a, b) => b.score - a.score).map(({ uci }) => uci);
}

/** Max-n search lets each seat act in its own interest. An interrupted depth keeps the last complete result. */
export function chooseMove(
  fen: string,
  options: { maxNodes?: number; deadline?: number; now?: () => number; earlierFens?: readonly string[] } = {},
): string | null {
  const game = new Game(fen);
  const moves = orderedMoves(game);
  if (!moves.length) return null;
  let remaining = options.maxNodes ?? 1_500;
  const now = options.now ?? Date.now;
  const deadline = options.deadline ?? Infinity;
  const seen = new Set(options.earlierFens ?? []);
  let answer = moves[0]!;
  const root = game.turn;

  function search(depth: number): Scores | null {
    if (remaining-- <= 0 || now() >= deadline) return null;
    if (!depth || game.isGameOver()) return evaluate(game);

    const side = game.turn;
    let best: Scores | undefined;
    for (const move of orderedMoves(game)) {
      game.move(move);
      const candidate = search(depth - 1);
      game.undo();
      if (!candidate) return null;
      if (!best || candidate[side] > best[side]) best = candidate;
    }
    return best ?? evaluate(game);
  }

  for (let depth = 1; depth <= seats.length; depth++) {
    let best = -Infinity;
    let current = answer;
    for (const move of moves) {
      game.move(move);
      const status = game.status();
      if (status.kind === 'checkmate' && status.winner === root) {
        game.undo();
        return move;
      }
      const repeat = seen.has(game.fen());
      const scores = search(depth - 1);
      game.undo();
      if (!scores) return answer;
      const score = scores[root] - (repeat && scores[root] < decisive ? 60 : 0);
      if (score > best) {
        best = score;
        current = move;
      }
    }
    answer = current;
  }
  return answer;
}
