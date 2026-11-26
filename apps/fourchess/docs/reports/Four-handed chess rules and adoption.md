# Four-handed chess rules and adoption review

Date: 2026-11-26

## Decision

Use a four-seat Free-for-All game on the 160-square cross board. No evidence reviewed establishes a single most popular form of four-handed chess. This selection follows a current, tournament-documented FFA form and keeps the product clearly labeled as one version of a broad family.

The machine-readable contract is [`packages/fourchess/RULES.md`](../../../../packages/fourchess/RULES.md). It independently specifies the 14×14 mask, seat geometry, starting armies, movement, eight-rank promotion, checkmate/stalemate elimination, scoring, ties and digital endings. Chess.com event placement scoring is not used as single-game scoring. The selected product has no teams mode, clock or timeout in v1.

## Rules evidence

- Chess.com's [4 Player Chess rules overview](https://www.chess.com/terms/4-player-chess) describes a 160-square board, Red-first clockwise turns, FFA and its capture/check point conventions. Its standard FFA description says Pawns promote to Queens on each player's eighth rank and become worth one point if captured.
- Chess.com's [4PC help article](https://support.chess.com/en/articles/8614233-4-player-chess-4pc), dated 2025-10-10, gives the current capture values, checkmate bonus, multi-King check bonuses, dead-piece behavior, three-elimination game end and automatic draw conventions.
- Chess.com's [2026 event rules](https://www.chess.com/official-event-rules) use FFA in the championship and randomize player-to-color assignment. Its 3/1.5/0.75/0 values rank an Arena tournament, not an individual game.
- Wikipedia's [Four-player chess overview](https://en.wikipedia.org/wiki/Four-player_chess) calls the game a family with differing King/Queen setups and describes FFA as the current online form. Its displayed popular 14×14 setup places all four Queens on the same square color; the engine follows that seat-specific orientation.
- George Hope Verney's [1881 Four-handed Chess](https://play.google.com/store/books/details/George_Hope_Verney_Four_handed_Chess?id=ZEMCAAAAQAAJ) documents an older partnership form and supports treating the category as a family rather than one universally standardized game.
- The current [Chess.com help article](https://support.chess.com/en/articles/8614233-4-player-chess-4pc) and [rules overview](https://www.chess.com/terms/4-player-chess) differ in some detailed scoring/end wording. V1 records explicit deterministic conventions in the product rules contract rather than reproducing every platform-specific behavior, especially timeout-driven random Kings and early-score termination.

## Rights and original expression

The target is the generic four-handed chess rules family, not a Chess.com product or a copy of another online implementation. The [U.S. Copyright Office's Games guidance](https://www.copyright.gov/register/tx-games.html) explains that game ideas, names and methods of play are not protected by copyright, while rules text and art can be. This source supports a rules-only clean-room implementation for this project; it is not a jurisdiction-by-jurisdiction legal opinion.

Write all code and tutorial explanations from scratch. Create an original product name/identity, artwork, board treatment and prose. Do not copy any source's code, diagrams, art, logos or text. No external contact has been made.

## Deployment fit to confirm during implementation

Melon is the project's target. A previous inventory verified Docker, Caddy and existing standalone `workerd` services. Before public promotion, allocate a new loopback port and isolated persistent volume, validate four-seat room capacity, migration/backup/restore and container restart recovery, then verify public DNS/TLS/HTTPS/WSS before changing Caddy or the Beanroti catalog. Cloudflare remains fallback-only if a measured Melon limitation blocks delivery.
