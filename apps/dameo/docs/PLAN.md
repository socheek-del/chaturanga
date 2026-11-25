# Dameo

## Selection and provenance

Implement Christian Freeling's canonical 8×8 Dameo, with 18 men per side. The standard game is the
best-documented form; the reviewed evidence does not prove that it is more popular than Big Dameo or
community experiments. Dameo was created in 2000. The full rules, adoption evidence, source conflicts and
rights boundary are in the [Dameo rules, variants and rights report](reports/Dameo%20rules%20variants%20rights.md).

## Selected rules

- Board: all 64 squares of an 8×8 board. White has men on `a1–h1`, `b2–g2`, `c3–f3`; Black has the mirrored
  setup on `a8–h8`, `b7–g7`, `c6–f6`. White moves first.
- Men move one square forward, straight or diagonally. A straight, unbroken line of friendly men may move
  forward together by one square along its line when the leading square is vacant. Kings do not use this
  group move; kings move any unobstructed distance in any of eight directions.
- Captures are compulsory and orthogonal only. A man captures by jumping an adjacent opponent forward,
  backward or sideways to the empty square immediately beyond. A king captures orthogonally over one
  opponent to any unobstructed empty square beyond it.
- A capture sequence must continue. The player must choose the entire legal route capturing the largest
  number of pieces across all available starting pieces; men and kings count equally. A captured piece
  remains as a blocker until the turn ends and cannot be jumped twice during that turn. Empty squares may
  be revisited. These conditions support Coup Turc positions.
- Promotion occurs only when a man ends its whole turn on the far rank. A man passing that rank during a
  capture route does not promote. If a line move places a line on the far rank, only its leading man is
  promoted.
- A player with no legal move loses, including elimination and complete blockage. Threefold repetition
  draws when the same position recurs for the same side to move; position identity includes man/king status.
- The creator's current rules call draws “mutual exhaustion of material” without defining it; another
  creator-authored page says mutual agreement or threefold repetition; Wikipedia describes threefold and a
  draw when neither player can win. For v1, make threefold automatic and support a mutually accepted draw
  as the explicit digital adjudication for a no-winner position. Do not add a 50-move rule or invent an
  automatic material heuristic without a source-backed definition.

## Rights boundary

Write all rules and tutorial prose independently, and create original board/piece art, branding and layout.
Do not use MindSports' wording, diagrams, screenshots, logo or illustrations. The report's U.S./UK guidance
supports this scoped implementation approach; it is not worldwide legal clearance. Copyright guidance does
not clear the name `Dameo` as product branding. Keep the public launch gated on a trademark review as well as
DNS/TLS and HTTPS/WebSocket checks.

## Product contract

- Independent English PWA with original identity and art; add a product design document before UI work.
- Bounded bots for both sides, local pass-and-play, saved/reloaded games and responsive board.
- Interactive tutorial that teaches every selected rule, including line moves, compulsory maximum captures,
  capture blockers, Coup Turc, promotion timing, blockage and draw conventions.
- Private online rooms and quick match, with all moves validated by the Dameo rules engine and isolated
  product storage. No chat.
- Installable offline-capable PWA; every visible string uses the English locale.
- Melon deployment via `ssh melon`. Do not add a Caddy route or directory entry until the hostname has
  DNS/TLS, HTTPS/WSS and full play smoke; resolve product-name clearance before public promotion.
- Reserved local ports: web `5202`, PWA preview `4202`, Worker `8812` (recheck listeners before use).

## Sequence

1. [x] Research standard rules, editions/popularity evidence and rights; notes and synthesis are under
   `docs/research_notes/` and `docs/reports/`.
2. [x] Select the canonical 8×8/18-men standard as best-documented without claiming a proven popularity
   winner. Record the source conflict and explicit draw convention in the rules contract.
3. [x] Encode the exact board setup and coordinate convention before move generation. The `@chaturanga/dameo`
   layout fixture covers all 64 squares, both 18-man trapezoids, mirroring, spacing and invalid coordinates;
   all 5 layout tests, package typecheck and lint passed.
4. [x] Implement `@chaturanga/dameo` as a pure 8×8 `Variant`, including line moves, compulsory maximum
   capture routes, delayed capture removal, Coup Turc, promotion, endings, serialization and replay/undo.
   `npm test -w packages/dameo` passed 36/36, including shared conformance with five seeded 120-ply games,
   route/line fixtures, blocked repeated captures, promotion timing, status, replay/undo and attack maps;
   package typecheck and ESLint passed. No compatible Fairy-Stockfish Dameo preset is available, so the
   engine uses source-derived fixtures rather than claiming an external move oracle.
5. [x] Add bounded bots for both roles in `@chaturanga/dameo-ai`. Six levels, fixed node budgets, immediate
   elimination, compulsory maximum capture, full route strings, seeded selection and make/unmake are covered;
   all 16 focused tests, package typecheck and ESLint passed. Full workspace `npm run verify` also passed
   under Node 25 with loopback enabled for the existing Cloudflare Worker suites.
6. [x] Write the original product design brief in `docs/design.md`, including the route-atlas identity,
   local typography/art direction, board and responsive screen layouts, accessibility and public-name gate.
7. [x] Build an interactive tutorial that validates every selected rule: nine original lessons in three units
   cover the setup and movement, line shifts, king range and captures, compulsory maximum routes, delayed
   blockers, Coup Turc, promotion timing, blocked loss, repetition and agreed draws. `RULE_LESSONS` maps each
   selected rule/convention to a lesson. Web content and locale checks passed 45/45; web typecheck, ESLint and
   production PWA build passed. Headless browser smoke opened the home and first lesson, answered a rule quiz,
   and found no horizontal overflow at 390px. Full workspace `npm run verify` also passed under Node 25.9 with
   `NODE_OPTIONS=--no-experimental-webstorage` and loopback enabled for Worker tests.
8. [ ] Ship the independent PWA with responsive play, local saves, offline install and complete locale keys. Play modes are implemented: pass-and-play and all six worker-based bots work for either human color, sessions restore by replay, and a two-step local agreement ends in a recorded draw. Web/game-shell checks and desktop/mobile browser smoke passed on 2026-11-26; offline install/reload is still to verify.
9. [ ] Add isolated server-authoritative private rooms/quick match and verify reconnect and rule validation.
10. [ ] Pass exact-SHA CI and stage on Melon; verify tutorial, bots, online play, offline mode, restart and
    copied-state restore. Publish only after the public gates in this plan pass.

## Sources

- [MindSports: Dameo rules](https://mindsports.nl/index.php/arena/dameo/65-rules)
- [MindSports: About Dameo](https://mindsports.nl/index.php/arena/dameo/64-about-dameo)
- [MindSports: Dameo history](https://mindsports.nl/index.php/on-the-evolution-of-draughts-variants/draughts-variants/509-dameo)
- [FMJD-hosted Checkers families and rules survey](https://www.fmjd.org/downloads/variants/Checkers_families_and_rules_28-9-2018.pdf)
- [Wikipedia: Dameo](https://en.wikipedia.org/wiki/Dameo)
- [BoardGameGeek: Dameo](https://boardgamegeek.com/boardgame/24698/dameo)
- [PlayStrategy: Dameo library](https://playstrategy.org/library/dameo)
- [U.S. Copyright Office: Games](https://www.copyright.gov/register/tx-games.html)
- [USPTO: Federal trademark searching](https://www.uspto.gov/trademarks/search/federal-trademark-searching)
