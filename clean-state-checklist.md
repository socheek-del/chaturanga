# Clean State Checklist

- [x] Suffragetto's selected rules, rights boundary, 17×17 archival coordinate map, pure Variant, bots, seven interactive lessons, PWA and isolated online Worker are recorded in the product folders.
- [x] Suffragetto rules/conformance tests passed 36/36; bot tests 17/17; web tests 34/34; Worker tests 9/9; `npm run build:suffragetto` and full workspace `npm run verify` passed with `NODE_OPTIONS=--no-experimental-webstorage` under Node 25.9.
- [x] Exact commit `0e46a1ee3bf5fd3f9075e025f387a54a01638123` is on main; exact-SHA GitHub CI run `45638729555` passed verification and the build matrix.
- [x] Melon staged the exact SHA at port 19916 in `/home/melon/chaturanga-release.suffragetto.Bz3TYJ`; its isolated D1 migration, health endpoint and homepage passed.
- [x] Built-stage browser smoke passed 5/5 and installed offline PWA smoke 1/1. A two-seat room recovered after container restart and continued; a stopped-state copy recovered a room and accepted a legal move. The temporary restore container/copy were removed and the primary stage is healthy.
- [x] `suffragetto.beanroti.com` has no DNS answer. Public HTTPS/WSS smoke, Caddy promotion and directory publication are blocked; no public route or catalog entry changed. Keep the verified Melon stage running.
- [x] Begin `dameo-001` as the next listed ready Wave 1 product; start with source, edition/popularity and rights research.

### Dameo

- [x] Compare primary rules, editions/popularity evidence and rights; report and source notes are saved under `apps/dameo/docs/`.
- [x] Select canonical 8×8 Dameo with 18 men per side as the best-documented form; state that available evidence does not prove a popularity winner.
- [x] Pin movement, compulsory maximum captures, delayed capture removal, Coup Turc, promotion, no-move loss and explicit draw conventions in the product plan and `packages/dameo/RULES.md`.
- [x] Encode and test the exact 8×8 setup and coordinate convention: all 64 squares, both 18-man trapezoids, mirroring, empty center and invalid coordinates; 5 tests, package typecheck and lint passed.
- [x] Implement the pure Dameo Variant. `npm test -w packages/dameo` passed 36/36 including shared conformance and five seeded 120-ply games; package typecheck and ESLint passed. Fixtures cover line shifts, maximum capture, delayed-removal blocking, route revisits, promotion, endings, replay/undo and attack maps. No Fairy-Stockfish oracle is available.
- [x] Add six bounded Dameo bot levels. AI tests passed 16/16 across both colors, forced elimination, compulsory maximum capture, full-route IDs, reproducible choice, fixed budgets and live-game restoration; package typecheck and ESLint passed. Full workspace `npm run verify` passed with loopback enabled for Worker suites.
- [x] Record Dameo's original route-atlas design brief in `apps/dameo/docs/design.md` before UI work.
- [x] Build nine interactive lessons covering the selected Dameo rules and digital conventions. Web lesson/locale tests passed 45/45; the production PWA built; typecheck and ESLint passed; full workspace `npm run verify` passed; headless browser smoke opened the tutorial, answered a quiz and found no overflow at 390px.
- [x] Correct the Dameo nested `@vitejs/plugin-react@6.3.0` lock entry; `npm ci --ignore-scripts --dry-run --offline` and exact-SHA CI run 45658960096 pass.
- [x] Add Dameo pass-and-play, six worker-based bot strengths for both sides, replay-saved local sessions and mutual draw agreement. Focused game-shell tests 94/94, web tests 45/45, typecheck, lint, production PWA build, and Chromium bot/move/reload/draw/mobile smoke pass.
- [x] Dameo production-build offline smoke passed in Chromium: cached tutorial and bot worker both play while disconnected; no page errors.
- [x] Add the isolated Dameo Worker, Durable Objects, product-local D1 archive, private rooms, quick match and server-authoritative draw offers. Worker tests passed 9/9, including illegal/wrong-turn rejection, same-seat reconnect, Durable Object eviction, quick match, draw agreement, D1 archive and chat rejection.
- [x] Two-browser Dameo online smoke created and joined a room, synchronized a legal move, accepted an agreed draw, and found no 390px overflow or browser errors. The latest production PWA also passed offline tutorial and bot play.
- [x] Full `NODE_OPTIONS=--no-experimental-webstorage npm run verify` passed with loopback enabled: ESLint, all workspace typechecks and all tests.
- [x] Commit `6987d5b6a6e67938d27d55d1189c4ce43268bdd3` is pushed to main; exact-SHA CI run `45668832352` passed.
- [x] Stage the pinned SHA on Melon at port 19917 in `/home/melon/chaturanga-release.dameo.dTpb5d`; isolated D1 migration, health and homepage passed.
- [x] Built-stage browser smoke passed tutorial, bot-as-White/Black, private room, legal move sync, reload reconnect, draw agreement and mobile/error checks. Offline PWA smoke passed.
- [x] Live room survived container restart; a stopped-state copy restored both seats and synchronized another legal move. Temporary restore state/container were removed; primary stage health passed.
- [x] `dameo.beanroti.com` has no DNS answer and trademark clearance remains open. Public HTTPS/WSS, Caddy and catalog promotion remain blocked; no public route changed. Keep the verified stage running.
- [x] Dameo release state and evidence are recorded in feature list, progress, handoff, product plan, quality notes and this checklist.
- [x] Move the single active roadmap feature to `duell-001` after Gess's rights blocker was confirmed.

