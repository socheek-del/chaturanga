export type CardColor = 'red' | 'yellow' | 'green' | 'blue';
export type CardKind = 'number' | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild4';

export const CARD_COLORS: readonly CardColor[] = ['red', 'yellow', 'green', 'blue'];

/** One physical card. `id` is unique within a deck, so a hand can hold two cards with the same face. */
export interface Card {
  id: number;
  kind: CardKind;
  /** Null for the two wild kinds; a wild takes the colour its player names. */
  color: CardColor | null;
  /** 0..9 for number cards, null otherwise. */
  value: number | null;
}

/** The standard 108-card deck. */
export const DECK_SIZE = 108;

export const isWild = (card: Card): boolean => card.kind === 'wild' || card.kind === 'wild4';

/** Same symbol: the same number, or the same action. Colour is not compared. */
export const sameFace = (a: Card, b: Card): boolean =>
  a.kind === 'number' ? b.kind === 'number' && a.value === b.value : a.kind === b.kind;

/**
 * Per colour: one 0, two each of 1..9, two Skips, two Reverses and two Draw Twos (25 × 4 = 100); then four
 * Wilds and four Wild Draw Fours. Ids follow this order, so a fresh deck is always the same list.
 */
export function createDeck(): Card[] {
  const cards: Card[] = [];
  let id = 0;
  for (const color of CARD_COLORS) {
    cards.push({ id: id++, kind: 'number', color, value: 0 });
    for (let value = 1; value <= 9; value++) {
      for (let copy = 0; copy < 2; copy++) cards.push({ id: id++, kind: 'number', color, value });
    }
    for (const kind of ['skip', 'reverse', 'draw2'] as const) {
      for (let copy = 0; copy < 2; copy++) cards.push({ id: id++, kind, color, value: null });
    }
  }
  for (const kind of ['wild', 'wild4'] as const) {
    for (let copy = 0; copy < 4; copy++) cards.push({ id: id++, kind, color: null, value: null });
  }
  return cards;
}
