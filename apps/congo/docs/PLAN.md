# Congo

## Selected game

Use Demian Freeling's 1982 two-player 7×7 Congo chess variant, not the similarly named historic hexagonal four-player game. It is the only Congo chess edition in the roadmap. MindSports documents the rules and says it became the second most popular chess variant at the Fanaat club; that is local use, not a general ranking. See [`reports/Congo rules and rights.md`](reports/Congo%20rules%20and%20rights.md).

## Product

- Standalone English PWA with original animal-piece art and product identity.
- Bot play as White or Black, plus pass-and-play and saved local games.
- Private two-seat online rooms with server-side move validation, reconnect and isolated Melon storage. No chat.
- Interactive tutorial teaches the objective, castles, each piece, river and drowning, Monkey routes, Pawns and Superpawn, and endings through guided moves and feedback.
- Use the generic rectangular 7×7 board. Encode Monkey multi-capture routes as one move from source through each landing square.

## Implementation sequence

1. [x] Select the rules and document the source and rights boundary.
2. [x] Implemented `@chaturanga/congo` with validated 7×7 FEN, Monkey routes, river deadlines, drowning, promotion, endings and `Variant` conformance. Rules tests pass 31/31 with seeded replay/undo. No compatible external engine preset was found; use source-backed fixtures and mark drowning in move records.
3. [x] Added six bounded deterministic bot levels on ai-core; verified legal choices as both players, a direct Lion capture, Monkey routes and river-deadline positions (3 bot tests).
4. [x] Built the independent English PWA with original river board and animal seals, eight interactive lessons, save/reload/takeback, pass-and-play, six bot levels and offline install. Web tests pass 35/35, Playwright 5/5, and offline PWA 1/1.
5. [x] Added the Congo-only Durable Object/D1 Worker and private rooms/quick match. Worker tests pass 9/9, including illegal-move rejection, server-validated Monkey multi-capture, reconnect recovery, finished-game persistence and no chat. Shared protocol now accepts complete route notation.
6. [ ] Pass exact-SHA CI, stage on Melon, and verify the production assets, tutorial, bots, rooms, restart and copied-state restore. Add the public route and directory entry only after DNS/TLS and HTTPS/WebSocket smoke.

## Rules decisions

The package contract is [`packages/congo/RULES.md`](../../../packages/congo/RULES.md). Core decisions: no check/checkmate; capturing the Lion wins immediately; no legal move loses; only two remaining Lions with no immediate mutual capture draw. A non-Crocodile ending a turn in the river must leave it on its next own turn or drown. Pawns gain retreat on the opposite bank; promoted Superpawns retreat anywhere. Repetition is a documented digital draw convention; there is no 50-move rule.

## Release details

- Hostname: `congo.beanroti.com`, read from this product's `site.config.ts` setting.
- Reserve local web/Worker ports `5196`/`8796` unless a later port inventory finds a conflict.
- Deployment target: Melon via `ssh melon`. Keep a separate Workerd data directory and D1 for this product.
- Do not add Congo to the family catalog until the public route and product smoke pass.
