import { type Color, squareOf, type Variant, type VariantGame } from '@chaturanga/rules-core';
import type { EngineLine, PositionEval } from './engine';
import type { Opening, OpeningBook } from './openings';
import type { Score } from './uci';

/** The move labels of a review, best to worst as chess.com orders them (ch-015, plat-017). */
export const LABELS = ['brilliant', 'great', 'best', 'excellent', 'good', 'book', 'inaccuracy', 'mistake', 'miss', 'blunder'] as const;
export type Label = (typeof LABELS)[number];

/**
 * Lost win percentage at which a move stops being Excellent, Good, an Inaccuracy or a Mistake: chess.com's
 * published expected-points bands (0.02, 0.05, 0.10, 0.20), on the 0–100 scale.
 */
export const THRESHOLDS = { excellent: 2, good: 5, inaccuracy: 10, mistake: 20 } as const;
/**
 * Great: the runner-up loses at least this much and leaves the player no better than this, in a position
 * not already decided (then every good move is just technique).
 */
export const GREAT_GAP = 15;
export const GREAT_SECOND_CEILING = 60;
export const GREAT_CEILING = 90;
/**
 * Brilliant: the sacrifice is worth at least this many pawns, and the player stays at least level. Only a
 * piece worth at least SACRIFICE_PIECE pawns can be sacrificed (a chess knight, a Makruk Khon).
 */
export const SACRIFICE_MIN = 2;
export const SACRIFICE_PIECE = 2.5;
export const BRILLIANT_FLOOR = 50;
/** Brilliant is not awarded in a position already this won, unless the sacrifice forces mate. */
export const BRILLIANT_CEILING = 90;
/** Miss: back to within this much of where the player stood before the opponent's error. */
export const MISS_SLACK = 5;

/**
 * What the labels need to know about a game beyond its engine scores. The king (`k`) is valued as more than
 * any exchange, whatever the product's material table says.
 */
export interface ReviewRules<G extends VariantGame = VariantGame> {
  variant: Variant<G>;
  /** Material in pawns per piece type, as the product counts it for its players. */
  pieceValues: Readonly<Record<string, number>>;
  /**
   * The same position with the other side to move, or null when that is not a legal position. Default:
   * the second FEN field is flipped, which is right for any FEN whose other fields do not depend on the
   * side to move (chess clears its en passant square too).
   */
  passTurn?: (fen: string) => string | null;
}

const KING_VALUE = 100;
const valueOf = (rules: ReviewRules, type: string): number => (type === 'k' ? KING_VALUE : (rules.pieceValues[type] ?? 0));

function defaultPassTurn(fen: string): string {
  const fields = fen.split(' ');
  fields[1] = fields[1] === 'w' ? 'b' : 'w';
  return fields.join(' ');
}

/** Expected score in percent from centipawns (the Lichess curve); a forced mate is 100 or 0. */
export function winPercent(score: Score): number {
  if ('mate' in score) return score.mate > 0 ? 100 : 0;
  const cp = Math.max(-1000, Math.min(1000, score.cp));
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1);
}

/** Lichess's per-move accuracy from win percentages before and after, from the mover's side. */
export function moveAccuracy(before: number, after: number): number {
  if (after >= before) return 100;
  const raw = 103.1668100711649 * Math.exp(-0.04354415386753951 * (before - after)) - 3.166924740191411;
  return Math.max(0, Math.min(100, raw));
}

function std(xs: readonly number[]): number {
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  return Math.sqrt(xs.reduce((a, x) => a + (x - mean) ** 2, 0) / xs.length);
}

/**
 * Lichess's game accuracy for one side: the mean of a volatility-weighted mean and a harmonic mean of that
 * side's move accuracies. `whiteWins` holds White's win percentage before every move and after the last;
 * `moves` has one entry per move, in order.
 */
export function gameAccuracy(
  whiteWins: readonly number[],
  moves: ReadonlyArray<{ color: Color; accuracy: number }>,
  color: Color,
): number | null {
  const plies = moves.length;
  if (plies < 1 || whiteWins.length !== plies + 1) return null;
  const size = Math.max(2, Math.min(8, Math.floor(plies / 10)));
  // One window per move: the first few repeat the opening window, then it slides.
  const windows: number[][] = [];
  for (let i = 0; i < size - 2; i++) windows.push(whiteWins.slice(0, size));
  for (let i = 0; i + size <= whiteWins.length; i++) windows.push(whiteWins.slice(i, i + size));
  const weights = windows.slice(0, plies).map((w) => Math.max(0.5, Math.min(12, std(w))));
  while (weights.length < plies) weights.push(0.5);

  const own = moves.flatMap((m, i) => (m.color === color ? [{ accuracy: m.accuracy, weight: weights[i]! }] : []));
  if (own.length === 0) return null;
  const weighted = own.reduce((a, m) => a + m.accuracy * m.weight, 0) / own.reduce((a, m) => a + m.weight, 0);
  const harmonic = own.length / own.reduce((a, m) => a + 1 / Math.max(1, m.accuracy), 0);
  return (weighted + harmonic) / 2;
}