### Gess

- [x] Complete primary-rule, variant/adoption and rights research; synthesis and evidence notes are saved under `apps/gess/docs/`.
- [x] Record the 1994 Archimedeans rules as the best-documented candidate without claiming it is most popular; list setup transcription, center-only footprint, no-move and repetition gaps.
- [x] Mark Gess blocked before engine work because no applicable digital-adaptation license or written permission was found. The repost permission covers text republication only; no contact was sent.
- [x] Advance the active feature to `duell-001`, the next Wave 1 entry. Start with rules, edition/popularity and rights research.

### Duell

- [x] Identify and research the roadmap's 1976 Lakeside 8×9 edition; distinguish the later 9×9 Tactix reissue and avoid an unsupported popularity claim.
- [x] Record primary-source movement/capture/win rules and unresolved start-side, die-orientation, key-square timing and draw questions.
- [x] Mark Duell blocked before implementation: no digital-adaptation permission/license was found and present-day ownership is unresolved; no contact was sent.
- [x] Advance the single active roadmap feature to `ploy-001`, the next Wave 1 row; start with rules, variants/adoption and rights research.

### Ploy

- [x] Research original 1970 3M two-player rules and documented four-player/partnership modes; do not claim a popularity winner.
- [x] Record 9×9-point setup, directional pieces, landing captures and win conditions; flag rotation, seat mapping and end-condition gaps.
- [x] Mark Ploy blocked before implementation because current ownership and a digital adaptation permission/license are unverified. Hasbro policy does not establish ownership; no contact was sent.
- [x] Advance the active feature to `hexagonal-chess-001`, Gliński's 91-cell game, starting with rules, variant/adoption and rights research.

### Gliński Hexagonal chess

- [x] Research the 91-cell Gliński edition, distinguish McCooey, and qualify historical adoption claims.
- [x] Record pawn, en-passant and stalemate evidence plus setup/draw conflicts that require the original rulebook.
- [x] Mark implementation blocked: no digital adaptation license or current rights holder was verified; separate name clearance is required; no contact was sent.
- [x] Advance the single active feature to Copenhagen 11×11 `hnefatafl-001`, starting with rules, variant/adoption and rights research.

### Copenhagen Hnefatafl

- [x] Research tournament variant and adoption; select Copenhagen 11×11 without asserting a global popularity winner.
- [x] Record asymmetric sides, king escape/capture, shield walls, edge forts and source gaps for setup/draw adjudication.
- [x] Mark blocked before implementation: all-rights-reserved primary rule source, no digital license; repo requires applicable clearance. No contact was sent.
- [x] Advance the active feature to `rollerball-001`, beginning with rules, variant/adoption and rights research.

### Rollerball chess

