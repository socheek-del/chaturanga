/**
 * The Card Chess computer opponent. For every card it may play and every move that card allows, it plays
 * the move on a copy of the board and asks the chess search how good the position is for the other side
 * (a shallow search: the opponent's cards are hidden, so it assumes they could move anything). Then it adds
 * what the card itself is worth in Uno terms: an extra move is gold, a wild is worth saving, and going down
 * in cards is the second way to win.
 */
import { Game } from '@chaturanga/chess';
import { bestMove } from '@chaturanga/chess-ai';
import { type Card, CARD_COLORS, type CardColor, isWild } from '@chaturanga/uno';
import { type CardChessState, cardOptions, COLOR_PIECES, gameOf, playerOf, turnNeed, turnOf } from './rules';

export interface CardBot {
  id: number;
  /** Search depth after the bot's own move. */
  depth: number;
  maxNodes: number;
  /** Random centipawns added to every candidate, so weaker bots make human mistakes. */
  noise: number;
  /** Chance of forgetting to call Uno. */
  forgetUno: number;
}

export const CARD_BOTS: readonly CardBot[] = [
  { id: 1, depth: 1, maxNodes: 400, noise: 220, forgetUno: 0.35 },
  { id: 2, depth: 2, maxNodes: 2_500, noise: 60, forgetUno: 0.1 },
  { id: 3, depth: 3, maxNodes: 9_000, noise: 0, forgetUno: 0 },
];

export const cardBot = (id: number): CardBot => CARD_BOTS.find((b) => b.id === id) ?? CARD_BOTS[1]!;

export type BotAction =
  | { kind: 'play'; cardId: number; uci: string; color?: CardColor; callUno: boolean }
  | { kind: 'draw' }
  | { kind: 'pass' }
  | { kind: 'free-move'; uci: string };

const MATE_SCORE = 50_000;
const EXTRA_TURN = new Set(['skip', 'reverse', 'draw2', 'wild4']);

/** Bonus, in centipawns, for what playing `card` does on the Uno side of the game. */
function cardValue(card: Card, handSize: number): number {
  let value = 0;
  if (card.kind === 'draw2') value += 70;
  else if (card.kind === 'wild4') value += 40;
  else if (card.kind === 'skip' || card.kind === 'reverse') value += 50;
  // Wilds unlock every piece: worth keeping for a tight spot, unless the hand is nearly gone.
  if (isWild(card) && handSize > 3) value -= 80;
  return value;
}

/** The colour to name with a wild: the one this hand holds most of, ties broken by pieces still on the board. */
export function pickColor(hand: readonly Card[], game: Game, side: 'w' | 'b'): CardColor {
  const pieces = game.pieces().filter((p) => p.piece.color === side);
  let best: CardColor = 'red';
  let bestScore = -Infinity;
  for (const color of CARD_COLORS) {
    const cards = hand.filter((c) => c.color === color).length;
    const movers = pieces.filter((p) => COLOR_PIECES[color].includes(p.piece.type)).length;
    const score = cards * 10 + movers;
    if (score > bestScore) {
      bestScore = score;
      best = color;
    }
  }
  return best;
}

/** Scores the position after `uci` from the mover's side, in centipawns. */
function scoreMove(fen: string, uci: string, bot: CardBot): { score: number; givesCheck: boolean } {
  const game = new Game(fen);
  game.move(uci);
  const status = game.status();
  if (status.kind === 'checkmate') return { score: MATE_SCORE, givesCheck: true };
  if (status.kind !== 'ongoing') return { score: 0, givesCheck: false };
  const reply = bestMove(game.fen(), { maxDepth: bot.depth, maxNodes: bot.maxNodes });
  return { score: reply ? -reply.score : 0, givesCheck: game.inCheck() };
}

/** What the bot does on its turn. `rng` is injected so games can be replayed in tests. */
export function chooseAction(state: CardChessState, botId: number, rng: () => number = Math.random): BotAction {
  const bot = cardBot(botId);
  const need = turnNeed(state);
  if (need === 'draw') return { kind: 'draw' };
  if (need === 'pass') return { kind: 'pass' };
  if (need === 'free-move') {
    const game = gameOf(state);
    const moves = game.legalUci();
    let best = moves[0]!;
    let bestScore = -Infinity;
    for (const uci of moves) {
      const { score } = scoreMove(state.fen, uci, bot);
      if (score > bestScore) [best, bestScore] = [uci, score];
    }
    return { kind: 'free-move', uci: best };
  }
  if (need === 'over') throw new Error('game over');

  const side = turnOf(state);
  const hand = state.uno.hands[playerOf(side)]!;
  const game = gameOf(state);
  const moveScores = new Map<string, { score: number; givesCheck: boolean }>();
  const scored = (uci: string) => {
    let s = moveScores.get(uci);
    if (!s) moveScores.set(uci, (s = scoreMove(state.fen, uci, bot)));
    return s;
  };

  let best: { card: Card; uci: string; score: number } | null = null;
  for (const option of cardOptions(state)) {
    const bonus = cardValue(option.card, hand.length);
    for (const uci of option.moves) {
      const { score, givesCheck } = scored(uci);
      // An extra move only happens when the move does not give check.
      const extra = EXTRA_TURN.has(option.card.kind) && !givesCheck ? 40 : 0;
      const total = score + bonus + extra + (rng() - 0.5) * bot.noise;
      if (!best || total > best.score) best = { card: option.card, uci, score: total };
    }
  }
  const chosen = best!;
  return {
    kind: 'play',
    cardId: chosen.card.id,
    uci: chosen.uci,
    color: isWild(chosen.card) ? pickColor(hand.filter((c) => c.id !== chosen.card.id), game, side) : undefined,
    callUno: hand.length === 2 && rng() >= bot.forgetUno,
  };
}