export interface MoveReview {
  /** 1-based: ply 1 is the first move. */
  ply: number;
  uci: string;
  san: string;
  color: Color;
  label: Label;
  /** The mover's win percentage before and after the move. */
  winBefore: number;
  winAfter: number;
  accuracy: number;
  /** What the engine preferred in the position before, and the line it expected. */
  best: string | null;
  bestSan: string | null;
  bestLine: string[];
  /** Engine score after the move, from White's side. */
  scoreAfter: Score;
}

export interface GameReview {
  moves: MoveReview[];
  /** White's win percentage at every position, for the graph and the bar (length plies + 1). */
  whiteWins: number[];
  /** White's score at every position. */
  scores: Score[];
  accuracy: Record<Color, number | null>;
  counts: Record<Color, Record<Label, number>>;
  opening: Opening | null;
}

export interface ReviewInput<G extends VariantGame = VariantGame> {
  rules: ReviewRules<G>;
  startFen: string;
  moves: readonly string[];
  /** One per position, before every move and after the last; the engine's view, or the rules' for an ended game. */
  evals: readonly PositionEval[];
  book: OpeningBook | null;
}

const fromSide = (score: Score, color: Color): Score =>
  color === 'w' ? score : 'cp' in score ? { cp: -score.cp } : { mate: -score.mate };

/**
 * The rules' verdict on a position the game has ended in, shaped like an engine result so that a mate
 * reads as won and a draw as level. Null while the game can go on.
 */
export function terminalEval(game: VariantGame): PositionEval | null {
  const status = game.status();
  if (status.kind === 'ongoing') return null;
  // A decided ending (mate, a stalemate some variants score as a win) reads as won; anything else as level.
  const winner = 'winner' in status ? status.winner : null;
  const score: Score = winner ? { mate: winner === 'w' ? 1 : -1 } : { cp: 0 };
  return { fen: game.fen(), depth: 0, lines: [{ score, pv: [] }] };
}

/** Labels every move, and sums up each side (ch-015, plat-017). Pure: the engine's work comes in `evals`. */
export function reviewGame<G extends VariantGame>({ rules, startFen, moves, evals, book }: ReviewInput<G>): GameReview {
  if (evals.length !== moves.length + 1) throw new Error(`need ${moves.length + 1} evaluations, got ${evals.length}`);
  const { variant } = rules;
  const game = variant.createGame(startFen);
  const scores = evals.map((e) => e.lines[0]?.score ?? { cp: 0 });
  const whiteWins = scores.map(winPercent);
  const useBook = !!book && startFen === variant.startFen;
  let inBook = useBook;
  let opening: Opening | null = null;

  const reviews: MoveReview[] = [];
  moves.forEach((uci, i) => {
    const color = game.turn;
    const before = evals[i]!;
    const legalCount = game.legalUci().length;
    const bestLine = before.lines[0];
    const best = bestLine?.pv[0] ?? null;
    const bestSan = best ? sanOf(variant, game, [best])[0] ?? null : null;
    const bestLineSan = bestLine ? sanOf(variant, game, bestLine.pv) : [];
    const previous = game.lastMove();
    const fenBefore = game.fen();

    const record = game.move(uci);
    const winBefore = winPercent(fromSide(scores[i]!, color));
    const winAfter = winPercent(fromSide(scores[i + 1]!, color));
    const loss = Math.max(0, winBefore - winAfter);

    // Named lines include traps (Fool's Mate is one): a move that throws the game away is judged, not
    // excused as theory, and ends the book there.
    if (inBook) {
      inBook = book!.has(game.fen()) && loss < THRESHOLDS.inaccuracy;
      if (book!.has(game.fen())) opening = book!.name(game.fen()) ?? opening;
    }

    let label: Label;
    if (inBook) label = 'book';
    else if (uci === best || legalCount === 1) label = 'best';
    else if (loss < THRESHOLDS.excellent) label = 'excellent';
    else if (loss < THRESHOLDS.good) label = 'good';
    else if (loss < THRESHOLDS.inaccuracy) label = 'inaccuracy';
    else if (loss < THRESHOLDS.mistake) label = 'mistake';
    else label = 'blunder';

    if ((label === 'best' || label === 'excellent') && legalCount > 1) {
      const capturedValue = record.captured ? valueOf(rules, record.captured.type) : 0;
      // Only material the move itself puts en prise counts: a piece already hanging is not a sacrifice.
      const alreadyHanging = hangingBefore(rules, before.fen || fenBefore, color);
      const after = fromSide(scores[i + 1]!, color);
      const forcesMate = 'mate' in after && after.mate > 0;
      if (
        (winBefore < BRILLIANT_CEILING || forcesMate) &&
        winAfter >= BRILLIANT_FLOOR &&
        alreadyHanging !== null &&
        sacrificeValue(rules, game, color) - alreadyHanging - capturedValue >= SACRIFICE_MIN
      ) {
        label = 'brilliant';
      } else if (
        label === 'best' &&
        winBefore < GREAT_CEILING &&
        isOnlyMove(before.lines, color, winBefore) &&
        !(previous?.captured && record.captured && previous.to === record.to)
      ) {
        label = 'great';
      }
    }

    if ((label === 'mistake' || label === 'blunder') && i > 0) {
      const opponentBefore = winPercent(fromSide(scores[i - 1]!, color));
      const opponentErred = reviews[i - 1] && reviews[i - 1]!.winBefore - reviews[i - 1]!.winAfter >= THRESHOLDS.inaccuracy;
      if (opponentErred && winAfter >= opponentBefore - MISS_SLACK) label = 'miss';
    }

    reviews.push({
      ply: i + 1,
      uci,
      san: record.san,
      color,
      label,
      winBefore,
      winAfter,
      accuracy: moveAccuracy(winBefore, winAfter),
      best,
      bestSan,
      bestLine: bestLineSan,
      scoreAfter: scores[i + 1]!,
    });
  });

  const empty = () => Object.fromEntries(LABELS.map((l) => [l, 0])) as Record<Label, number>;
  const counts: Record<Color, Record<Label, number>> = { w: empty(), b: empty() };
  for (const r of reviews) counts[r.color][r.label]++;

  return {
    moves: reviews,
    whiteWins,
    scores,
    accuracy: { w: gameAccuracy(whiteWins, reviews, 'w'), b: gameAccuracy(whiteWins, reviews, 'b') },
    counts,
    opening,
  };
}