- [x] Identify the roadmap target as Cazaux's 40-square two-ring chess variant; distinguish the unrelated Invicta game and date discrepancy.
- [x] Record location-based movement/rebounds, pawn restrictions, promotion and endings; flag inaccessible original source and setup/King-race ambiguity.
- [x] Mark blocked before implementation because no digital adaptation license/permission was found; name review is separate.
- [x] Advance active work to `kruzno-001`, beginning by reconciling the catalog and linked article before rules research.

### Kruzno

- [x] Distinguish Palko's 2005 base game from separate 12-piece Kruzno Checkers; select Kruzno Checkers as the roadmap's linked hex-checkers candidate without a popularity claim.
- [x] Record missing setup/capture details and limited adoption evidence.
- [x] Mark blocked before implementation because no adaptation license/current rights chain was verified; no contact was sent.
- [x] Advance the active feature to Rithmomachia and start rules/adoption/rights research.

- [x] Fortress's exact code revision passed GitHub `npm run verify` and all workspace builds. Crazyhouse startup `npm run verify` also passed locally under Node 22.23.1 when run outside the sandbox so Worker tests could bind loopback ports; `./init.sh` could not sync uncached npm@11 in offline mode.
- [x] Fortress rules tests passed 23/23, bots 4/4, tutorial 2/2 and Worker room/schema checks 4/4; local browser and PWA checks passed before staging.
- [x] The CI-only conformance allowance preserves all five 120-ply seeded games and every attack assertion; Fortress rules tests and both package typechecks passed locally.
- [x] Exact commit `fc5577d3a53e6c90a572457bb24750b3b0e34e52` is staged on Melon at port 19911 in `~/chaturanga-release.fortress.Gz3JGZ`; the migration and health endpoint passed.
- [x] Built-PWA browser checks passed for the complete tutorial, phone layout, local save/reload/takeback, all four bot seats, offline reload, four-seat invite, server-side illegal-move rejection, reconnect, missing room and room fullness.
- [x] The active room recovered after container restart and continued; a copied stopped-state restore recovered all four seats and continued play. Temporary restore resources were removed, and the original stage is healthy.
- [x] Fortress progress, CI evidence, stage pin and release blocker are recorded in `claude-progress.md`, `feature_list.json`, `session-handoff.md` and `apps/fortress/docs/PLAN.md`.
- [x] Every Fortress user-visible string uses its declared English locale; original prose and artwork are used.
- [x] `fortress.beanroti.com` has no DNS address. Public HTTPS/WebSocket smoke, Caddy promotion and catalog publication are recorded as blocked; no public route was changed.
- [x] No secrets, `.dev.vars`, or local Wrangler state were committed.
- [x] Record the Fortress DNS release gate and begin `crazyhouse-001` as the next roadmap product.
- [x] Commit and push Crazyhouse plan `a6e6602` and engine `13f0baa`; exact engine SHA passed full GitHub CI run 45560562799.
- [x] Crazyhouse engine typecheck/lint and 30 tests passed; bounded bot typecheck/lint and 5 tests passed for both colors.
- [x] Commit and push the Crazyhouse bot increment `941f474`; GitHub CI run 45561775842 passed.
- [ ] Keep the Melon Fortress stage running until public DNS, TLS and smoke are available.
- [x] Crazyhouse PWA and Worker have product-local configuration, migration, README, local dev/build scripts and isolated online storage; no secrets or generated build output are staged.
- [x] Crazyhouse rules, AI, 14 lessons, all English UI strings, private rooms, quick match, server-side drops, no-chat policy and local reconnect are covered by the local full verification and browser suites.
- [x] Crazyhouse online lobby was reviewed at desktop and 390px; time-control labels are complete and the screen has no horizontal overflow.
- [x] Commit `0b160b035447083d390b999aced2d216688abefb` is pushed to main and exact-SHA GitHub CI run `45569846694` passed.
- [x] Stage Crazyhouse on Melon at port 19912 in `~/chaturanga-release.crazyhouse.KzM8xm`; isolated D1 migration and health endpoint passed.
- [x] Built-PWA smoke passed for tutorial, bot as Black, offline reload, invite room, capture-to-pocket, legal `P@e4`, reconnect and no-chat behavior.
- [x] Active room recovered through container restart and continued. Copied stopped-state restore in a separate container recovered both seats and accepted capture/drop play. Removed temporary restore resources; primary stage is healthy.
- [x] Crazyhouse state, CI evidence, stage pin and DNS blocker are recorded in `feature_list.json`, `claude-progress.md`, `session-handoff.md`, the product plan and this checklist.
- [x] `crazyhouse.beanroti.com` has no DNS answer; public HTTPS/WebSocket smoke, Caddy promotion and catalog publication remain blocked, with no public route changed.
- [ ] Keep the Crazyhouse Melon stage running. Resume public route and catalog work after DNS/TLS and HTTPS/WebSocket smoke are available; continue with the next ready roadmap product in the meantime.
- [x] Congo rules selection, independent-content boundary, product plan and engine contract are recorded next to the product.
- [x] `@chaturanga/congo` typecheck and 31 rules/conformance tests passed; full repository `npm run verify` passed. Package lock updated.
- [x] Implement the standalone Congo PWA, eight-step interactive tutorial, six bot levels, local save/reload/takeback, and Congo-only server-authoritative rooms/quick match. Web 35/35, Worker 9/9, protocol 6/6, Playwright 5/5 and offline PWA 1/1 passed.
- [x] `npm run build:congo` and full `npm run verify` passed under Node 22.23.1.
- [x] Commit runtime SHA `77cfac9949333c2f075e84c0f2ec185601366e3d`; exact-SHA GitHub CI run `45590944839` passed its verify/build matrix.
- [x] Stage Congo on Melon at port 19913 in `/home/melon/chaturanga-release.congo.yFqc4U`; its D1 migration, health and homepage passed.
- [x] Built-stage browser smoke passed tutorial/bot/mobile/invite/move-sync/reconnect 5/5 and installed offline PWA 1/1. Online scenario waits for both WebSockets to open before moves.
- [x] Active room recovered both seats through container restart and continued; copied stopped-state restore recovered both seats and continued online play. Removed temporary restore resources and left primary stage healthy.
- [x] `congo.beanroti.com` has no DNS answer. Public HTTPS/WSS, Caddy promotion and catalog publication are blocked; no public route or catalog entry was changed.
- [x] Update feature evidence, plan, progress, rubric, quality and handoff state; keep the verified Congo stage running.
- [x] After the patched Congo runtime passed exact-SHA CI, begin Jeson Mor edition and rights research before implementation. Research and rights notes are saved under `apps/jesonmor/docs/`.
- [x] A post-stage npm audit found Hono 4.13.7 and Zod 4.6.4 advisories in production dependencies. Updated the shared lock to Hono 4.13.22/Zod 4.6.7; production audit is clean. No force update was used.
- [x] Full workspace verification, Congo production build, staged browser E2E 5/5 and offline PWA 1/1 passed after the compatible dependency updates.
- [x] Commit the patched lock as `fdf1325efcd7b3d63c3ac1eb20c86fe6fa28f176`; exact-SHA GitHub CI run `45599461942` passed, then the revision was rebuilt/re-staged on Melon at port 19914 in `/home/melon/chaturanga-release.congo.350fpC`.
- [x] Patched Melon stage applied its isolated migration and returned healthy; production dependency audit reported zero findings; staged browser checks passed 5/5 and installed offline PWA passed 1/1.
- [x] Melon DNS lookup returned no IPv4 or IPv6 address for `congo.beanroti.com`; public HTTPS/WSS, Caddy promotion and directory publication remain blocked, with no public route changed. Keep the patched stage running and continue with Jeson Mor.
- [x] Congo bot package typecheck/lint and 3 tests passed for both colors, terminal Lion capture, Monkey route and river positions.
- [x] Jeson Mor source selection, rights boundary, product plan and rules contract are documented under `apps/jesonmor/` and `packages/jesonmor/`.
- [x] `@chaturanga/jesonmor` passes 28 focused/conformance checks; `@chaturanga/jesonmor-ai` passes 15 checks covering all six levels for both colors, capture-all and center wins, deterministic seeds and node limits.
- [x] Full repository `npm run verify` passed under Node 22.23.1 after adding the Jeson Mor rules and bot packages.
- [x] Build the Jeson Mor independent English PWA with original art, first-player selection, six bot levels, pass-and-play, local persistence, and a seven-lesson interactive tutorial covering every selected rule. Web tests 29/29, local browser E2E 5/5 and installed offline PWA smoke 1/1 passed.
- [x] Add the isolated online Worker and D1; Worker tests passed 9/9 for legal move validation, reconnect recovery, no-chat behavior and finished-game storage.
- [x] Full repository verification passed with `NODE_OPTIONS=--no-experimental-webstorage` under the shell's Node 25. `npm run build:jesonmor` passed (Vite PWA and Wrangler Worker dry-run).
- [x] Commit `3a31bf29739ca08024abced86014a35e31d4ea56` to main; exact-SHA GitHub CI run `45612186318` passed its full verification and build matrix.
- [x] Stage Jeson Mor on Melon at port 19915 in `/home/melon/chaturanga-release.jesonmor.s1Jcyr`; the isolated migration, health endpoint and homepage passed.
- [x] Built-stage browser smoke passed 6/6; the active two-seat room continued after container restart and after a copied-state restore. Temporary restore resources were removed, and the primary stage is healthy.
- [x] `jesonmor.beanroti.com` has no A or AAAA record. Public HTTPS/WSS smoke, Caddy promotion and app-directory publication are blocked; no public route or catalog entry changed. Keep the Melon stage running.
- [x] Complete Suffragetto rules, editions and rights research; report and source notes are in `apps/suffragetto/docs/`.
- [x] Record the selected second-edition rules, source/date limits and authored-content boundary in `apps/suffragetto/docs/PLAN.md`, `apps/suffragetto/AGENTS.md` and `packages/suffragetto/RULES.md`.
- [x] Encode and verify the 17×17 board zone and S/P setup coordinates from the archival board; map and
  fixture are in `apps/suffragetto/docs/board-coordinates.md` and `packages/suffragetto/src/layout.ts`.

