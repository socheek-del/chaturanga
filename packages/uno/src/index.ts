/**
 * The rules of the card game Uno as a pure, serialisable state machine — no DOM, no timers, no hidden
 * randomness (the shuffle runs on a seed kept in the state). Nothing here knows about chess: a host game
 * decides which plays make sense in its own world by filtering `playableCards`, and reacts to the events a
 * step returns. Chess uses it for Card Chess (`apps/chess/web/src/features/cards`); any other game could.
 */
export {
  type Card,
  type CardColor,
  type CardKind,
  CARD_COLORS,
  createDeck,
  DECK_SIZE,
  isWild,
  sameFace,
} from './cards';
export { nextSeed, randomOf, shuffle } from './random';
export {
  callUno,
  canPlay,
  DEFAULT_RULES,
  draw,
  give,
  type GiveReason,
  newGame,
  nextPlayer,
  pass,
  play,
  type PlayOptions,
  playableCards,
  type Step,
  topCard,
  type UnoError,
  UnoRuleError,
  type UnoEvent,
  type UnoRules,
  type UnoState,
} from './game';
