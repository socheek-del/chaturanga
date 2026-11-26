import { mulberry32 } from '@chaturanga/ai-core';
import { Game, parseSquare, PLAYERS, type PieceType, type Player } from '@chaturanga/chaturaji';

type Scores = Record<Player, number>;

const MATERIAL: Record<PieceType, number> = { p: 1.2, b: 2.2, h: 3.2, e: 4.2, k: 5.5 };
const TERMINAL = 100_000;
const LEVEL_NODES = [0, 80, 200, 450, 850, 1_500] as const;
const LEVEL_DEPTH = [1, 1, 2, 2, 3, 3] as const;

export const BOT_LEVELS = [
  { level: 1, name: 'Beginner', maxNodes: LEVEL_NODES[0], maxDepth: LEVEL_DEPTH[0] },
  { level: 2, name: 'Casual', maxNodes: LEVEL_NODES[1], maxDepth: LEVEL_DEPTH[1] },
  { level: 3, name: 'Club', maxNodes: LEVEL_NODES[2], maxDepth: LEVEL_DEPTH[2] },
  { level: 4, name: 'Skilled', maxNodes: LEVEL_NODES[3], maxDepth: LEVEL_DEPTH[3] },
  { level: 5, name: 'Expert', maxNodes: LEVEL_NODES[4], maxDepth: LEVEL_DEPTH[4] },
  { level: 6, name: 'Master', maxNodes: LEVEL_NODES[5], maxDepth: LEVEL_DEPTH[5] },
] as const;

export interface BotOptions {
  /** Seed supplied by the host for deterministic choices and sampled future dice. */
  seed: number;
  /** One of the six bounded bot profiles. */
  level?: number;
  /** Optional hard ceiling for tests and worker responsiveness. */
  maxNodes?: number;
}

function evaluate(game: Game): Scores {
  const status = game.status();
  if (status.kind === 'points') return Object.fromEntries(PLAYERS.map((player) => [
    player,
    status.scores[player] * 100 + (status.winners.includes(player) ? TERMINAL : -TERMINAL),
  ])) as Scores;

  const score: Scores = { r: 0, g: 0, y: 0, b: 0 };
  for (const player of PLAYERS) score[player] = game.scores[player] * 100;
  for (const { square, piece } of game.pieces()) {
    const controller = game.controllers[piece.color];
    const file = square % 8;
    const rank = Math.floor(square / 8);
    const centrality = (3.5 - Math.max(Math.abs(file - 3.5), Math.abs(rank - 3.5))) * 0.06;
    const kingSafety = piece.type === 'k' && !piece.promoted ? 1.8 : 0;
    score[controller] += MATERIAL[piece.type] + centrality + kingSafety;
  }
  for (const player of PLAYERS) {
    score[player] += game.capturedPools[player].reduce((total, type) => total + MATERIAL[type] * 0.24, 0);
    if (game.kingCaptureOwners[player] !== null) score[player] -= 16;
    for (const opponent of PLAYERS) {
      if (opponent !== player && game.kingCaptureOwners[opponent] === player) score[player] += 4;
    }
  }
  return score;
}

function orderedMoves(game: Game): string[] {
  return game.legalUci().map((uci) => {
    if (uci === 'pass') return { uci, value: -1 };
    const destination = uci.match(/[a-h][1-8]/g)?.at(-1);
    const target = destination ? game.pieceAt(parseSquare(destination)!) : null;
    return { uci, value: target ? MATERIAL[target.type] * 10 : 0 };
  }).sort((left, right) => right.value - left.value).map(({ uci }) => uci);
}

function sampledSeed(fen: string, rootSeed: number): number {
  let hash = (rootSeed ^ 0x811c9dc5) >>> 0;
  for (let index = 0; index < fen.length; index++) {
    hash ^= fen.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

/**
 * A bounded four-seat Max-n search. Each seat values its own score/material, and future dice are
 * sampled from the injected seed because opponents' next results are not knowable in advance.
 */
export function chooseMove(fen: string, options: BotOptions): string | null {
  const game = new Game(fen);
  if (game.isGameOver() || game.dice === null) return null;
  const rootMoves = orderedMoves(game);
  if (rootMoves.length === 0) return null;

  const random = mulberry32(options.seed);
  const level = Math.max(1, Math.min(6, Math.floor(options.level ?? 3))) - 1;
  const maxNodes = Math.max(0, Math.floor(options.maxNodes ?? LEVEL_NODES[level]!));
  const maxDepth = Math.max(1, Math.min(4, Math.floor(LEVEL_DEPTH[level]!)));
  let remaining = maxNodes;
  const root = game.turn;
  let answer = rootMoves[Math.floor(random() * rootMoves.length)]!;

  function search(depth: number): Scores | null {
    if (remaining-- <= 0) return null;
    if (game.isGameOver() || depth <= 0) return evaluate(game);

    let rolled = false;
    if (game.dice === null) {
      const event = game.prepareTurn(sampledSeed(game.fen(), options.seed));
      if (!event) return evaluate(game);
      rolled = true;
    }

    try {
      const player = game.turn;
      let best: Scores | undefined;
      for (const move of orderedMoves(game)) {
        game.move(move);
        const candidate = search(depth - 1);
        game.undo();
        if (!candidate) return null;
        if (!best || candidate[player] > best[player]) best = candidate;
      }
      return best ?? evaluate(game);
    } finally {
      if (rolled) game.undo();
    }
  }

  for (let depth = 1; depth <= maxDepth; depth++) {
    let bestScore = -Infinity;
    const tied: string[] = [];
    let complete = true;
    for (const move of rootMoves) {
      if (remaining <= 0) { complete = false; break; }
      game.move(move);
      let candidate: Scores | null;
      try { candidate = search(depth - 1); }
      finally { game.undo(); }
      if (!candidate) { complete = false; break; }
      if (candidate[root] > bestScore) {
        bestScore = candidate[root];
        tied.length = 0;
        tied.push(move);
      } else if (candidate[root] === bestScore) tied.push(move);
    }
    if (!complete || tied.length === 0) break;
    answer = tied[Math.floor(random() * tied.length)]!;
  }
  return answer;
}