### Chu Shogi

- [x] Record the selected Chu Shogi Renmei 2019 profile and 2004 Lion clarifications, adoption caveat, rights boundary and source-linked plan under `apps/chu-shogi/docs/`.
- [x] Implement the 12×12 setup, all selected movement and promotion rules, Lion restrictions, full-turn routes, endgames, repetition, replay/FEN and Variant conformance; rules tests 40/40.
- [x] Push the rules checkpoint `09a3db77e63b12f2bee7a28850b35443d52f6c0e`; exact-SHA CI run `45726420396` passed full workspace verification and configured builds.
- [x] Add six bounded ai-core bots. AI tests 5/5 exercise all six levels as both colors, rules and AI package typechecks, and focused ESLint passed. The first L2/L1 sample finished one checkmate and one 100-ply draw (1.5/2).
- [x] Push the verified bot package as `57968bf536a0ac29b4677fd90ace1c49cceb1f2d`; exact-SHA CI run `45728808992` passed.
- [x] Measure all five remaining adjacent bot pairs. Two-game seeded 100-ply scores: L3/L2 1/2, L4/L3 1/2, L5/L4 1.5/2 and L6/L5 1.5/2; no higher level lost. Samples are too small for stable ratings.
- [x] Create the original Chu Shogi design and piece marks in `apps/chu-shogi/docs/design.md` and the local web app; keep name review separate from descriptive game naming.
- [x] Build the standalone English PWA with pass-and-play, bot worker, local saves and all six bot levels. Tests and local browser smoke passed; verify installed offline reload on Melon.
- [x] Add twelve interactive rules tutorials, validated through the authoritative engine, and test English locale completeness.
- [x] Add the isolated server-authoritative private Worker with no chat, own D1/DO storage, reconnect and archived finished games; Worker tests pass 10/10.
- [x] Verify two-browser invite/join, move synchronization, reload reconnect, complete Lion route selection, and built PWA offline atlas (29/29).
- [x] Pass full `NODE_OPTIONS=--no-experimental-webstorage npm run verify` across all workspaces.
- [ ] Measure the last two adjacent bot pairs and tune any clear regressions.
- [x] Push online increment `3475a21d6c3723e57be4e8c7daaa6d5eecc71f1b`; exact-SHA CI run `45736686982` passed.
- [x] Stage the pinned code on Melon port 19919 in `/home/melon/chaturanga-release.chu-shogi.NJyO3x`; isolated migration, health and homepage passed.
- [x] Built-stage Chromium passed the tutorial answer, bot reply, private two-seat room, synchronized moves, draw agreement/archive, 390px offline PWA reload and no-overflow check.
- [x] A live room recovered both seats/history through container restart and continued; a stopped-state copy restored both seats/two plies and synchronized another move. Removed temporary restore resources; primary stage healthy.
- [x] `chu-shogi.beanroti.com` has no DNS address. Public HTTPS/WSS, Caddy promotion and catalog publication are blocked pending DNS/TLS and owner review of product name/design; no public route or catalog entry changed. No Cloudflare limitation was found.
- [x] Record the verified release state and remaining public gate in feature list, progress, handoff, quality notes and product plan; inspect `git status` before ending.
- [x] Complete Ko Shogi rules/edition/adoption/rights research and save the source-linked report/plan; block implementation on the unverified full movement chart and unresolved project rights gate. Arimaa is the next roadmap row.

