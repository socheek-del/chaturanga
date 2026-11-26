# Arimaa — implementation plan

Arimaa is the next ready game in `docs/CHESS-LIKE-ROADMAP.md`. Select the official standard two-player rules, not Fast Rules or a theme variant. Available evidence supports standard Arimaa as the canonical product selection but does not establish any variant as empirically most popular. The source-linked rules/adoption/licensing review is in `docs/reports/Arimaa rules adoption licensing.md` and the matching `research_notes/` folder.

## Product shape

```text
packages/arimaa/       @chaturanga/arimaa — pure Variant, setup and four-step turns
packages/arimaa-ai/    @chaturanga/arimaa-ai — six seeded, bounded bots for both roles
apps/arimaa/web/       independent English PWA, original art, local play, bots, tutorial and online UI
apps/arimaa/worker/    isolated server-kit Worker, private rooms and product-local archive
```

The rules contract in `packages/arimaa/RULES.md` selects the 8×8 board, free two-rank setups, four-step turns, push/pull, freezing, traps and official goal/elimination/immobilization/repetition endings. The engine and UI must model setup, intermediate step choices, atomic push/pull input, trap captures after each step, and the official overlapping-result priority.

## Rights and public-release gates

Arimaa Public License v2025.02, Section 3 is the planned route only while the public product remains free and has no user or advertising revenue. It requires a product announcement in the Arimaa Discord and visible license statements, a `www.arimaa.com` attribution/link, and an end-user rights boundary. Do not use official piece art; create original art and tutorial prose. The official code downloads have their own licenses and do not replace the game license.

No Discord announcement or rights-holder contact has been made. Development and Melon staging can proceed against original assets; public promotion stays gated until the owner confirms the no-revenue condition and authorizes the required announcement. Any ads, fees, sponsorship, or other revenue requires the commercial Section 2 agreement instead. Never send the announcement without explicit owner authorization.

## Current state — 2026-11-26

- Research and the initial source-based rules contract are complete.
- `./init.sh` passed full workspace install, lint, typecheck and tests with `NODE_OPTIONS=--no-experimental-webstorage`; the adjacent standard-chess browser smoke passed 5/5 (one optional offline scenario skipped).
- `@chaturanga/arimaa` is implemented as a pure Variant with two-stage chosen setup, stable FEN, complete one-to-four-step turns, atomic push/pull, per-step traps, freeze/thaw, goals, elimination, immobilization and third-repetition loss.
- `@chaturanga/arimaa-ai` supplies six seeded opponent levels. Setup considers the finite placements; midgame levels sample at most 1–256 distinct complete turns and score them through the authoritative Variant, avoiding the 20,652-turn opening list.
- `apps/arimaa/docs/design.md` proposes the original “Field Manual” identity, with a step rail, trap-support marks and a mobile-first board. Visual approval remains open; implementation will keep the same original direction and preserve responsive/accessibility checks.
- `Game.turnDraft(actions)` is implemented and tested: the browser can preview a draft and ask for bounded legal atomic next actions, with push/pull represented as paired actions.
- `apps/arimaa/web/` is an independent English PWA with original Field Manual styling and piece marks, self-hosted IBM Plex Sans, local saved bot/pass-and-play games, six seeded Web Worker opponents, 192/512 install icons, and product-local `ARIMAA_SITE_URL`.
- Its interactive course has 15 lessons for setup, movement, Rabbit direction, steps, freezing/support, push/pull, trap resolution, goals, elimination, immobilization, repetition, no-pass and result order. Lessons use real Arimaa `Game` states and `Game.turnDraft()` for bounded movement.
- Tutorial/locale tests pass 5/5; every lesson position and annotated legal solution is checked. The production PWA builds. Built-app Chromium smoke covered desktop and 390px layouts without overflow, setup-lesson interaction, in-game setup placement, service-worker control, all 15 offline lessons, and zero page errors.
- Added the isolated Arimaa Worker: private invite rooms, quick-match namespace, reconnectable Durable Object rooms, a product-specific D1 finished-game archive and local dev launcher. Setup placements and complete turns replay through the Arimaa Variant.
- Added an online lobby and room view using the shared game-shell connection/room flows, with Arimaa setup placement, complete-turn editing, draw/resign/rematch actions, and no chat. A board regression test ensures mutable online game updates refresh occupied squares.
- Worker integration tests pass 6/6 for room creation/join, quick-match pairing, illegal/stale move rejection, setup clock pause/start, full setup and complete turns, reconnect after Durable Object eviction, no-chat, and isolated archived results. Web tests pass 6/6; web and Worker typechecks pass.
- `NODE_OPTIONS=--no-experimental-webstorage npm run verify` passed after adding the Worker (all workspace lint, typechecks and tests); `npm run build:arimaa` passed (PWA, Worker dry-run and assets). Wrangler emits a non-fatal local log permission warning in this sandbox; Vite reports its existing config-extension warning and the app bundle is 507.9 kB minified.
- Built PWA plus local Worker Chromium smoke passed: health response, invite room with two independent seats, all 32 setup placements, first complete move synchronized to both seats, installed service worker control, zero page errors. Next: commit/push the verified increment, confirm exact-SHA CI, then stage on Melon port 19920 and verify restart plus copied-state recovery. Keep public DNS/Caddy/catalog unchanged and the Arimaa Public License gate in place.
