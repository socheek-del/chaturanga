# Four-handed chess implementation plan

## Selected ruleset

Build a four-seat Free-for-All game on the established 160-square cross board. This is a practical modern tournament-documented form, not a claim that it is the most popular four-handed form across history. The 2026 Chess.com championship uses FFA and random player-to-colour assignment; the product uses its own original name, art, interface and tutorial writing.

The complete v1 rules contract is in [`packages/fourchess/RULES.md`](../../../packages/fourchess/RULES.md). It fixes the cross-board mask, seat-oriented starting arrangement, clockwise turn order, orthodox movement adapted to four directions, automatic Queen promotion on each seat's eighth rank, checkmate/stalemate elimination, dead pieces, scoring, draw conventions and the no-clock resignation convention.

## Sources and adoption limits

- [Chess.com 4 Player Chess rules overview](https://www.chess.com/terms/4-player-chess) documents the 160-square board, four colors, Red-first clockwise play and point-scored FFA mechanics.
- [Chess.com 4PC help article](https://support.chess.com/en/articles/8614233-4-player-chess-4pc), dated October 10, 2025, records the current FFA score values, promotion, dead-piece, elimination and draw conventions.
- [Chess.com 2026 event rules](https://www.chess.com/official-event-rules) establish current FFA tournament use with random player-to-colour assignment. Their 3/1.5/0.75/0 placement score is for the Arena tournament and is not the single-game score.
- [George Hope Verney's 1881 Four-handed Chess](https://play.google.com/store/books/details/George_Hope_Verney_Four_handed_Chess?id=ZEMCAAAAQAAJ) documents an earlier partnership form. It is evidence that multiple established forms exist, not the selected FFA rules source.
- [U.S. Copyright Office: Games](https://www.copyright.gov/register/tx-games.html) says game ideas, titles and methods of play are not protected by copyright, while rules text and artwork may be protected. This is a source for the rules-expression boundary, not a global legal opinion.

Available sources do not prove a popularity winner. The selection follows a currently tournament-documented FFA convention. We will independently implement the mechanics and write all rule explanations, UI and art. Do not copy Chess.com or other publishers' source code, logos, diagrams, art, page text or branding. No permission request or external contact is needed for the generic rules-only implementation; public naming still needs the product's normal original-design review.

## Product shape

- Independent English-first PWA, isolated site/service configuration and original visual identity.
- A pure serializable `@chaturanga/fourchess` Variant, with a 14×14 coordinate envelope and a 160-cell playable mask.
- Deterministic, bounded multi-player bots that can occupy any of the three seats around one human; four-seat pass-and-play and private four-seat online rooms.
- Server validation for every online move, isolated Melon persistence, reconnect, restart and copied-state restore checks. No chat.
- An interactive tutorial with guided practice for the board, seat order, movement, check, promotion, score, elimination and game endings.

## Implementation status (2026-11-26)

- Pure rules engine and conformance: implemented in `packages/fourchess`; 24 focused tests pass, including the cross mask, four-seat move order, castling, en passant, promotion, elimination/scoring, replay/undo, and shared Variant conformance.
- Bots: three deterministic bounded levels in `packages/fourchess-ai`; 4 focused tests pass.
- PWA and tutorial: implemented in `apps/fourchess/web`; pass-and-play, bot play, local saves, responsive offline PWA, and 11 interactive English lessons. The tutorial includes guided legal moves and quizzes for scoring, auto-promotion, elimination, and endings.
- Online rooms: implemented in `apps/fourchess/worker`; four stable seats, server-side Variant validation, reconnect, resignation, and an isolated game archive. No chat protocol exists.
- Shared support: board UI accepts generic seat colors; shared terminal results and the network result schema preserve multi-seat winners and scores.
- Local verification: `NODE_OPTIONS=--no-experimental-webstorage npm run verify` passed with loopback access; `npm run build:fourchess` passed; the focused browser suite passed 4/4 scenarios. This shell ran Node 25.9 because the pinned Node 22.23.1 and nvm are unavailable; exact-SHA CI remains a release gate.
- Release state: Melon staging, four-seat room/restart/recovery smoke, and public HTTPS/WSS checks are pending. Do not change Caddy or publish the app-directory entry before public DNS/TLS and endpoint smoke pass.

## Dependencies and release gates

The shared Variant contract already supports arbitrary seat lists and masked rectangular boards. Four-seat board colors and point-scored outcomes are now represented by narrow shared changes. The online room is four-seat and server-authoritative.

Before public routing, stage an exact verified main SHA on an unused Melon loopback port, allocate isolated persistent storage, smoke the site and API, test four independent room seats, restart recovery and copied-state restore. Do not change Caddy or publish the app-directory entry until the product hostname has working DNS/TLS and HTTPS/WSS smoke. Cloudflare is only a fallback for a documented Melon limitation.
