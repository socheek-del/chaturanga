import { mulberry32 } from '@chaturanga/ai-core';
import { Game, parseSquare, type PieceType } from '@chaturanga/senterej';
import type { Color } from '@chaturanga/rules-core';

const VALUE: Record<PieceType, number> = { p: 1.1, n: 3.1, b: 2.2, q: 1.8, r: 5.2, k: 0 };
const MATE = 100_000;
const DEPTHS = [1, 1, 2, 2, 3, 3] as const;
const NODES = [0, 120, 450, 1_200, 3_200, 7_000] as const;

export const BOTS = [
  { id: 1, name: 'Novice', maxDepth: DEPTHS[0], maxNodes: NODES[0] },
  { id: 2, name: 'Learner', maxDepth: DEPTHS[1], maxNodes: NODES[1] },
  { id: 3, name: 'Club', maxDepth: DEPTHS[2], maxNodes: NODES[2] },
  { id: 4, name: 'Skilled', maxDepth: DEPTHS[3], maxNodes: NODES[3] },
  { id: 5, name: 'Expert', maxDepth: DEPTHS[4], maxNodes: NODES[4] },
  { id: 6, name: 'Master', maxDepth: DEPTHS[5], maxNodes: NODES[5] },
] as const;

export interface BotOptions {
  /** Seeded choices make a saved bot game replayable. */
  seed: number;
  level?: number;
  maxNodes?: number;
  /** The action history preserves actor identity during Werera and repetition state. */
  history?: readonly { color: Color; uci: string }[];
}

export interface BotMove {
  uci: string;
  score: number;
  depth: number;
  nodes: number;
}

function evaluate(game: Game, root: Color): number {
  const status = game.status();
  if (status.kind === 'checkmate') return status.winner === root ? MATE : -MATE;
  if (status.kind !== 'ongoing') return 0;

  let score = 0;
  for (const { square, piece } of game.pieces()) {
    const sign = piece.color === root ? 1 : -1;
    const file = square & 7;
    const rank = square >> 3;
    const progress = piece.color === 'w' ? rank : 7 - rank;
    const center = 3.5 - Math.max(Math.abs(file - 3.5), Math.abs(rank - 3.5));
    const activity = piece.type === 'p' ? progress * 0.035 : piece.type === 'k' ? 0 : center * 0.025;
    score += sign * (VALUE[piece.type] + activity);
  }
  if (game.phase === 'turn') {
    if (game.inCheck()) score += game.turn === root ? -0.18 : 0.18;
    const rootMobility = game.legalUciFor(root).length;
    const other = root === 'w' ? 'b' : 'w';
    const otherMobility = game.legalUciFor(other).length;
    score += (rootMobility - otherMobility) * 0.006;
  }
  return score;
}

function orderedMoves(game: Game, actor: Color): string[] {
  return game.legalUciFor(actor).map((uci) => {
    const destination = parseSquare(uci.slice(2, 4));
    const victim = destination === null ? null : game.pieceAt(destination);
    const promotion = uci.endsWith('q') ? VALUE.q : 0;
    return { uci, order: (victim ? VALUE[victim.type] * 10 : 0) + promotion };
  }).sort((left, right) => right.order - left.order).map(({ uci }) => uci);
}

/** Choose a legal move for the given seat. The node and depth bounds keep browser workers responsive. */
export function chooseMove(fen: string, color: Color, options: BotOptions): BotMove | null {
  const game = new Game(fen);
  for (const action of options.history ?? []) game.moveFor(action.color, action.uci);
  const rootMoves = orderedMoves(game, color);
  if (!rootMoves.length) return null;

  const levelIndex = Math.max(0, Math.min(BOTS.length - 1, Math.floor((options.level ?? 3) - 1)));
  const maxNodes = Math.max(0, Math.floor(options.maxNodes ?? NODES[levelIndex]!));
  const maxDepth = DEPTHS[levelIndex]!;
  const random = mulberry32(options.seed);
  let answer = rootMoves[Math.floor(random() * rootMoves.length)]!;
  let answerScore = evaluateAfter(answer);
  let completedDepth = 0;
  let remaining = maxNodes;
  let visited = 0;

  function evaluateAfter(uci: string): number {
    game.moveFor(color, uci);
    try { return evaluate(game, color); }
    finally { game.undo(); }
  }

  function search(depth: number): number | null {
    if (remaining-- <= 0) return null;
    visited++;
    const current = evaluate(game, color);
    if (Math.abs(current) >= MATE || depth <= 0) return current;

    const actor = game.turn;
    const moves = orderedMoves(game, actor);
    if (!moves.length) return current;
    const maximizing = actor === color;
    let best = maximizing ? -Infinity : Infinity;
    for (const uci of moves) {
      game.moveFor(actor, uci);
      let candidate: number | null;
      try { candidate = search(depth - 1); }
      finally { game.undo(); }
      if (candidate === null) return null;
      best = maximizing ? Math.max(best, candidate) : Math.min(best, candidate);
    }
    return best;
  }

  for (let depth = 1; depth <= maxDepth; depth++) {
    if (remaining <= 0) break;
    let bestScore = -Infinity;
    const tied: string[] = [];
    let complete = true;
    for (const uci of rootMoves) {
      if (remaining <= 0) { complete = false; break; }
      game.moveFor(color, uci);
      let score: number | null;
      try { score = search(depth - 1); }
      finally { game.undo(); }
      if (score === null) { complete = false; break; }
      if (score > bestScore) { bestScore = score; tied.length = 0; tied.push(uci); }
      else if (score === bestScore) tied.push(uci);
    }
    if (!complete || !tied.length) break;
    answer = tied[Math.floor(random() * tied.length)]!;
    answerScore = bestScore;
    completedDepth = depth;
  }

  return { uci: answer, score: answerScore, depth: completedDepth, nodes: visited };
}
