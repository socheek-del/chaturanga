import { type Card, type CardColor, createDeck, isWild, sameFace } from './cards';
import { shuffle } from './random';

/** Knobs a host can turn. The defaults are the official rules for the parts this engine covers. */
export interface UnoRules {
  /** Cards dealt to each player. */
  handSize: number;
  /** Cards drawn by a player who goes down to one card without calling Uno first. */
  unoPenalty: number;
  /** Official rule: a Wild Draw Four may only be played when its player holds no card of the current colour. */
  wildDrawFourNeedsNoColorMatch: boolean;
}

export const DEFAULT_RULES: UnoRules = { handSize: 7, unoPenalty: 2, wildDrawFourNeedsNoColorMatch: true };

/** Plain data: safe to JSON-encode, store and send. Never mutated — every step returns a new state. */
export interface UnoState {
  rules: UnoRules;
  players: number;
  hands: Card[][];
  /** The top of the pile is the last element. */
  drawPile: Card[];
  /** The top card is the last element. */
  discard: Card[];
  /** The colour to match: the top card's own, or the colour named with a wild. */
  color: CardColor;
  direction: 1 | -1;
  current: number;
  /** Cards the current player has drawn for being stuck this turn; passing needs at least one. */
  drawnThisTurn: number;
  /** Who has called Uno and still holds at most two cards. */
  unoCalled: boolean[];
  winner: number | null;
  /** Seed of the shuffle used the next time the discard pile is turned over. */
  seed: number;
  /** Plays made so far, for display and saved games. */
  plays: number;
}

export type GiveReason = 'stuck' | 'draw2' | 'wild4' | 'uno-penalty' | 'host';

export type UnoEvent =
  | { type: 'play'; player: number; card: Card; color: CardColor }
  | { type: 'draw'; player: number; cards: Card[]; reason: GiveReason }
  | { type: 'skip'; player: number }
  | { type: 'reverse'; direction: 1 | -1 }
  | { type: 'uno'; player: number }
  | { type: 'pass'; player: number }
  | { type: 'reshuffle'; cards: number }
  | { type: 'win'; player: number };

export interface Step {
  state: UnoState;
  events: UnoEvent[];
}

export type UnoError =
  | 'game-over'
  | 'not-in-hand'
  | 'does-not-match'
  | 'needs-color'
  | 'wild4-has-color'
  | 'cannot-pass'
  | 'cannot-call';

export class UnoRuleError extends Error {
  constructor(readonly code: UnoError) {
    super(`Uno: ${code}`);
    this.name = 'UnoRuleError';
  }
}

/**
 * Shuffles a fresh deck, deals `rules.handSize` cards to each player and turns over a starting card. The
 * starting card is always a number card: an action card is buried back in the pile and another is turned,
 * which keeps the first turn free of effects nobody chose.
 */
export function newGame(players: number, seed: number, rules: Partial<UnoRules> = {}): UnoState {
  if (players < 2 || players > 10) throw new RangeError('Uno needs 2 to 10 players');
  const fullRules = { ...DEFAULT_RULES, ...rules };
  const shuffled = shuffle(createDeck(), seed);
  const pile = shuffled.items;
  const hands: Card[][] = Array.from({ length: players }, () => []);
  for (let round = 0; round < fullRules.handSize; round++) {
    for (const hand of hands) hand.push(pile.pop()!);
  }
  let start = pile.pop()!;
  while (start.kind !== 'number') {
    pile.unshift(start);
    start = pile.pop()!;
  }
  return {
    rules: fullRules,
    players,
    hands,
    drawPile: pile,
    discard: [start],
    color: start.color!,
    direction: 1,
    current: 0,
    drawnThisTurn: 0,
    unoCalled: Array<boolean>(players).fill(false),
    winner: null,
    seed: shuffled.seed,
    plays: 0,
  };
}

export const topCard = (state: UnoState): Card => state.discard.at(-1)!;

/** The player `steps` seats away from `from` in the current direction. */
export function nextPlayer(state: UnoState, from = state.current, steps = 1): number {
  return (((from + state.direction * steps) % state.players) + state.players) % state.players;
}

/** Whether `card` may go on the pile now: a wild always may (subject to the Draw Four rule), else colour or face. */
export function canPlay(state: UnoState, player: number, card: Card): boolean {
  if (state.winner !== null) return false;
  if (card.kind === 'wild4' && state.rules.wildDrawFourNeedsNoColorMatch) {
    return !state.hands[player]!.some((c) => c.id !== card.id && c.color === state.color);
  }
  if (isWild(card)) return true;
  return card.color === state.color || sameFace(card, topCard(state));
}

/** The current player's cards that Uno lets them play. A host narrows this further with its own rules. */
export function playableCards(state: UnoState, player = state.current): Card[] {
  return state.hands[player]!.filter((card) => canPlay(state, player, card));
}

export interface PlayOptions {
  /** The colour named with a wild. Required for wilds, ignored otherwise. */
  color?: CardColor;
  /**
   * Keep the card's draw penalty but cancel the lost turn of a Skip, Reverse (two players), Draw Two or Wild
   * Draw Four. A host uses this when its own rules forbid the extra turn in that moment — chess, for
   * instance, never lets a player move again while the opponent's king is in check.
   */
  suppressSkip?: boolean;
}

