# Ko Shogi (廣象棋) — product plan

Ko Shogi is a historical two-player reconstruction. The evidence does not support calling any edition the most popular. V1 is named **Ko Shogi, reconstructed rules**, based on Ogyū Sorai’s 1770 *Kōshōgifu* and Bun’yū’s 1773 *Kōshōgifu Gukai*, with the digital choices in [`packages/ko-shogi/RULES.md`](../../../packages/ko-shogi/RULES.md).

## Rules and rights gate

The source transcription and complete playable movement chart are now in [`research_notes/Ko Shogi rules adoption rights/transcription.md`](research_notes/Ko%20Shogi%20rules%20adoption%20rights/transcription.md) and `packages/ko-shogi/RULES.md`. The formation has 90 pieces per side and seven occupied ranks on a 19×19 intersection board. The base and promoted movement profiles are listed individually. The catalog’s 53-versus-65 figures are reconciled as 65 piece forms (34 starting + 31 promoted) and 53 unique movement profiles after removing 12 duplicate profiles; the catalogs do not explain their counting method.

The rules-content rights gate is clear for the two original books: Sorai died in 1728 and Bun’yū in 1763, both before Japan’s general 70-year author term expired. Tōhoku/NIJL/Waseda scan conditions remain separate. No archive scan, modern prose, or diagram is reused. The product’s own art, interface, tutorial text, and notation will be original.

The product follows the detailed English profile where an old text is incomplete or the surviving readings differ. It explicitly labels choices for Black’s first move, move-before-shot, Banner-and-Drum role substitution, five-intersection area, Governor inclusion, net immobilization, promotion timing, no-move loss, and repeated play. The scan and differences are recorded in the research notes. Public-facing wording must say “reconstructed rules,” not imply an uncontested historical standard or popularity winner.

## Product requirements

- Independent product under `apps/ko-shogi/` and `packages/ko-shogi/`; no Ko-specific identity or content in shared packages or other games.
- English v1, with all visible strings in locale keys and the locale completeness checks enabled.
- 19×19 responsive intersection board, 90-piece opening, original rank glyphs, route chooser for compound moves and post-move shots, local saves, and pass-and-play.
- Six deterministic bounded bots for both colors, implemented on `@chaturanga/ai-core`; engine legality remains authoritative.
- Interactive tutorial that teaches the setup, ordinary moves, shots, multi-leg turns, promotions, suppression/burn/net effects, objective, repetition, and the reconstruction’s digital conventions. Exercises use the rules engine.
- Installable offline PWA with its own site setting, manifest, service worker and fonts/assets. Public domain remains unset until DNS/TLS is verified.
- Server-authoritative private two-player rooms, no chat, isolated Worker and persistent storage, server validation through the Ko Shogi Variant, reconnect/restart/copied-state recovery.
- Melon stage and verification through `ssh melon`. Keep Cloudflare as fallback only if a documented Melon limitation prevents delivery. Do not add Caddy routing or the app-directory entry until DNS, HTTPS, TLS and WSS pass.

## Work sequence

1. **Rules contract and provenance** — complete. Use this document and `packages/ko-shogi/RULES.md` as the frozen v1 profile; change it only when a test exposes a contradiction or a newly verified source passage requires a documented decision.
2. **Pure rules package** — complete. `packages/ko-shogi` implements the 19×19 setup/FEN, all declared piece profiles, routes/shots, promotions/effects, objectives, repetition, undo/replay and `Variant` conformance. The focused fixtures and full workspace verification pass; downstream product checks remain.
3. **Bots** — complete locally. `packages/ko-shogi-ai` supplies six deterministic levels for both roles on `@chaturanga/ai-core`. A bounded root sample keeps the opening responsive while evaluating only fully legal actions; focused tests cover replay-safe search, both colors and all configured levels. The AI is deliberately one-ply because of Ko Shogi's exceptionally wide action space; a strength ladder remains a release check.
4. **Product shell and identity** — implemented as the original Field Atlas product. Keep product identity separate from historical rules. Do not use association branding or trace archive/Commons diagrams.
5. **PWA and tutorial** — implemented: English locale, local/pass-and-play/bot, 11 interactive lessons across five units, saves, install/offline operation and a horizontally pannable 19×19 board on narrow phones. Lesson exercises use legal engine candidates; all 18 selected-rule/digital-convention coverage IDs are assigned.
6. **Private online play** — implemented in an isolated Worker with private invite rooms, server-authoritative Ko Shogi validation and persistent Durable Object state; no chat. Browser smoke covers two seats and a synchronized legal move. Melon restart and copied-state recovery remain release checks.
7. **Release checks** — local full verification, product build and browser smoke pass. Exact-SHA CI and Melon stage browser/PWA/recovery checks are next, followed by public DNS/TLS/HTTPS/WSS. No product route/catalog entry until the public gate passes.

## Melon allocation

- Product Worker development port: `8794`.
- Private stage loopback port: `19926`.
- Keep `KO_SHOGI_SITE_URL` empty for local/private stage builds. Do not publish or reserve a hostname until the product and DNS checks are ready.
- Stage directory and pinned commit will be written here and in `session-handoff.md` after deployment.

## Current state — 2026-11-27

- Primary-source setup and movement pages were reviewed; the source-derived setup has been normalized into coordinates and sums to 90 pieces per side. The product transcription and rights boundary are recorded with the rules gate.
- The pure Variant and focused fixtures are implemented in `packages/ko-shogi`; six bounded bots use `packages/ko-shogi-ai`. The original Field Atlas PWA now includes local/pass-and-play/bot play, game history/replay, an interactive rules tutorial, a 65-form piece atlas, offline installation, responsive board input, private online rooms, and an isolated authoritative Worker.
- Local web tests pass 7/7, Worker tests 3/3, protocol tests 10/10, and Ko engine/bot tests 90/90 and 4/4. The browser smoke passed tutorials and a compound-route exercise, all atlas forms, bot play, offline reload, private two-seat move sync, and a 390px phone layout without page errors. `npm run build:ko-shogi` passes for the PWA and Worker dry-run; the PWA reports a non-blocking 553 kB entry-chunk warning.
- Full workspace `npm run verify` passes with Node 22.23.1 on `PATH` and loopback enabled. Exact-SHA CI run `45909245372` passed for `c13b307e6f2757db6b0b92466c1abc37c993e0c3`.
- Melon runs the exact commit privately at `/home/melon/chaturanga-release.ko-shogi.HWFahS`, port `19926`, container `chaturanga-stage-ko-shogi-19926`. The standalone app and Worker build on Melon; health passes, and homepage, manifest and service worker return HTTP 200. Ten built-stage browser checks and the production dependency audit pass. Ko web/Worker production dependency audit reports zero vulnerabilities; the full monorepo install reported five aggregate findings (four moderate, one high), which were not attributed to Ko production dependencies.
- A two-seat room synchronized a legal Black-first move, recovered both seats and history through container restart, and continued play. A stopped-state copy restored both identities/history in an isolated container, accepted and synchronized another legal move, then the copy and temporary container were removed. The original stage is healthy with its own isolated state; this Worker has no D1 migration.
- Melon's resolver returns no answer for `ko-shogi.beanroti.com`. Public TLS/HTTPS/WSS cannot be tested without DNS. `ko-shogi-001` is complete through implementation, CI and private deployment, and blocked only at public promotion. Keep `KO_SHOGI_SITE_URL` unset; do not change Caddy or the app directory until the public route can pass DNS, TLS, HTTPS and WSS checks.
