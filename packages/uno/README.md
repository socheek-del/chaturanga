# @chaturanga/uno

The rules of the card game Uno as a pure, serialisable state machine. It has no DOM, no timers and no
hidden randomness: the shuffle runs on a seed that lives inside the state, so a game can be saved as JSON,
replayed, and validated on a server.

Nothing here knows about chess. A host game decides which plays make sense in its own world by filtering
`playableCards()`, and reacts to the events each step returns. The chess site uses it for **Card Chess**
(`apps/chess/web/src/features/cards`); any other game in the family could use it the same way.

## What is implemented

- The standard 108-card deck (`createDeck`), a seeded Fisher–Yates shuffle (`shuffle`, `nextSeed`).
- 2–10 players, seven cards each by default, a starting card that is always a number card.
- Matching by colour or by number/symbol; wilds go on anything.
- Skip, Reverse (works like a Skip with two players, the official rule), Draw Two, Wild, Wild Draw Four
  (only when you hold no card of the current colour; `wildDrawFourNeedsNoColorMatch` turns that off).
- Drawing when stuck, passing after a draw (`pass(state, true)` lets a host force a pass).
- Calling Uno: with two cards on your turn, or one card any time. Going down to one card without calling
  costs `unoPenalty` cards (two).
- When the draw pile runs out, the discard pile under its top card is reshuffled into a new one.
- A player who plays their last card wins.

Not implemented (house rules and table talk): stacking draw cards, challenging a Wild Draw Four, points
scoring across rounds, catching another player's missed Uno after the fact.

## Hooks for a host game

- `play(state, cardId, { color, suppressSkip })`: `suppressSkip` keeps a card's draw penalty but cancels the
  lost turn — Card Chess uses it when a move gives check, because the checked side must answer.
- `give(state, player, count, reason)`: makes any player draw for a reason of the host's own (Card Chess:
  every capture).
- Every step returns `events` (`play`, `draw`, `skip`, `reverse`, `uno`, `pass`, `reshuffle`, `win`) for
  animation and logs.

## Commands

```bash
npm test -w packages/uno
```
