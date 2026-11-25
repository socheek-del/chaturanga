import { Game, fileOf, rankOf, sameTeam, teamOf, type PieceType, type Seat } from '@chaturanga/fortress';

type Scores = Record<Seat, number>;

const PLAYERS: readonly Seat[] = ['r', 'b', 'w', 'k'];
const VALUE: Record<PieceType, number> = { p: 100, n: 315, b: 330, r: 510, q: 950, k: 0 };
const WIN = 100_000;

function emptyScores(value = 0): Scores {
  return { r: value, b: value, w: value, k: value };
}

function centerDistance(square: number): number {
  return Math.abs(fileOf(square) - 7.5) + Math.abs(rankOf(square) - 7.5);
}

function evaluate(game: Game): Scores {
  const status = game.status();
  if (status.kind === 'checkmate') {
    return Object.fromEntries(PLAYERS.map((seat) => [seat, sameTeam(seat, status.winner) ? WIN : -WIN])) as Scores;
  }
  if (status.kind === 'stalemate') return emptyScores();

  let teamOne = 0;
  for (const { square, piece } of game.pieces()) {
    const value = VALUE[piece.type] + (piece.type === 'k' ? 0 : Math.round((15 - centerDistance(square)) * 2));
    teamOne += (teamOf(piece.color) === 0 ? 1 : -1) * value;
  }
  for (const seat of PLAYERS) {
    for (const type of game.hand(seat)) teamOne += (teamOf(seat) === 0 ? 1 : -1) * VALUE[type as PieceType];
  }
  if (game.inCheck()) teamOne += teamOf(game.turn) === 0 ? -35 : 35;
  return Object.fromEntries(PLAYERS.map((seat) => [seat, teamOf(seat) === 0 ? teamOne : -teamOne])) as Scores;
}

function movePriority(game: Game, uci: string): number {
  const placement = /^([NBR])@([a-p](?:1[0-6]|[1-9]))$/.exec(uci);
  if (placement) {
    const file = placement[2]!.charCodeAt(0) - 97;
    const rank = Number(placement[2]!.slice(1)) - 1;
    return 40 - Math.abs(file - 7.5) - Math.abs(rank - 7.5);
  }
  const from = uci.match(/^([a-p](?:1[0-6]|[1-9]))/)?.[1];
  const to = [...uci.matchAll(/[a-p](?:1[0-6]|[1-9])/g)].at(-1)?.[0];
  if (!from || !to) return 0;
  const targetFile = to.charCodeAt(0) - 97;
  const targetRank = Number(to.slice(1)) - 1;
  const targetSquare = targetRank * 16 + targetFile;
  const fromFile = from.charCodeAt(0) - 97;
  const fromRank = Number(from.slice(1)) - 1;
  const fromSquare = fromRank * 16 + fromFile;
  const moving = game.pieceAt(fromSquare);
  const captured = game.pieceAt(targetSquare);
  const captureValue = captured ? VALUE[captured.type] * 8 - (moving ? VALUE[moving.type] : 0) : 0;
  const promotionValue = /[qrbn]$/.test(uci) ? 500 : 0;
  const progress = moving && moving.type !== 'k' ? centerDistance(fromSquare) - centerDistance(targetSquare) : 0;
  return captureValue + promotionValue + progress;
}

function orderedMoves(game: Game): string[] {
  return game.legalUci().sort((a, b) => movePriority(game, b) - movePriority(game, a) || a.localeCompare(b));
}

export interface BotOptions {
  /** Hard node bound. The fallback is always a legal move, even when the bound is tiny. */
  maxNodes?: number;
  /** Absolute timestamp in milliseconds. */
  deadline?: number;
  now?: () => number;
  maxDepth?: number;
  maxRootMoves?: number;
  branchLimit?: number;
}

/** Bounded deterministic Max-n search: each seat maximizes its own team's utility. */
export function chooseMove(fen: string, options: BotOptions = {}): string | null {
  const game = new Game(fen);
  const root = game.turn;
  const moves = orderedMoves(game);
  if (!moves.length) return null;

  const nodeLimit = options.maxNodes ?? 1200;
  const deadline = options.deadline ?? Infinity;
  const now = options.now ?? Date.now;
  const branchLimit = Math.max(1, options.branchLimit ?? 8);
  const rootLimit = Math.max(1, options.maxRootMoves ?? 24);
  let nodes = 0;
  let stopped = false;
  let answer = moves[0]!;

  function visit(depth: number): Scores | null {
    if (nodes >= nodeLimit || now() >= deadline) {
      stopped = true;
      return null;
    }
    nodes++;
    if (depth <= 0 || game.isGameOver()) return evaluate(game);
    const seat = game.turn;
    let best: Scores | null = null;
    for (const move of orderedMoves(game).slice(0, branchLimit)) {
      game.move(move);
      const scores = visit(depth - 1);
      game.undo();
      if (scores === null) return null;
      if (best === null || scores[seat] > best[seat]) best = scores;
    }
    return best ?? evaluate(game);
  }

  for (let depth = 1; depth <= (options.maxDepth ?? 3); depth++) {
    const candidates = moves.slice(0, rootLimit);
    let bestScore = -Infinity;
    let bestMove = answer;
    let complete = true;
    for (const move of candidates) {
      game.move(move);
      const scores = visit(depth - 1);
      game.undo();
      if (scores === null) {
        complete = false;
        break;
      }
      if (scores[root] > bestScore) {
        bestScore = scores[root];
        bestMove = move;
      }
    }
    if (!complete || stopped) break;
    answer = bestMove;
  }
  return answer;
}
