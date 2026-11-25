# Evaluator Rubric

Use this rubric after implementation and before final acceptance of a feature.

| Category | Question | Score (0-2) | Notes |
| --- | --- | --- | --- |
| Correctness | Does the implemented behavior match the feature's `user_visible_behavior`? |  |  |
| Rules fidelity | For engine/AI/online work: do results agree with the game's Fairy-Stockfish variant (perft, lock-step games, counting rules) and pass the rules-core Variant conformance suite? |  |  |
| Verification | Did the required checks actually run, with evidence recorded? |  |  |
| Scope discipline | Did the session stay inside the chosen feature scope? |  |  |
| Localization | Are all new strings in every language the product declares (Makruk: Thai default + English; Sittuyin: Burmese default + English)? Does the text render and fit? |  |  |
| UX & design | Does it follow the product's own design system (Makruk: "Wat", `apps/makruk/docs/design.md`), avoid copying other products' trade dress, and work at ~400px width? |  |  |
| Product separation | Does game-specific content stay in that game's folders, with nothing game-specific added to the root or shared packages? |  |  |
| Reliability | Does the result survive restart, reload, or reconnect without repair? |  |  |
| Maintainability | Is the code and documentation clear enough for the next session? |  |  |
| Handoff readiness | Can a fresh session continue work from repo artifacts only? |  |  |

Mark "n/a" for categories that do not apply to the feature.

## Verdict

- Accept
- Revise
- Block

## Required Follow-Up

- Missing evidence:
- Required fixes:
- Next review trigger:

## Fortress Chess review — 2026-11-25

| Category | Score | Notes |
| --- | ---: | --- |
| Correctness | 2 | Four-seat rules, bots, tutorial, local saves and invite rooms work in the staged product. |
| Rules fidelity | 1 | Variant conformance and Markov geometry fixtures pass; the selected historic rules have no Fairy-Stockfish oracle and Petrov's scan was unavailable. |
| Verification | 2 | Full GitHub CI passed; staged browser checks covered bot seats, legality, reconnect, offline, restart and copied-state restore. |
| Scope discipline | 2 | Work stayed within Fortress and the narrow shared conformance timeout option it required. |
| Localization | 2 | English-only product; visible strings are keyed in its declared locale. |
| UX & design | 2 | Original visual identity reviewed at phone and desktop sizes; tutorial completes at both widths. |
| Product separation | 2 | Rules, art, lessons, site and isolated Worker live under Fortress folders. |
| Reliability | 2 | Save/reload, reconnect, container restart and a separate copied-state restore all recovered. |
| Maintainability | 2 | Rules decisions, sources, stage pin and unresolved DNS gate are recorded beside the product and in the handoff. |
| Handoff readiness | 2 | Exact staged SHA, port, directory, CI run and next public release gate are recorded. |

**Verdict:** Accept the staged implementation. Public release remains blocked until `fortress.beanroti.com` resolves and HTTPS/WebSocket smoke passes.

**Required follow-up:** Configure the hostname's DNS, then promote the verified Melon stage, run public smoke and publish the directory entry. Revisit rules fidelity if an inspectable Petrov scan or reference engine becomes available.

## Crazyhouse rules-engine increment review — 2026-11-25

| Category | Score | Notes |
| --- | ---: | --- |
| Correctness | 2 | Captures, drops, check blocking, promoted-piece reversion, special moves and endings are implemented. |
| Rules fidelity | 2 | Shared Variant conformance, focused fixtures and 16 seeded games match Fairy-Stockfish legal moves, SAN, FEN and results. |
| Verification | 2 | Package typecheck, targeted ESLint and all 30 package tests passed. |
| Scope discipline | 2 | Changes stay in the Crazyhouse package and its product notes. |
| Localization | n/a | The rules package adds no user-visible strings. |
| UX & design | n/a | Product interface is not part of this increment. |
| Product separation | 2 | Crazyhouse has its own package and rules contract. |
| Reliability | 2 | FEN round-trip, undo and seeded server-style replay pass. |
| Maintainability | 2 | Wrapper boundaries, pocket order, draw behavior and oracle fixtures are documented. |
| Handoff readiness | 2 | `feature_list.json`, `claude-progress.md`, plan and session handoff name the next implementation step. |

**Verdict:** Accept the Crazyhouse rules-engine increment. The full product remains in progress until its bot, tutorial, PWA, online rooms and Melon stage are verified.

**Required follow-up:** Implement `@chaturanga/crazyhouse-ai`, then continue through the tutorial, product and online milestones. Run full CI after the engine commit.

## Crazyhouse bot increment review — 2026-11-25