/** The current player plays one card from their hand. */
export function play(state: UnoState, cardId: number, options: PlayOptions = {}): Step {
  if (state.winner !== null) throw new UnoRuleError('game-over');
  const player = state.current;
  const hand = state.hands[player]!;
  const card = hand.find((c) => c.id === cardId);
  if (!card) throw new UnoRuleError('not-in-hand');
  if (!canPlay(state, player, card)) {
    throw new UnoRuleError(card.kind === 'wild4' ? 'wild4-has-color' : 'does-not-match');
  }
  if (isWild(card) && !options.color) throw new UnoRuleError('needs-color');

  const color = isWild(card) ? options.color! : card.color!;
  const events: UnoEvent[] = [{ type: 'play', player, card, color }];
  let next: UnoState = {
    ...state,
    hands: replaceAt(state.hands, player, hand.filter((c) => c.id !== cardId)),
    discard: [...state.discard, card],
    color,
    plays: state.plays + 1,
  };

  const left = next.hands[player]!.length;
  if (left === 0) {
    events.push({ type: 'win', player });
    return { state: { ...next, winner: player, unoCalled: replaceAt(next.unoCalled, player, false) }, events };
  }
  if (left === 1 && !state.unoCalled[player]) {
    const penalty = give(next, player, state.rules.unoPenalty, 'uno-penalty');
    next = penalty.state;
    events.push(...penalty.events);
  }
  if (next.hands[player]!.length > 2) next = { ...next, unoCalled: replaceAt(next.unoCalled, player, false) };

  let skipVictim: number | null = null;
  if (card.kind === 'reverse') {
    next = { ...next, direction: next.direction === 1 ? -1 : 1 };
    events.push({ type: 'reverse', direction: next.direction });
    // With two players a Reverse works like a Skip (official rule).
    if (next.players === 2) skipVictim = nextPlayer(next, player);
  } else if (card.kind === 'skip') {
    skipVictim = nextPlayer(next, player);
  } else if (card.kind === 'draw2' || card.kind === 'wild4') {
    skipVictim = nextPlayer(next, player);
    const drawn = give(next, skipVictim, card.kind === 'draw2' ? 2 : 4, card.kind);
    next = drawn.state;
    events.push(...drawn.events);
  }

  let current = nextPlayer(next, player);
  if (skipVictim !== null && !options.suppressSkip) {
    events.push({ type: 'skip', player: skipVictim });
    current = nextPlayer(next, player, 2);
  }
  return { state: { ...next, current, drawnThisTurn: 0 }, events };
}

/** The current player draws one card because they cannot or will not play. */
export function draw(state: UnoState): Step {
  if (state.winner !== null) throw new UnoRuleError('game-over');
  const step = give(state, state.current, 1, 'stuck');
  return { state: { ...step.state, drawnThisTurn: state.drawnThisTurn + 1 }, events: step.events };
}

/**
 * The current player ends their turn without playing. Official rules allow it only after drawing; `force`
 * lets a host allow it anyway (for example when every card is already in someone's hand and nothing can be
 * drawn).
 */
export function pass(state: UnoState, force = false): Step {
  if (state.winner !== null) throw new UnoRuleError('game-over');
  if (state.drawnThisTurn === 0 && !force) throw new UnoRuleError('cannot-pass');
  const player = state.current;
  return {
    state: { ...state, current: nextPlayer(state, player), drawnThisTurn: 0 },
    events: [{ type: 'pass', player }],
  };
}

/**
 * A player calls Uno. Allowed with two cards on their own turn (before playing the second-to-last card) or
 * with one card at any time.
 */
export function callUno(state: UnoState, player: number): Step {
  if (state.winner !== null) throw new UnoRuleError('game-over');
  const cards = state.hands[player]!.length;
  if (cards > 2 || (cards === 2 && player !== state.current)) throw new UnoRuleError('cannot-call');
  return { state: { ...state, unoCalled: replaceAt(state.unoCalled, player, true) }, events: [{ type: 'uno', player }] };
}

/**
 * `player` takes up to `count` cards from the draw pile. When the pile runs out, the discard pile under its
 * top card is shuffled into a new one. If both run dry the player simply gets fewer cards.
 */
export function give(state: UnoState, player: number, count: number, reason: GiveReason): Step {
  const events: UnoEvent[] = [];
  let pile = state.drawPile;
  let discard = state.discard;
  let seed = state.seed;
  const taken: Card[] = [];
  for (let i = 0; i < count; i++) {
    if (pile.length === 0) {
      if (discard.length <= 1) break;
      const turned = shuffle(discard.slice(0, -1), seed);
      seed = turned.seed;
      pile = turned.items;
      discard = discard.slice(-1);
      events.push({ type: 'reshuffle', cards: pile.length });
    }
    pile = pile.slice();
    taken.push(pile.pop()!);
  }
  const hand = [...state.hands[player]!, ...taken];
  const unoCalled = hand.length > 1 ? replaceAt(state.unoCalled, player, false) : state.unoCalled;
  events.push({ type: 'draw', player, cards: taken, reason });
  return {
    state: { ...state, hands: replaceAt(state.hands, player, hand), drawPile: pile, discard, seed, unoCalled },
    events,
  };
}

function replaceAt<T>(list: readonly T[], index: number, value: T): T[] {
  const copy = list.slice();
  copy[index] = value;
  return copy;
}
