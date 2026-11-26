# Senterej plan

## Selected historical profile

Build the documented Ethiopian/Eritrean game reconstructed from Walter Plowden's 1868 account, with Richard
Pankhurst's 1971 study and H. J. R. Murray's 1913 history as corroborating references. Senterej is historical
and is reported to have fallen out of use after the 1930s. The sources document one historical game rather
than competing current editions; they do not support a present-day popularity ranking.

Use an 8×8 uncheckered board; the two kings occupy e1 and d8, with the ferzes on d1 and e8. The piece roster
and shatranj-like movements are in `packages/senterej/RULES.md`. Choose the one-diagonal-step Ferz and
automatic Ferz promotion as explicit source decisions. During the simultaneous Werera phase, both players may
move any of their pieces repeatedly and retract/substitute their own moves until the first capture. The
capturing side's opponent then receives the first ordinary turn. The seven-move lone-capital-piece ending is
included.

## Digital conventions

- The rules sources disagree between “first capture” and “first capture of a pawn.” Follow the Wikipedia and
  roadmap description and end Werera on a capture of any piece; record this as a deliberate convention.
- Werera moves obey piece geometry and board occupancy, but check does not constrain these opening actions.
  Checkmate is evaluated when the first capture moves the game into ordinary play. This keeps a non-turn-based
  preparation phase from importing a chess turn check prematurely; it is a digital convention because the
  sources do not define check legality during mobilization.
- The traditional phase permits concurrent action. The server serializes accepted actions in arrival order;
  both seats remain authorized until a capture ends Werera. It stores the actor with each action and supports
  retracting an earlier own Werera move only when the remaining history replays legally and remains in Werera.
- After a first capture, the side that did not capture moves next. The historical source does not specify a
  turn transition from simultaneous play; this is the product's explicit transition rule.
- Same-device pass-and-play uses the same shared board and clearly labels the active opening phase. Against a
  bot, the human may move repeatedly while the bot responds between human actions. Online rooms provide the
  intended separate concurrent inputs.

## Platform support

The actor-aware capability is implemented as `plat-023`. A variant can declare active seats, list legal actions
for a seat and apply an action on that seat's behalf; ordinary variants retain `game.turn` defaults. Local and
online histories carry each actor, saved reviews replay actors, and server rooms validate/replay actor-tagged
actions. Online retraction rebuilds the authoritative history and accepts only a legal remainder that stays in
Werera. Senterej is the first consumer; its implementation has passed private Melon stage and recovery checks.

## Historical clean-room basis

Plowden's 1868 published account is identified as public domain. Use its mechanics as a historical source,
not its text or visual material; corroborating modern scholarship is not a license to copy its wording. The
review found no current publisher, licensor or project-specific asset owner. Proceed as a clean-room historical
game with original piece art, board, interface, tutorial and prose. Preserve the provenance and the source
conflicts in the rules contract and report.

See [`reports/Senterej rules adoption and rights.md`](reports/Senterej%20rules%20adoption%20and%20rights.md).

## Implementation state

- The pure Variant is implemented in `packages/senterej`; the source-linked contract remains in
  `packages/senterej/RULES.md`.
- Six seeded, node-bounded opponents are implemented in `packages/senterej-ai`.
- The “Field of Ochre” identity proposal is `docs/design.md`; owner review is pending. Its board, geometric
  piece marks, interface and tutorial copy are original.
- The independent English PWA includes eight interactive lessons, pass-and-play, saved bot games and offline
  access. Its isolated Worker supports private concurrent-action rooms and has no chat.
- Exact-SHA CI run `45846364938` passed commit `64ec507cb5b8ad2325594024bc67c0d3a117b0b3`.
- Melon stage `chaturanga-stage-senterej-19924` runs at `127.0.0.1:19924` from
  `/home/melon/chaturanga-release.senterej.umZ25h`. The product migration, health endpoint and homepage pass;
  built-stage browser smoke passed 4/4 and the offline PWA smoke passed 1/1.
- The online room replayed its two-seat history after container restart. A stopped-writer copy restored the
  same room and both seats in a separate container, and another legal move synchronized to both clients.
  Temporary restore resources were removed and the primary stage was restarted healthy. The prior stage at
  port `19923` remains available for rollback.
- Public promotion is blocked because Melon's resolver returned no DNS address for the configured hostname.
  HTTPS/WSS checks cannot run; do not change Caddy or the app directory. The Field of Ochre identity proposal
  also awaits owner review.