### Ko Shogi

- [x] Save the source-linked report and notes under `apps/ko-shogi/docs/`; record a clearly labeled 1770/1773 historical reconstruction candidate and make no popularity claim.
- [x] Record the 19×19/90-piece/34-starting-type modern profile as provisional. The 53/65 move-count conflict, complete setup chart and several special rules still need source review before a rules contract.
- [x] Keep Ko Shogi blocked before implementation: modern reconstruction author/license and NIJL item terms are unresolved; Waseda scan reuse requires advance application. Do not reuse modern prose/images or scans. No contact was made.
- [x] Complete Arimaa rules, adoption and licensing research; select official standard two-player rules without claiming a popularity winner. Save the report, notes, product plan and source-linked rules contract under `apps/arimaa/` and `packages/arimaa/`.
- [x] Record the Arimaa Public License v2025.02 Section 3 conditions. Keep public release gated on confirming a free/no-user-or-ad-revenue product and owner authorization for the required Discord announcement; no contact or announcement has been made.
- [x] Pass baseline `NODE_OPTIONS=--no-experimental-webstorage ./init.sh` and adjacent 8×8 browser smoke (5/5; optional installed-offline scenario skipped).
- [x] Implement the pure Arimaa Variant with chosen setup, deterministic FEN, four-step turns, push/pull, freezing/traps, result order and repetition; 22/22 focused tests, package/rules-core typechecks and lint pass.
- [x] Add six seeded bounded bots; tests cover legal setup/full-turn choices, determinism, terminal scoring and state restoration.
- [x] Run full repository `NODE_OPTIONS=--no-experimental-webstorage npm run verify` with loopback permission after the engine and bot changes; lint, typechecks and all workspace tests pass.
- [x] Write the original “Field Manual” product design proposal; approval remains open. Keep original art, piece marks and tutorial prose.
- [x] Add a tested Arimaa turn-draft API exposing bounded atomic next actions, paired push/pull and preview state; 25/25 rules tests, typecheck and lint pass.
- [x] Build the independent English PWA with saved bot/pass-and-play games, six seeded Worker bots, self-hosted type, install icons and product-local site URL; web build, typecheck and ESLint pass.
- [x] Add 15 interactive lessons; web/locale checks pass 5/5. All lesson fixtures/solutions pass the engine, and production Chromium checked setup interaction, 390px/desktop overflow, service-worker control and offline lesson loading.
- [x] Run full `NODE_OPTIONS=--no-experimental-webstorage npm run verify` after the PWA increment; repository lint, all workspace typechecks and all tests pass.
- [x] Add the isolated Arimaa Worker, server-authoritative invite rooms, quick-match handler and product-local archive. Worker integration tests pass 6/6 for room/setup/turn validation, reconnect/eviction, quick-match pairing, no chat and finished-game archive.
- [x] Integrate the online lobby and Arimaa-specific setup/full-turn UI. Worker tests pass 6/6; web tests pass 6/6, including the mutable-board regression test.
- [x] Rerun `NODE_OPTIONS=--no-experimental-webstorage npm run verify`; push `bc212e2232b7a975614053314a99b153c9f9c8a1` directly to main; exact-SHA CI run 45761054022 passed.
- [x] Privately stage that SHA on Melon port 19920 in `/home/melon/chaturanga-release.arimaa.gcnx9k`; D1 migration, health and homepage passed.
- [x] Built-stage Chromium passed interactive tutorial, all 15 lessons offline, service-worker control, bot reply and 390px layout; the two-seat room synchronized 32 setup placements and legal turns with zero browser errors.
- [x] The room recovered across container restart; a stopped-state copy recovered both seats and move history and accepted/synchronized another legal turn. Removed the temporary copy/container and confirmed the primary stage healthy.
- [x] Keep Arimaa public promotion blocked pending owner confirmation of the no-user/no-ad-revenue condition, authorization for the required Discord announcement, and public DNS/TLS/HTTPS/WSS checks. No public route/catalog changes or external contact were made.
- [x] Add `ko-shogi-001` as a blocked feature and preserve Arimaa as the next ready roadmap row.