| Category | Score | Notes |
| --- | ---: | --- |
| Correctness | 2 | Bot moves remain legal in board-only and pocket positions for both colors; mate-in-one drops are found. |
| Rules fidelity | 2 | Search make/unmake, pocket state, promotion provenance, tactical drops and position keys are covered by rules fixtures and seeded bot tests. |
| Verification | 2 | AI typecheck, targeted ESLint and all 5 package tests passed; base rules suite is included in passing full CI. |
| Scope discipline | 2 | AI code and tests live only in the Crazyhouse AI package. |
| Localization | n/a | The AI package adds no user-visible strings. |
| UX & design | n/a | Product interface is not part of this increment. |
| Product separation | 2 | Crazyhouse bots have their own six-level package and persona keys. |
| Reliability | 2 | Search obeys a fixed node budget and returns deterministic seeded choices. |
| Maintainability | 2 | The adapter, evaluator, persona table and public chooser are separate modules. |
| Handoff readiness | 2 | CI SHA/run, test evidence and next PWA milestone are recorded in the handoff artifacts. |

**Verdict:** Accept the Crazyhouse AI increment. Overall product work remains in progress.

**Required follow-up:** Build the independent PWA with a complete interactive tutorial, then implement private online rooms and stage the exact verified SHA on Melon.

## Crazyhouse product checkpoint review — 2026-11-25

| Category | Score | Notes |
| --- | ---: | --- |
| Correctness | 2 | Local, bot and shared pocket/drop play work; the Worker rejects illegal and out-of-turn moves through the Crazyhouse Variant. |
| Rules fidelity | 2 | The engine already passes Variant conformance and seeded Fairy-Stockfish comparisons; online tests exercise a capture and pawn drop. |
| Verification | 1 | Full repository verification, product build, 5/5 local browser scenarios and 1/1 offline PWA check passed; exact-SHA CI for this product increment is pending. |
| Scope discipline | 2 | Product code lives under Crazyhouse; only root product scripts and the shared family helper type were adjusted to keep the unpublished product out of family links. |
| Localization | 2 | English-only dictionary includes every literal app key and all shared online lobby, room and clock keys. |
| UX & design | 2 | Original foundry identity and piece art; the online lobby was reviewed at 390px and 1440px without horizontal overflow. |
| Product separation | 2 | Own PWA, service, Durable Objects, D1, site setting, locale, tutorial, README and storage keys. |
| Reliability | 1 | Local reload/reconnect and DO eviction pass; Melon container restart and copied-state restore are pending. |
| Maintainability | 2 | Rules/rights decisions, local ports, run commands and release steps are recorded beside the product. |
| Handoff readiness | 2 | Progress, feature state, plan, quality notes and the next exact-SHA/Melon steps are recorded. |

**Verdict:** Revise before release acceptance. Local implementation is complete; deployment evidence is not.

**Required follow-up:** Commit and push the product increment, wait for exact-SHA CI, then stage that SHA on Melon and verify the built PWA, migration, rooms, restart and copied-state restore. DNS/TLS and public HTTPS/WebSocket smoke remain the final route/catalog gate.

## Crazyhouse Melon stage checkpoint review — 2026-11-25

| Category | Score | Notes |
| --- | ---: | --- |
| Correctness | 2 | Tutorial, bot, browser PWA, capture-to-pocket, server-validated drop and reconnect work on the staged build. |
| Rules fidelity | 2 | The staged room uses the same Crazyhouse Variant already checked against Fairy-Stockfish and shared conformance. |
| Verification | 2 | Exact-SHA CI passed; Melon migration, production assets, offline reload, two-seat play, restart and copied-state restore passed. |
| Scope discipline | 2 | Stage and temporary restore used Crazyhouse's isolated state; no Caddy route or catalog entry changed. |
| Localization | 2 | All declared English strings, including shared online controls, are covered by locale tests. |
| UX & design | 2 | Desktop/phone visual review and staged tutorial/PWA smoke passed. |
| Product separation | 2 | Independent site, Worker, Durable Objects, D1 and Melon stage directory. |
| Reliability | 2 | An active room survived container restart and a copied-state restore, and both continued play. |
| Maintainability | 2 | Stage pin, path, port, evidence and DNS gate are written in the handoff artifacts. |
| Handoff readiness | 2 | The next Wave 1 game is Congo; the rules and rights review must precede its engine. |

**Verdict:** Accept the Crazyhouse implementation and Melon staging checkpoint. Keep `crazyhouse-001` blocked only at public HTTPS/WebSocket smoke and catalog publication because `crazyhouse.beanroti.com` has no DNS answer.

**Required follow-up:** Add the product hostname through the authorized DNS path, verify TLS and public HTTPS/WebSocket play on Melon, then publish the app-directory entry. Continue with Congo while that public-route gate is unavailable.

## Congo rules-engine increment review — 2026-11-25

