# Dameo rules contract

This package implements the canonical, best-documented 8×8 Dameo created by Christian Freeling. Research
does not prove it is statistically more popular than experimental alternatives. See
[`apps/dameo/docs/reports/Dameo rules variants rights.md`](../../apps/dameo/docs/reports/Dameo%20rules%20variants%20rights.md)
and the game-local source notes before changing this contract.

## Position

- Board uses all 64 squares. White starts on `a1–h1`, `b2–g2`, `c3–f3`; Black starts on `a8–h8`, `b7–g7`,
  `c6–f6`. White moves first.
- Men and kings occupy one square. A promoted man is a king. Side to move and piece rank are part of the
  position identity.

## Movement

- A man moves forward one square orthogonally or diagonally into an empty square.
- A same-color unbroken line of men may move forward one square along the line when the square immediately
  ahead of the leading man is empty. The line shifts one square; kings cannot take part in line moves.
- A king moves any unobstructed distance along any of the eight orthogonal/diagonal rays.

## Captures

- Any legal capture takes precedence over every quiet move. Captures are orthogonal only.
- A man leaps over one adjacent opponent, forward, backward or sideways, into the immediately following
  empty square.
- A king leaps over one opponent on an unobstructed orthogonal ray and may land on any empty square beyond
  that target before the next blocker.
- The same piece continues capturing while a further capture exists. The full turn must capture the maximum
  number of enemy pieces among all legal routes and starting pieces; men and kings have equal capture value.
- Captured pieces remain on their squares until the capture turn is complete and may not be jumped twice in
  the same route. An empty landing square may be visited more than once. This supports Coup Turc.
- A man promotes only if it ends the full turn on the opponent's back rank. Passing that rank during a
  capture does not promote; only the leading man promotes when a line move reaches that rank.

## Endings and selected digital conventions

- A player with no legal move loses, whether all pieces were captured or all remaining pieces are blocked.
- The same position repeated three times for the same player to move is a draw.
- Wikipedia describes a draw when neither player can win, but the creator's current rules use undefined
  “mutual exhaustion of material” wording and a separate creator page mentions mutual agreement. For this
  digital version, a mutually accepted draw action handles the no-winner case; repetition remains automatic.
- There is no 50-move rule. Do not add a material-count or move-count draw heuristic without a documented
  rule decision and focused fixtures.

## Notation, replay and conformance

Use the shared Variant interface and standard square names `a1`–`h8`. A compound turn, including every hop
in a capture route, is one serialized legal move so replay, online validation and undo see the same route.
Keep the rules package pure: no DOM, network, timers or ambient randomness. Seed any randomized bot behavior
through its injected seed.