### Hive and Four-handed chess

- [x] Review Gen42's official Hive rules, publisher context and public terms. Save the report and notes; keep `hive-001` blocked because no general digital-adaptation license was found. No publisher contact was made.
- [x] Select a modern, tournament-documented FFA profile for Four-handed chess without claiming a popularity winner; save source/adoption/rights notes and an explicit original rules contract.
- [x] Add `hive-001` as blocked and `fourchess-001` as the active next ready feature without reordering unrelated entries in `feature_list.json`.
- [x] Run full `NODE_OPTIONS=--no-experimental-webstorage npm run verify` with loopback access; lint, all workspace typechecks and tests passed. `./init.sh` dependency refresh remains blocked by registry DNS (`ENOTFOUND`); this shell lacks pinned Node 22.23.1/nvm and used installed Node 25.9.
- [x] Implement `packages/fourchess`: verify the 160-cell board/start fixture, four-seat move generation, promotion, castling/en passant, elimination/scoring, replay/undo and shared conformance; focused rules tests pass 24/24.
- [x] Add three bounded deterministic bots; focused AI tests pass 4/4. Add shared four-seat colors and point-scored result serialization with regression tests.
- [x] Build the English Fourfold Chess PWA, local game modes, three bot seats, offline assets and 11-step interactive tutorial; tutorial content test and production build pass.
- [x] Add authoritative private four-seat rooms with isolated archive and no chat; Worker tests pass 3/3. Local Playwright browser smoke passed 4/4 scenarios.
- [x] Commit and push `1e067b9d00c766f7d12824b0a520e51dd12baf79`; exact-SHA CI run `45780002660` passed workspace verification and the Four-handed Chess build.
- [x] Stage that SHA on Melon port 19921 in `/home/melon/chaturanga-release.fourchess.UGrfdi`; migration, health and homepage passed. Built-stage browser smoke passed 4/4 after adding move-turn synchronization waits.
- [x] Four-seat room identities and four-ply history recovered after container restart. A stopped-state copy restored the room in a separate container and synchronized a fifth legal move; the active recovered copy is the standard stage and the original stopped container is retained for rollback.
- [x] Checked `fourchess.beanroti.com`: DNS has no answer. Public HTTPS/WSS, Caddy promotion and directory publication are blocked; no Caddy/catalog change was made.
- [x] Update feature evidence, progress, handoff, quality snapshot, product plan and this checklist. Keep the verified Melon stage running.
- [x] Begin Chaturaji source/adoption/rights review. The dice reconstruction is selected as a historical target, not a proven popularity winner; settle the explicit digital rules contract before implementing its engine.