| Category | Score | Notes |
| --- | ---: | --- |
| Correctness | 2 | Piece movement, Monkey routes, automatic promotion, river deadlines/drowning and game endings are implemented from the selected rules contract. |
| Rules fidelity | 2 | Rules tests cover every piece and the source-backed river, Lion, Monkey and bare-Lion decisions; no compatible external engine preset exists. |
| Verification | 2 | Congo package passed 31/31 tests; full repository lint, typecheck and test verification passed. |
| Scope discipline | 2 | Changes are limited to the Congo package plus additive Variant move-record/conformance support for captures and drowning. |
| Localization | 2 | No user-facing product strings have been added at the rules-engine stage. |
| UX & design | 1 | Product interface work has not started. |
| Product separation | 2 | Isolated `@chaturanga/congo` package and rules contract. |
| Reliability | 2 | FEN round-trips, seeded games replay and undo, and river state participates in repetition identity. |
| Maintainability | 2 | Piece movement, position/FEN and game state are separated; package notes document the variant contract. |
| Handoff readiness | 2 | Plan, feature evidence and next bot step are recorded in repository artifacts. |

**Verdict:** Accept the Congo engine increment. Overall product work remains in progress until the bot, interactive tutorial, PWA, online service and Melon stage are verified.

## Congo bot increment review — 2026-11-25

| Category | Score | Notes |
| --- | ---: | --- |
| Correctness | 2 | Six levels choose legal Congo moves for both sides; direct Lion capture and no-legal-move endings are covered. |
| Rules fidelity | 2 | Search uses the Congo Variant for Monkey routes, promotion, river deadlines, drowning and repetition state. |
| Verification | 2 | Congo AI typecheck/lint and 3 package tests passed; the bot checks seeded choices, both colors, move caps, Monkey and river positions. |
| Scope discipline | 2 | Bot code and tests live in the isolated `@chaturanga/congo-ai` package. |
| Localization | 2 | No product strings have been added at the bot package stage. |
| UX & design | 1 | Product interface work has not started. |
| Product separation | 2 | Separate AI package depends on Congo rules and shared ai-core. |
| Reliability | 2 | Search has node and time budgets, a legal fallback and deterministic injected randomness. |
| Maintainability | 2 | Adapter, persona list, and evaluator are separated and documented. |
| Handoff readiness | 2 | Bot step and next PWA/tutorial work are recorded in the plan and handoff. |

**Verdict:** Accept the Congo bot increment. Overall product work remains in progress until the tutorial, PWA, online service, and Melon stage are complete.

## Congo PWA and online service increment review — 2026-11-25

| Category | Score | Notes |
| --- | ---: | --- |
| Correctness | 2 | Eight guided lessons use real Congo legal moves; local play and six bounded bots are available; online moves are validated by the Congo Variant on the server. |
| Rules fidelity | 2 | Tutorial and online tests exercise river deadlines, Monkey multi-capture route notation, and selected endings. |
| Verification | 2 | Web 35/35, Worker 9/9, protocol 6/6, Playwright 5/5, offline PWA 1/1, Congo build and full repository verify passed. |
| Scope discipline | 2 | Product UI and service are isolated under `apps/congo`; only additive protocol and result-display changes were made in shared packages. |
| Localization | 2 | All user-visible copy is routed through the declared English locale. |
| UX & design | 2 | Original field-guide identity, animal seals and river board; responsive/offline behavior and interactive tutorial verified. |
| Product separation | 2 | Congo has its own PWA, Worker, Durable Object, D1 and storage namespace. |
| Reliability | 2 | Browser scenarios cover local persistence and online reconnect; Melon restart and copied-state restore are the remaining release checks. |
| Maintainability | 2 | Product instructions, plan, README, local scripts and isolated deployment configuration are present. |
| Handoff readiness | 2 | Feature evidence, checklist, progress log and exact next release gate are recorded. |

**Verdict:** Accept the Congo product and online-service increment locally. Keep the overall feature in progress until exact-SHA CI and Melon staging/recovery checks pass; public promotion and directory publication require DNS/TLS.

## Congo Melon release checkpoint — 2026-11-25

| Category | Score | Notes |
| --- | ---: | --- |
| Correctness | 2 | Built tutorial, bots and two-seat server play passed against the staged production build. |
| Rules fidelity | 2 | Room moves are validated by the selected Congo Variant, including the Monkey route syntax covered by Worker tests. |
| Verification | 2 | Exact runtime SHA passed CI; Melon browser smoke 5/5, offline PWA 1/1, restart recovery and copied-state restore passed. |
| Scope discipline | 2 | The test-only follow-up waits for socket readiness; no runtime behavior changed after the pinned stage build. |
| Localization | 2 | English copy remains complete through the declared locale. |
| UX & design | 2 | Responsive tutorial, animal board and offline PWA verified on the staged build. |
| Product separation | 2 | Congo remains on its isolated Worker, DO, D1 and stage directory. |
| Reliability | 2 | A room continued after restart and after state was copied to an independent restore container. |
| Maintainability | 2 | Exact SHA, CI run, stage path/port, verification and DNS blocker are recorded across handoff artifacts. |
| Handoff readiness | 2 | Congo's public gate is isolated; Jeson Mor is the next active Wave 1 product. |

**Verdict:** Accept the Congo Melon staging checkpoint. Keep `congo-001` blocked only at public DNS/TLS, HTTPS/WebSocket smoke and directory publication because `congo.beanroti.com` has no DNS answer. The stage remains running.