/** The best move was the only good one: the runner-up gives away a lot and leaves the player no better than level-ish. */
function isOnlyMove(lines: readonly EngineLine[], color: Color, winBefore: number): boolean {
  const second = lines[1];
  if (!second) return false;
  const secondWin = winPercent(fromSide(second.score, color));
  return winBefore - secondWin >= GREAT_GAP && secondWin <= GREAT_SECOND_CEILING;
}

/** SAN of a line from the game's current position, stopping at the first move that does not fit. */
export function sanOf(variant: Variant, game: VariantGame, line: readonly string[]): string[] {
  const copy = variant.createGame(game.fen());
  const out: string[] = [];
  for (const uci of line) {
    try {
      out.push(copy.move(uci).san);
    } catch {
      break;
    }
  }
  return out;
}

/**
 * Material the opponent (to move) can win by exchanges on the mover's pieces, the most on any one square:
 * a piece worth SACRIFICE_PIECE or more left where it can be taken for less.
 */
export function sacrificeValue(rules: ReviewRules, game: VariantGame, mover: Color): number {
  let most = 0;
  for (const { square, piece } of game.pieces()) {
    if (piece.color !== mover || piece.type === 'k' || valueOf(rules, piece.type) < SACRIFICE_PIECE) continue;
    most = Math.max(most, exchangeGain(rules, game, square));
  }
  return most;
}

/**
 * What the opponent could already win on the mover's pieces before the move: the position with the move
 * passed. Null when the mover was in check, where passing is impossible and no sacrifice is judged.
 */
export function hangingBefore(rules: ReviewRules, fen: string, mover: Color): number | null {
  const passed = (rules.passTurn ?? defaultPassTurn)(fen);
  if (!passed) return null;
  try {
    const game = rules.variant.createGame(passed);
    return game.turn === mover || game.inCheck() || rules.variant.createGame(fen).inCheck() ? null : sacrificeValue(rules, game, mover);
  } catch {
    return null;
  }
}

/**
 * Static exchange on `square` for the side to move: least valuable attacker first, stopping when it stops
 * paying. Moves are read from their coordinate notation, so any board size works; a capture that can promote
 * in several ways is tried once.
 */
export function exchangeGain(rules: ReviewRules, game: VariantGame, square: number): number {
  const target = game.pieceAt(square);
  if (!target) return 0;
  const { files } = rules.variant;
  const captures = new Map<number, string>();
  for (const uci of game.legalUci()) {
    const match = /^([a-p]\d{1,2})([a-p]\d{1,2})/.exec(uci);
    if (!match || squareOf(match[2]!, files) !== square) continue;
    const from = squareOf(match[1]!, files)!;
    if (!captures.has(from)) captures.set(from, uci);
  }
  if (captures.size === 0) return 0;
  let attacker: string | null = null;
  let cheapest = Infinity;
  for (const [from, uci] of captures) {
    const value = valueOf(rules, game.pieceAt(from)!.type);
    if (value < cheapest) {
      cheapest = value;
      attacker = uci;
    }
  }
  game.move(attacker!);
  const gain = valueOf(rules, target.type) - exchangeGain(rules, game, square);
  game.undo();
  return Math.max(0, gain);
}