### Chaturaji

- [x] Complete source-linked rules/adoption/rights review and pin the Al-Biruni-based reconstruction in `packages/chaturaji/RULES.md`; label uncertain procedures as digital choices.
- [x] Implement `packages/chaturaji` as a pure four-seat Variant with seeded initial dice, recorded roll/pass actions, movement, capture pools, scoring, promotion, Boat triumph, *sinhasana*, terminal standings, replay and undo.
- [x] Focused Chaturaji tests pass 16/16, including shared Variant conformance; rules-core tests pass 46/46; protocol tests pass 7/7.
- [x] Add six bounded deterministic bots and test legal decisions for all seats (bot tests 4/4).
- [x] Build the independent English PWA, original identity, local replay, four-seat play and 13-step interactive tutorial (tutorial tests 2/2).
- [x] Add authoritative private four-seat rooms and isolated D1 storage; room-state tests pass 3/3.
- [x] Browser smoke passes 4/4 for tutorial, bot, local save/mobile layout, room rotation/reconnect and invalid rooms; offline PWA/installability passes 2/2, including the cached bot worker. Desktop/mobile visual review reports zero page errors.
- [x] Run `NODE_OPTIONS=--no-experimental-webstorage ./init.sh` and final `build:chaturaji`; full verification and build pass. Local Node is 25.9 because nvm is unavailable; CI uses pinned Node 22.23.1.
- [x] Commit Chaturaji directly to main as `cf328621aab6bcdd2575c7abd0be147cc8f8546a`, push, and verify exact-SHA CI run `45800394175`.
- [x] Stage the verified SHA on Melon port 19922; `DB/0001_games.sql` applied. Built-stage browser smoke 6/6 and offline PWA smoke 2/2 pass.
- [x] Verify four saved seats and room history after container restart, then restore a copied state in an isolated container and synchronize another action. Remove the temporary restore container/copy and leave the primary stage healthy.
- [x] Check Chaturaji DNS from Melon: no answer. Do not change Caddy or the directory before public DNS/TLS/HTTPS/WSS smoke passes.

