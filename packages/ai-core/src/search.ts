/**
 * Game-independent alpha-beta search: iterative deepening, quiescence on tactical moves, check extension
 * and repetition awareness. A game plugs in through SearchAdapter. Ported unchanged in behaviour from the
 * Makruk bot search (packages/ai/src/search.ts), which ladder-verified these choices.
 */
export const MATE = 100_000;
const MAX_PLY = 64;
const QUIESCENCE_DEPTH = 6;
/** Ply (after the opponent's reply) at which positions are checked against the game history. */
const REPETITION_PLY = 2;

/** A mutable game position the search walks with make/unmake. Moves are the game's encoded integers. */
export interface SearchAdapter {
  /** Side to move: 0 = White, 1 = Black. */
  turn(): 0 | 1;
  legalMoves(): number[];
  make(move: number): void;
  /** Takes back the last `make`. */
  unmake(): void;
  inCheck(): boolean;
  /** Static evaluation in centipawns from the point of view of the side to move. */
  evaluate(): number;
  /** Moves also searched in quiescence: captures and promotions. */
  isTactical(move: number): boolean;
  /** Move-ordering priority (e.g. MVV-LVA, promotions); higher is searched first. */
  orderKey(move: number): number;
  /** Position identity for repetition, comparable with the `history` keys. */
  key(): string;
  /**
   * Optional, for games where a repetition can be decisive (Xiangqi: perpetual check or chase loses). Called
   * only for a position found in `history`; returns its score from the point of view of the side to move, or
   * undefined when the repetition is not decided yet. For an adapter with this hook, an undecided root move is
   * still searched, so it is worth at most a draw with contempt but can lose (the reply completes a perpetual).
   * Adapters without the hook keep the default: every repetition is a draw with contempt.
   */
  repetitionScore?(): number | undefined;
}

export interface SearchOptions {
  maxDepth: number;
  /**
   * Earlier positions in the game as adapter keys. A root move that recreates one of them is scored as a
   * draw (repetition) instead of being searched, and so is the opponent's reply recreating one.
   */
  history?: readonly string[];
  /** Centipawns a draw by repetition is worth *less* than 0 to the side to move (avoids aimless shuffling). */
  contempt?: number;
  /**
   * Search every root move with a full window so each gets an exact score (default; needed for bot noise).
   * When false, later root moves only need to prove they are not better than the best so far — much
   * faster, but only the best move's score is exact.
   */
  exactRootScores?: boolean;
  /** Stop after roughly this many nodes (deterministic budget). */
  maxNodes?: number;
  /** Absolute timestamp (ms) after which the search stops. */
  deadline?: number;
  now?: () => number;
}

export interface RootMove {
  move: number;
  score: number;
}

export interface SearchResult {
  /** Encoded best move, or -1 if the side to move has no legal moves. */
  move: number;
  score: number;
  depth: number;
  nodes: number;
  /** Root moves with scores from the last completed depth, best first. */
  rootMoves: RootMove[];
}

function orderMoves(adapter: SearchAdapter, moves: number[], first?: number): number[] {
  return moves
    .map((m) => [m === first ? 1_000_000 : adapter.orderKey(m), m] as const)
    .sort((a, b) => b[0] - a[0])
    .map(([, m]) => m);
}

export function search(adapter: SearchAdapter, options: SearchOptions): SearchResult {
  const root = adapter.turn();
  const now = options.now ?? (() => Date.now());
  let nodes = 0;
  let stopped = false;

  const shouldStop = () => {
    if (stopped) return true;
    if ((nodes & 511) !== 0) return false;
    if (options.maxNodes !== undefined && nodes >= options.maxNodes) stopped = true;
    else if (options.deadline !== undefined && now() >= options.deadline) stopped = true;
    return stopped;
  };

  const quiesce = (alpha: number, beta: number, qdepth: number): number => {
    nodes++;
    const standPat = adapter.evaluate();
    if (standPat >= beta) return beta;
    if (standPat > alpha) alpha = standPat;
    if (qdepth === 0 || shouldStop()) return alpha;
    const tactical = adapter.legalMoves().filter((m) => adapter.isTactical(m));
    for (const m of orderMoves(adapter, tactical)) {
      adapter.make(m);
      const score = -quiesce(-beta, -alpha, qdepth - 1);
      adapter.unmake();
      if (stopped) return alpha;
      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    }
    return alpha;
  };

  const seen = new Set(options.history ?? []);
  const contempt = options.contempt ?? 0;

  const negamax = (depth: number, alpha: number, beta: number, ply: number): number => {
    if (shouldStop()) return 0;
    // The opponent's reply recreating an earlier position is a draw too: without this, a stronger bot walks
    // into lines where the weaker side can repeat. Only near the root, where the key's string cost is small.
    if (ply === REPETITION_PLY && seen.size > 0 && seen.has(adapter.key())) {
      return adapter.repetitionScore?.() ?? (adapter.turn() === root ? -contempt : contempt);
    }
    const checked = adapter.inCheck();
    if (checked && ply < MAX_PLY) depth++; // check extension: don't stop the search in the middle of a mating attack
    if (depth <= 0) return quiesce(alpha, beta, QUIESCENCE_DEPTH);
    nodes++;
    const moves = adapter.legalMoves();
    if (moves.length === 0) return checked ? -MATE + ply : 0;
    for (const m of orderMoves(adapter, moves)) {
      adapter.make(m);
      const score = -negamax(depth - 1, -beta, -alpha, ply + 1);
      adapter.unmake();
      if (stopped) return 0;
      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    }
    return alpha;
  };

  /** Score (for the root side) of a root move that recreates an earlier position; the move is already made. */
  const repeatedRootScore = (depth: number, beta: number): number => {
    if (!adapter.repetitionScore) return -contempt;
    const decided = adapter.repetitionScore();
    if (decided !== undefined) return -decided;
    return Math.min(-contempt, -negamax(depth - 1, -MATE - 1, beta, 1));
  };

  let rootMoves: RootMove[] = adapter.legalMoves().map((move) => ({ move, score: 0 }));
  if (rootMoves.length === 0) {
    return { move: -1, score: adapter.inCheck() ? -MATE : 0, depth: 0, nodes: 0, rootMoves: [] };
  }

  const exactRootScores = options.exactRootScores ?? true;
  let completedDepth = 0;
  for (let depth = 1; depth <= options.maxDepth; depth++) {
    const scored: RootMove[] = [];
    let alpha = -MATE - 1;
    const ordered = orderMoves(
      adapter,
      rootMoves.map((r) => r.move),
      rootMoves[0]!.move,
    );
    for (const m of ordered) {
      adapter.make(m);
      // Exact root scores need a full window for every move (bot noise picks among them).
      const beta = exactRootScores ? MATE + 1 : -alpha;
      const score =
        seen.size > 0 && seen.has(adapter.key()) ? repeatedRootScore(depth, beta) : -negamax(depth - 1, -MATE - 1, beta, 1);
      adapter.unmake();
      if (stopped) break;
      scored.push({ move: m, score });
      if (score > alpha) alpha = score;
    }
    if (stopped && scored.length < ordered.length) break;
    rootMoves = scored.sort((a, b) => b.score - a.score);
    completedDepth = depth;
    if (rootMoves[0]!.score >= MATE - MAX_PLY) break; // forced mate found
  }

  const best = rootMoves[0]!;
  return { move: best.move, score: best.score, depth: completedDepth, nodes, rootMoves };
}
