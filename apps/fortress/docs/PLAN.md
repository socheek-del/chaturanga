# Russian Four-Handed Fortress Chess

## Edition

The Wikipedia entry points to Russian four-player Fortress Chess, not generic four-handed chess. Implement Alexander Petrov's documented edition (1850; cross-checked against his 1862 account), which is the best evidenced ruleset. Available sources do not establish a most-popular edition. The original scans were not readable in this research pass, so a few details below are declared digital reconstruction choices; see `reports/Fortress Chess rules and rights.md`.

## Product

- Standalone English PWA with its own design identity, manifest, URL, Worker service and isolated persistent online storage.
- Single-player against three bots, with the human able to sit in any of the four seats.
- Four-seat pass-and-play and private four-seat invite rooms. A player may take an open seat; bots can fill any remaining seats for practice.
- Interactive tutorial that teaches the board and walls, fortress-piece setup, four-seat turn order, teams, standard and special moves, check, checkmate, elimination, and the selected stalemate rule.
- Browser saves for local and bot games; server-authoritative validation for online actions; no chat.
- Original board/piece artwork and original wording. No borrowed article prose or third-party board image.

## Rules decisions to implement

The current rules contract is `packages/fortress/RULES.md`. It records the 192-cell layout, the exact rotated two-wall gate topology, seat/team mapping, normal chess movement with the historical knight route, reserve placement, promotion, team checkmate and immediate piece removal. The implementation must encode the walls as blocked edges and verify Markov's published example routes, including forbidden diagonal shortcuts at wall ends.

Digital reconstruction choices are explicit: top Red starts; the three reserves are placed by the player during setup; orthodox en passant and castling apply along each seat's axis subject to fortress walls; promotion is limited to ordinary home ranks; a stalemated active seat causes an immediate draw. Verify every board-edge and wall interaction with fixtures before release.

## Implementation sequence

1. Pure rules package: board mask, wall edges, FEN, 4-seat setup and turns, movement, check, elimination, endings, serialization, and Variant conformance. **Implemented and locally verified.**
2. Bot package: bounded team-aware search with legal fallback; exercise a human against bots from all four seats. **Implemented and locally verified at the package boundary.**
3. Product shell: own design, 16×16 board rendering, setup input, saves, pass-and-play, bot play, move history and accessible tutorials. **Implemented and verified in Chromium at phone and desktop sizes.**
4. Worker: four-seat invite rooms, authoritative rules validation, reconnect and isolated database. **Implemented; unit tests and four-client browser play pass.**
5. CI/build and browser verification; stage exact passing SHA on Melon, test PWA and four-seat rooms across restart, then public HTTPS/WebSocket smoke when the configured hostname resolves. **GitHub CI run 45552897158 passed for `fc5577d3a53e6c90a572457bb24750b3b0e34e52`. That exact revision is staged at `127.0.0.1:19911` in `~/chaturanga-release.fortress.Gz3JGZ`; migration `DB/0001_games.sql`, built PWA browser scenarios, illegal-move rejection, four-seat reconnect, container restart recovery, offline play, and copied-state restore all passed.**

The shared alpha-beta search and room kit currently model two seats. Fortress uses its own team-aware Max-n bot and will follow the Three-player Chess product pattern for its four-seat worker, with all accepted moves replayed through this package.

## Open release risks

- Obtain and inspect the Petrov scans if an accessible copy becomes available; preserve the explicit reconstruction labels unless a primary text changes a decision.
- Check the product and hostname against current app-directory state before adding a catalog entry.
- `fortress.beanroti.com` has no DNS address on Melon. Keep the verified stage intact until DNS and TLS are available; do not promote Caddy or add a catalog entry before public HTTPS/WebSocket smoke passes.
