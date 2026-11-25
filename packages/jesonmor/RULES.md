# Jeson Mor, as implemented

This product implements the best-documented traditional 9×9 Jeson Mor rules described in
[`apps/jesonmor/docs/reports/Jeson Mor rules selection.md`](../../apps/jesonmor/docs/reports/Jeson%20Mor%20rules%20selection.md).
The 9×9-square board and knight-like horse pieces are supported by the ethnographic record; the first-rank
setup, choice of first player, and the two victory routes follow the later published rules account. The
sources do not establish which board representation is most popular.

## Board and pieces

- The board has files `a` through `i` and ranks `1` through `9`; `e5` is the center.
- Each player begins with nine identical horse pieces on their home rank. White occupies rank 1 and Black
  rank 9. Either side may be selected to move first; the default start position has White first.
- Every piece moves as a chess knight: two squares along one axis, then one perpendicular. It may jump over
  occupied squares and may land on an empty square or capture an opposing horse. A player may not land on
  their own piece.
- A horse on `e5` can be captured.
- There are no kings, checks, checkmate, castling, promotion, drops, or other piece types.

## Winning

A player wins by either:

1. Capturing every opposing horse; or
2. Moving one of their horses onto `e5`, allowing the opponent one reply, then moving that same horse away
   from `e5` on its next turn.

The second route is a product clarification. The cited later wording says to reach and then leave the center,
but does not specify whether the player can wait through several turns. This implementation requires the
same horse to leave on its immediately following turn. During the opponent's reply, the center horse may be
captured, which cancels that attempt. Merely surviving the reply is not a win. If the owner must leave the
center but every knight move from `e5` is blocked by friendly horses, that side loses by the digital
no-legal-move convention below.

## Draws and other endings

- Three occurrences of the same board, side to move, and pending center claimant are a draw. Repetition is
  a digital convention; the inspected traditional sources do not specify it.
- If the side to move has no legal move, it loses. This is another explicit digital convention for an
  otherwise unspecified position.
- There is no 50-move rule. Capturing pieces is a secondary goal in the traditional description, so a
  move-count draw would add a rule without source support.
- Reaching `e5` is not itself a terminal result. The game ends only after the required escape or total
  elimination.

## Coordinate and FEN format

The engine uses a–i files and 1–9 ranks, with `a1 = 0` and `i9 = 80` in the numeric board. Both armies use
the FEN piece letter `n` (`N` for White and `n` for Black). The start FEN is:

```text
nnnnnnnnn/9/9/9/9/9/9/9/NNNNNNNNN w - - 0 1 -
```

Jeson Mor FEN extends the six standard fields with a seventh goal-state token:

- `-`: no center attempt or center victory is pending.
- `w` or `b`: that side has a horse on `e5` and must move the same horse away on its next turn. The side to
  move in the usual FEN field determines whether the opponent still has its reply or the claimant must
  escape now.
- `gw` or `gb`: the named side has completed the center escape and won.

The six-field spelling is accepted as a position with no pending center attempt. A side with zero horses
has lost by elimination. The halfmove/fullmove fields are maintained for interoperable game records; they
do not trigger a move-count ending.

Moves use four-character coordinates, for example `c4e5` or `e5f7`. Move-list SAN is coordinate-based:
`c4-e5` for a quiet move and `c4xe5` for a capture, since every piece has the same movement.

## Content and implementation boundary

The movement and objectives are facts of play. This repository independently authors the engine, explanatory
rules, lessons, horse artwork, and brand. It does not copy the cited books, encyclopedia text, or other games'
assets. The source review is not a Mongolian-law opinion or worldwide trademark/copyright clearance.
