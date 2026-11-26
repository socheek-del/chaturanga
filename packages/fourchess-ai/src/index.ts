import { Game, parseSquare, PLAYERS, type Player, type PieceType } from '@chaturanga/fourchess';

const MATERIAL: Record<PieceType, number> = { p: 100, n: 320, b: 500, r: 500, q: 900, k: 0 };
const TERMINAL = 100_000;
const SEATS = PLAYERS;

export interface BotOptions {
  /** Deterministic tie-break seed, supplied by the host. */
  seed: number;
  /** Hard search-node ceiling. */
  maxNodes?: number;
}

function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function evaluate(game: Game): Record<Player, number> {
  const status = game.status();
  if (status.kind === 'points') {
    return Object.fromEntries(SEATS.map((player) => [
      player,
      status.scores[player] * 100 + (status.winners.includes(player) ? TERMINAL : -TERMINAL),
    ])) as Record<Player, number>;
  }

  const scores: Record<Player, number> = { r: 0, b: 0, y: 0, g: 0 };
  const kings = new Map<Player, number>();
  for (const { square, piece } of game.pieces()) {
    if (piece.type === 'k') kings.set(piece.color, square);
    if (!game.isActive(piece.color)) continue;
    const file = square % 14;
    const rank = Math.floor(square / 14);
    const distance = Math.max(Math.abs(file - 6.5), Math.abs(rank - 6.5));
    const centrality = Math.round((6.5 - distance) * 7);
    scores[piece.color] += MATERIAL[piece.type] + (piece.type === 'k' ? 0 : centrality);
  }

  for (const player of SEATS) {
    if (!game.isActive(player)) {
      scores[player] = -TERMINAL;
      continue;
    }
    scores[player] += game.score(player) * 125;
    const king = kings.get(player);
    if (king !== undefined) {
      const danger = SEATS.filter((attacker) => attacker !== player && game.isActive(attacker) &&
        game.attackedSquares(attacker).includes(king)).length;
      scores[player] -= danger * 260;
    }
  }
  return scores;
}

function orderedMoves(game: Game): string[] {
  return game.legalUci().map((uci) => {
    const destination = uci.match(/[a-n](?:1[0-4]|[1-9])/g)?.at(-1);
    const target = destination ? game.pieceAt(parseSquare(destination)!) : null;
    const promotion = uci.endsWith('q') ? MATERIAL.q : 0;
    return { uci, order: promotion + (target ? MATERIAL[target.type] : 0) };
  }).sort((left, right) => right.order - left.order).map(({ uci }) => uci);
}

/** Bounded Max-n search: each seat chooses the line that improves its own standing. */
export function chooseMove(fen: string, options: BotOptions): string | null {
  const game = new Game(fen);
  const rootMoves = orderedMoves(game);
  if (rootMoves.length === 0) return null;

  const random = seeded(options.seed);
  const maxNodes = Math.max(0, Math.floor(options.maxNodes ?? 800));
  let remaining = maxNodes;
  const root = game.turn;
  let answer = rootMoves[0]!;

  function search(depth: number): Record<Player, number> | null {
    if (remaining-- <= 0) return null;
    if (depth <= 0 || game.isGameOver()) return evaluate(game);
    const player = game.turn;
    let best: Record<Player, number> | undefined;
    for (const move of orderedMoves(game)) {
      game.move(move);
      const child = search(depth - 1);
      game.undo();
      if (!child) return null;
      if (!best || child[player] > best[player]) best = child;
    }
    return best ?? evaluate(game);
  }

  for (let depth = 1; depth <= 4; depth++) {
    let best = -Infinity;
    let tied: string[] = [];
    for (const move of rootMoves) {
      if (remaining <= 0) break;
      game.move(move);
      const candidate = search(depth - 1);
      game.undo();
      if (!candidate) break;
      const score = candidate[root];
      if (score > best) {
        best = score;
        tied = [move];
      } else if (score === best) tied.push(move);
    }
    if (tied.length === 0) break;
    answer = tied[Math.floor(random() * tied.length)]!;
    if (remaining <= 0) break;
  }
  return answer;
}