### Family publication state and Senterej setup

- [x] Confirm the production family smoke against every released site; all 7 pass and each links to the six other published products.
- [x] Add release state to the family registry and update production checks and legacy staged Vite configs to exclude destinations without live routes.
- [x] Run `NODE_OPTIONS=--no-experimental-webstorage npm run verify` with loopback access; lint, every workspace typecheck and test pass. The sandboxed pass failed only on Worker `listen EPERM` and is not verification evidence.
- [x] TypeScript/Vite production builds pass for all nine staged apps whose family-injection config changed.
- [x] Record that no live redeploy was needed: currently deployed family links already show the intended released set, with no user-visible delta.
- [x] Save source/adoption/rights reports and mark Djambi, Martian Chess, Apocalypse and Game of the Generals blocked before code. No external contact was sent.
- [x] Pin the clean-room historical Senterej profile and document `plat-023` as its actor-aware replay/retraction prerequisite.
- [x] Implement `plat-023` one capability slice at a time; rules-core, board-ui, game-shell, protocol and server-kit focused tests pass.
- [x] Add optional actor-aware Variant methods/helpers with `turn` defaults; rules-core tests 49/49, typecheck and lint pass.
- [x] Persist actors in local saves/review, protocol snapshots and server rooms; validate/replay actions and retractions by seat.
- [x] Run full `NODE_OPTIONS=--no-experimental-webstorage npm run verify` with loopback access; lint, all workspace typechecks and tests pass.
- [x] Move `plat-023` to passing and set `senterej-001` active. The generic platform package has no runtime route to deploy.

### Senterej (privately staged; public DNS gate)

- [x] Complete the historical profile and clean-room source/rights notes; no popularity claim is made.
- [x] Complete actor-aware platform prerequisite `plat-023`.
- [x] Implement the pure Variant with source-profiled movements, concurrent Werera actors, first-capture transition, automatic Ferz promotion, ending rules, FEN, undo and actor replay; focused tests 27/27, package typecheck and lint pass.
- [x] Add six seeded bounded bots (AI tests 3/3), an original independent English PWA, eight interactive lessons, saved bot/pass-and-play games, offline shell, and an isolated authoritative Worker with private concurrent Werera rooms and legal retractions (Worker tests 5/5).
- [x] Run the full workspace verify; Senterej web tests 40/40, browser E2E 4/4, offline PWA E2E 1/1, and production PWA/Worker build pass.
- [x] Commit/push the implementation; exact-SHA CI run 45846364938 passes at 64ec507cb5b8ad2325594024bc67c0d3a117b0b3.
- [x] Stage the pinned release on Melon port 19924; migration, health and homepage pass.
- [x] Built-stage browser smoke 4/4 and offline PWA smoke 1/1 pass.
- [x] Live two-seat room survives restart; copied-state recovery restores the same seats and history, then syncs another legal move. Temporary restore resources removed; primary stage healthy.
- [x] Check DNS on Melon: the configured hostname has no answer. HTTPS/WSS remain unavailable; keep public routing and the app directory unchanged.
