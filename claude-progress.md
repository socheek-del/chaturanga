# Progress Log

<!--
Filename kept for compatibility with the harness-engineering templates. The
file is agent-agnostic. Read it at session startup and update it before
handoff; no agent updates it automatically.
-->

## Current Verified State

- Repository root: `t-chess/` (GitHub `socheek-del/chaturanga`, renamed from `Makruk` on 2026-09-14, public, GPL-3.0). Makruk product in `apps/makruk/{web,worker}`, rules in `packages/makruk`.
- Production: https://th-chess.beanroti.com — Worker `makruk` (static assets + `/api/*` + `/ws/*`, Durable Objects `GameRoom`, `Matchmaker`), auto-deployed by GitHub Actions on push to `main`
- Standard startup path: `./init.sh` then `npm run dev` (web :5173 proxies to wrangler :8787)
- Standard verification path: `npm run verify` (lint + typecheck + unit tests in all workspaces, incl. workerd tests)
- E2E: `npm run e2e` (Playwright starts vite + wrangler dev) · PWA/offline: `npm run e2e:pwa -w apps/makruk/web`
- Deep engine checks: `npm run test:deep -w packages/makruk` · `npm run test:deep -w packages/sittuyin` · Bot ladder: `npm run test:strength -w packages/ai` (slow; `STRENGTH_PAIR=n`)
- Milestones: M0 infra ✓, M1 engine ✓, M2 local play ✓, M3 vs computer ✓ (ai-002 ladder verified on GitHub Actions), M4 learning ✓, M5 online ✓ (incl. quick match), M6 accounts (acct-001 anonymous seat token ✓; acct-002/acct-003 deferred — accounts removed by the owner), M8 owner requests (play-006, about-001, docs-001 ✓; seo-001 awaiting Search Console), M7 polish (PWA, sounds, themes, art ✓; polish-002 blocked)
- D1 database `makruk` (id 9e084ac6-9749-411d-867d-c89e8421ed78); migrations in `apps/makruk/worker/migrations`, applied by `npm run deploy` (CI) and by the Playwright wrangler command locally
- Remaining: `polish-002` (native Thai review) and `seo-001` (Search Console submission) — both need the owner; `acct-002`/`acct-003` deferred (accounts removed from the product for now)
- Multi-game platform (session 003): plan in `docs/PLATFORM.md` (repo → `chaturanga`, one product per game on its own subdomain, Sittuyin next in Burmese + English). `packages/sittuyin` engine complete (M9): sit-001 ✓ setup, sit-002 ✓ moves + promotion, sit-003 ✓ game end + ASEAN counting (`docs/sittuyin-rules.md`). plat-002: `packages/rules-core` holds the Variant interface and shared 8x8 code, and both engines pass its conformance suite. plat-003: the repo is renamed to chaturanga, Makruk lives in `apps/makruk`, and the scope is `@chaturanga/*`. plat-004 ✓ per-product languages (`@chaturanga/game-shell`). sit-004 ✓ Sittuyin bots and the full ladder. plat-005 in progress: `@chaturanga/board-ui` ✓, game sessions in game-shell ✓, `@chaturanga/ui` primitives ✓ (`packages/ui/TOKENS.md` lists the tokens a product must define); still to do are the shared GameScreen and the server kit. Next: push and smoke, then plat-005 slice b3.
- Shell pitfall: run npm/vitest under the `.nvmrc` Node (`. ~/.nvm/nvm.sh && nvm use`). The default shell Node 20.13 makes npm skip rolldown's native binding, and vitest then fails with "Cannot find native binding". `init.sh` already switches Node.
- Three products are live, each on its own subdomain, Worker and D1: Makruk (`makruk`, D1 `makruk`), Sittuyin
  (`sittuyin`, D1 `sittuyin`) and Xiangqi (`xiangqi`, D1 `xiangqi`, id 1f9042ad-3c89-4c04-8f75-25b7be61f7b7,
  session 014). Each address lives only in that app's `site.config.ts` and its Worker's `routes`.
- Production smoke of a live site: `npm run smoke:prod -w apps/xiangqi/web` (starts no server; reads the
  address from `site.config.ts`).
- Current blockers (owner action needed):
  - `seo-001`: verify the site in Google Search Console and submit `https://th-chess.beanroti.com/sitemap.xml`
  - `polish-002`: native Thai reviewer completes `docs/i18n-review.md`
  - `xq-011`: native Chinese reviewer completes `apps/xiangqi/docs/i18n-review.md`
  - `sit-011`: native Burmese reviewer completes `apps/sittuyin/docs/i18n-review.md`

## Session Log

### Session 001

- Date: 2026-09-13
- Goal: plan the product, set up the harness, then implement every feature in `feature_list.json`.
- Completed:
  - M0: monorepo scaffold, CI, production deploy on th-chess.beanroti.com with a scoped Cloudflare token.
  - M1: Makruk engine verified against Fairy-Stockfish (perft fixtures, lock-step random games, counting rules, insufficient material).
  - M2: design system, Thai-first i18n, board with tap/drag, move list/history/undo, pass-and-play views, clocks with presets, light/dark and board themes.
  - M3: alpha-beta AI in a Web Worker, 6 bot personas, hints and takeback; repetition-aware search with contempt and a "conversion mode" for won endgames.
  - M4: data-driven lessons (10 piece/rule lessons + counting lesson), guided first game with coach, lesson path with XP (the daily streak was removed later at the owner's request; the path was restyled as a temple stairway in the 2026-09-14 Wat redesign).
  - M5: guest identity, GameRoom Durable Object (server validation, clocks, alarms, hibernation, reconnect/abandon, draw/resign/rematch), web client, quick-match Matchmaker.
  - M7: installable offline PWA, synthesized sounds + haptics + move animation, final classic piece set, flat set, mascot.
- Verification run: see evidence per feature in `feature_list.json` (unit: engine 129, ai 18, web 105, worker 30; E2E 59 + PWA 2).
- Commits: through `f021315` (CI verify + deploy green).
- Known risk or unresolved issue:
  - Bot ladder originally failed on counting-rule draws (strong side could not mate before the count ran out); fixed with conversion mode; re-run in progress.
  - npm 10 crashes on this dependency tree → use npm 11 (`init.sh`, CI).
  - ffish needs `globalThis.fetch` hidden in Node 22 (`packages/engine/src/testing/ffish.ts`).
  - Vitest swallows console output of passing tests: slow tests write results to files (`packages/ai/strength-results.log`, gitignored).
- Later in session: accounts reworked to username + password (PBKDF2), email confirmation before sign-in, email password reset, lockout after 10 failures; `DEV_EMAIL_OUTBOX=1` lets tests and local dev read emails from D1.
- Later in session: `ai-002` verified. The local ladder kept getting killed under memory pressure, so it moved to an on-demand GitHub Actions workflow (`.github/workflows/strength.yml`: 5 runners × 4 shards, resumable per-game log, verdict job). Findings and fixes along the way: noise-free bots replayed identical games (→ seeded paired openings); weaker bots could force repetition (→ search checks the opponent's reply against history); full-window root search wasted L6's budget (→ exact root scores only for noisy bots, L6 depth cap 8); won endgames drew on the count (→ trade-down bonus); L4 too close to L5 (→ L4 noise 30, 2% random moves). Final ladder: +19-0=1, +19-1=0, +18-0=2, +17-0=3, +14-0=6.
- Next best step: native Thai review for `polish-002`; Search Console for `seo-001`.

### Session 002

- Date: 2026-09-14
- Goal: owner requests — games survive refresh, language remembered without an account, remove streaks,
  remove accounts/identity (open to all, all lessons unlocked), About page with GitHub contribution links,
  SEO, and a showcase README.
- Completed:
  - `play-006`: local/computer/guided games saved in localStorage and rebuilt on load; computer bot resumes.
  - Language already persisted per browser (verified on production); settings store gained a migrate step.
  - Daily streak removed (progress v2 migration); all lessons open.
  - Accounts, ratings, history, replay and rated toggle removed from the web app (`acct-002`/`acct-003`
    deferred; worker code dormant); online players shown as You / Opponent.
  - `about-001`: About page + CONTRIBUTING.md.
  - `seo-001`: per-page Thai/English titles and descriptions, canonical + hreflang (`?lang=en`), OG image,
    JSON-LD, robots.txt, sitemap.xml, crawler fallback content — verified on production.
  - `docs-001`: README with GIF demos captured from production; the capture review found and fixed
    white-on-white lesson unit banners.
- Verification run: web unit 110; full E2E 65/65 (plus focused re-runs); CI verify + deploy green through 248b653.
- Known risk: SEO ranking depends on Search Console submission and time; README media must be re-captured when the UI changes.
- Later the same day:
  - Search Console domain property verified by the owner; sitemap read (Success, 12 pages); IndexNow submissions accepted; GitHub repo homepage/description/topics set; crawlable Makruk intro added to the home page.
  - Domain made configurable (`apps/web/site.config.ts`); no domain in images, GIFs or README badges; README.th.md added.
  - "Wat" redesign replaced the Duolingo-like look (legal risk flagged by the owner): own palette, Prompt font, pill buttons, temple-stairway lessons, recoloured icons and mascot; docs/design.md rewritten; full E2E 65/65.

### Session 003

- Date: 2026-09-14
- Goal: plan a multi-game monorepo (owner wants Sittuyin, Shogi and others without rebuilding everything or mixing products), then start Sittuyin.
- Owner decisions:
  - Monorepo renamed to `chaturanga`.
  - Subdomains for now.
  - Sittuyin first, in Burmese + English.
  - Nothing game-specific at the root or in shared packages.
- Completed:
  - `plat-001`: `docs/PLATFORM.md` and features sit-001..011 / plat-002..006 (commit 7408fb1).
  - `sit-001`: `packages/sittuyin` with FEN, pieces in hand and the setup phase, verified against ffish `sittuyin` (100 setups in verify, 400 deep).
- Verification run: `npm run verify` exit 0 (web 112, worker 48, ai 20, engine 129, protocol 2, sittuyin 52); `npm run test:deep -w packages/sittuyin` 52 passed.
- Known risk or unresolved issue:
  - The shell's default Node is 20.13; use nvm (see Current Verified State).
  - Package scope is mixed (`@makruk/*` plus `@chaturanga/sittuyin`) until plat-003.
- Later in session: `sit-002` — move generation and Ne promotion verified against ffish (perft reference for 13 positions, lock-step full games). The promotion rules came from ffish probes; `packages/sittuyin/src/movegen.test.ts` lists each probed case.
- Later in session: `sit-003` — Sittuyin game end, including ASEAN counting and the 50-move rule, documented in `docs/sittuyin-rules.md`. Lock-step games now compare the full FEN and game over. They found one real counting bug (a bare-king capture cleared the count); it is fixed. Deep run 165/165; verify exit 0.
- Not pushed: commits 7408fb1..HEAD are local only. A push to `main` triggers the CI deploy (Makruk is unaffected, but ask the owner first).
- Owner approved the plan and asked to start implementation (push question still unanswered, so nothing pushed).
- `plat-002`: `packages/rules-core` created.
  - The Variant interface was designed from a survey of the Game calls in the web app and worker.
  - Both engines satisfy it at compile time and pass the shared conformance suite. A mutation check (an undo that does nothing) proved the suite catches violations.
  - Makruk re-exports the moved code under its old names, so the ai, web and worker packages did not change.
  - Verification: verify, deep runs for both engines, build, E2E. Results are in `feature_list.json`.
- Owner answered: push now, and do all of plat-003 including the GitHub rename.
- Pushed 7408fb1..5e5921f. CI verify + deploy succeeded, and the production home page and `/api/health` returned 200.
- `plat-003` (commit 1c3f632):
  - Moved the Makruk app, rules engine and docs into product folders, and renamed the scope to `@chaturanga/*`.
  - Split the root and Makruk README, CONTRIBUTING and AGENTS files, and added `product` to all features.
  - Verification: verify, build, e2e:pwa, and E2E 65/65 on a re-run (the first run had one timing flake, recorded in the evidence).
  - Renamed the GitHub repo to `chaturanga` and updated the remote, description and topics, then pushed.
- Known flake: in E2E online-004 (reload rejoins), the opponent-disconnected bar can cover the board under full-suite load. It passes alone and on re-run. Worth hardening if it recurs.
- Owner asked for a detailed Sittuyin implementation plan and to start implementing.
- `apps/sittuyin/docs/PLAN.md` written.
  - Product defaults: setup UX with hand trays and Auto-arrange, clocks start after setup, a Promote chip for in-place promotion, Noto Sans Myanmar, six bots, a separate Worker and D1.
  - Seams found by an inventory of the Makruk web app and worker.
  - A 10-step work breakdown mapped to sit-004..011 and plat-004..006.
  - One inventory claim checked and rejected: that the index.html JSON-LD has a missing comma. It is valid.
- `sit-004` in progress.
  - `@chaturanga/ai-core` (Makruk search ported behind a `SearchAdapter`, 11 tests on Nim).
  - `@chaturanga/sittuyin-ai` (adapter, evaluation, setup policy, 6 bots, 21 tests, strength ladder).
  - `strength.yml` gained a `package` input.
  - The Sittuyin engine got a `/core` export plus `encodedToUci`, and promotion generation no longer allocates. Its tests are unchanged and passing.
  - Benchmark: Sittuyin search about 55k nodes/s vs Makruk 90–110k at the same budget.
- Local ladder preview: L2 > L1 +20-0=0; L3 > L2 +16-3=1. Actions runs were dispatched for all 5 pairs; pairs 1–4 passed (verdicts in sit-004 notes once pair 5 finishes).
- `plat-004` passing.
  - Built while the ladder ran on Actions, not locally.
  - `@chaturanga/game-shell` holds the product config, locale helpers, SEO tags and `describeLocales`.
  - Makruk is driven by `apps/makruk/web/product.config.ts`.
  - Build ships 0 Myanmar characters, sitemap identical to production, E2E 65/65, PWA 2/2, verify green.
- plat-004 is live on production: CI run 34824222210 green, and production home shows `lang=th`, the `makruk.settings` key and locales `["th","en"]`.
- `plat-005` slice a (board) is done.
  - `@chaturanga/board-ui` provides Board, HandTray and useMoveInput with drops and promotion, 18 tests.
  - Makruk is migrated onto it.
  - Web unit 109, E2E 65/65, PWA 2/2; built CSS contains the board-ui classes.
- board-ui on production: CI run 34825066575 green, and the production smoke test passed (bot game, online room).
- `plat-005` slice b1 (sessions) done.
  - Clock arithmetic moved to rules-core.
  - game-shell gained results with `fifty-move`, time controls, and `createGameSession(variant)`, whose clock is setup-aware. 15 tests.
  - Makruk's session, result and time-control modules are now wrappers over game-shell.
- plat-005 stays `in_progress`.

### Session 004

- Date: 2026-09-14
- Goal: resume implementation from the session 003 next step.
- `sit-004` is now `passing`. Actions run 34823317321 finished: all five play shards and the verdict job
  green, L6 mingyi > L5 yahhta +11-1=8. The full ladder is +20-0=0, +16-3=1, +15-0=5, +18-0=2, +11-1=8,
  so every level beats the one below over 20 games. L6/L5 is the narrowest margin, which matches the
  note that Sittuyin searches about 55k nodes/s.
- `plat-005` slice b2 (ui primitives) done.
  - `@chaturanga/ui` holds Badge, Button, Card, Modal, ProgressBar, SegmentedControl, Switch and `cn`.
    `apps/makruk/web/src/components/ui` and `src/lib/cn.ts` are deleted, and 15 app files import the
    package instead. The app keeps no copy.
  - The primitives hold no palette. Three hex values that were inlined became tokens — `text-on-gold`,
    `text-on-warning` and `bg-scrim` — and Makruk defines them at the old values in both themes, so
    nothing changes visually. `packages/ui/TOKENS.md` is the contract a product must satisfy.
  - A token-contract test fails if any primitive regains a hex or rgb literal.
  - Verification: verify green (makruk-web 109 unchanged, ui 16 new), build OK with the package's own
    classes present in the built CSS, E2E 65/65, PWA 2/2.
- `plat-005` slice b3 (game screen) done, then slice c (server kit), and `plat-005` is now `passing`.
  - b3: `@chaturanga/game-shell/ui` holds GameScreen and its parts, generic over a Variant. It gained
    what Sittuyin needs and Makruk never had: hand trays during the setup phase and a Promote action for
    promotion in place. Makruk's GameScreen is a wrapper supplying the product's identity, so its pages
    did not change. The shell's i18n keys are listed in `packages/game-shell/KEYS.md`.
  - c: `@chaturanga/server-kit` holds the room state machine, room codes and the two Durable Objects,
    driven by a Variant. The Makruk Worker keeps only its identity (about 480 lines of plumbing left it).
    The protocol carries `variant`, gains `fifty-move`, and its move-string guard now accepts drops and
    any promotion letter. Migration 0003 adds `games.variant`.
- `sit-005` built and verified, but deliberately left `in_progress`: the owner still has to approve the
  direction, which is what the feature's own verification asks for.
  - Direction: "Daung" (peacock) — peacock teal and aubergine interface, Bagan lacquer board and pieces.
  - `apps/sittuyin/web` now exists as a scaffold: product config (Burmese default, English), the token
    set in light and dark, Noto Sans Myanmar, my/en locales, the "yun" piece set and a design showcase.
  - `@chaturanga/board-ui` gained a generic `overlay` prop; Sittuyin draws the two promotion diagonals
    with it.
  - Screenshots for review: `apps/sittuyin/docs/evidence/design-{light,dark}-{390,1280}.png`.
- Known risk or unresolved issue:
  - `package-lock.json` lost the `libc` field on the linux `sharp` / `rolldown` / `rollup` /
    `lightningcss` / `tailwindcss-oxide` entries. npm 11.19.1 — the version CI installs — rewrites the
    lock that way on any install, so this change did not choose it. `npx npm@11 ci --dry-run` resolves
    cleanly on macOS, but linux native-binding selection is only proven once CI runs. If CI fails with a
    missing native binding, look here first.
  - Nothing is pushed since `8590056`. A push to `main` triggers the CI deploy of Makruk, so ask the
    owner first. Four commits are waiting: ui, game screen, server kit, Sittuyin design.
  - The Sittuyin app is not in CI, not deployed and has no Worker yet (sit-008/sit-009).
- Feature order note: `plat-006` (links between the games) has priority 52, ahead of the sit-* features,
  but `apps/sittuyin/docs/PLAN.md` — which the owner approved — puts it in step 10, after Sittuyin
  exists. The plan wins: a "more games" link cannot be verified against a site that is not built. Do
  plat-006 after sit-009.
### Session 005

- Date: 2026-09-14
- Goal: implement everything left in `feature_list.json`, asking the owner only where the answer is
  genuinely theirs.
- Baseline on entry: `./init.sh` and `npm run verify` both green. A complete, uncommitted Sittuyin web app
  was already on disk from session 004 (router, pages, GameScreen, AI client, session stores, 18 e2e
  specs) but had never been recorded as verified.
- `sit-006` is now `passing`. What this session added on top of what was on disk:
  - PWA icons and favicon for the product (`scripts/generate-icons.mjs`, a Sit-ke shield on peacock
    teal), and the icon links in `index.html`. Without them the app was not installable.
  - `playwright.pwa.config.ts` and `e2e-pwa/offline.spec.ts`: installability (0 Chrome installability
    errors) and offline play on a production build.
  - The missing in-place promotion test the feature's own verification asks for. It seeds a saved game
    through the same localStorage shape a refresh restores (`seedSavedGame` in `e2e/helpers.ts`), so no
    new product surface was needed to reach a promotion position.
  - `scripts/capture-evidence.mjs` (`npm run capture`), so the screenshots a reviewer looks at are
    reproducible. The seven app screenshots are in `apps/sittuyin/docs/evidence/`.
  - `dev:sittuyin` at the root, and `test-results-pwa/` in `.gitignore`.
- Verification: sittuyin e2e 19/19, e2e:pwa 2/2, `npm run verify` exit 0, build OK, and Makruk e2e 65/65
  as a regression check on the shared packages.
- First promotion test position drew immediately (K+F vs K is insufficient material); it now keeps a
  black Ne on the board so the game stays ongoing. Worth remembering when writing Sittuyin fixtures.

- Next best step:
  - Owner (three questions, none of them blocking local work): approve or redirect the Sittuyin design
    direction (`apps/sittuyin/docs/evidence/`); say whether to push the waiting commits, which deploy
    Makruk; and name the Sittuyin subdomain for `sit-009`.
  - `sit-007`: Sittuyin lessons.

### Session 006

- Date: 2026-09-14
- Goal: implement everything left in `feature_list.json`.
- Owner approved the Sittuyin design direction (`sit-005` now `passing`, recorded in its evidence).
- Commit d35e422 moved lesson shapes, the progress store and the lesson player into `@chaturanga/game-shell`.
- `sit-007` is now `passing`.
  - 12 Sittuyin lessons in 3 units, a lesson path with XP, and a Learn tab and home card.
  - The shared LessonPlayer gained a hand tray for placement steps and a Promote button.
  - Verification: sittuyin-web unit 79 (engine-validated lessons), `learn.spec.ts` 3/3 (one full lesson in
    Burmese, one in English), full Sittuyin e2e 22/22, Makruk learn + path e2e 6/6, `npm run verify` exit 0.
  - `npm run capture` now also writes four lesson screenshots; all evidence PNGs were re-captured because
    the nav gained Learn.
- No Chrome DevTools MCP server is connected in this environment; visual checks use Playwright Chromium.
- `sit-008` is now `passing`.
  - `apps/sittuyin/worker`: Worker `sittuyin`, its own Durable Objects and D1 `sittuyin` (migration 0001
    `games`). Its `database_id` is a placeholder and it has no routes; both wait for sit-009.
  - server-kit: rooms keep the clock stopped during a setup phase and start it after the last placement.
    `join` now takes the variant. Seat tokens (`auth.ts`, moved from the Makruk worker) and
    `registerPlayRoutes` are shared, so each product's `app.ts` is a few lines.
  - game-shell: the online client (seat token, room API, socket, online session) and the lobby and room UI
    moved out of the Makruk app. Makruk's online pages are now thin wrappers, and its e2e tests are unchanged.
  - Protocol `HealthResponse.service` is any non-empty string now. Its test changed from "rejects a wrong
    name" to "rejects a missing or empty name", because each product has its own Worker.
  - Sittuyin web: `/play/online` and `/play/online/:code`, Auto-arrange for your own pieces online, and
    my/en strings. Dev: `npm run dev:sittuyin` (Worker :8788 + web). CI also runs `build:sittuyin`.
  - Verification:
    - Sittuyin worker (workerd) 9 tests, server-kit 19, and Sittuyin online e2e 4/4.
    - Full Sittuyin e2e 26/26, PWA 2/2, and Makruk e2e 64/65. The one failure is `clock.spec`, a local
      fake-clock test this change does not touch; it passed 12/12 when re-run with `--repeat-each 3`.
    - `npm run verify` exit 0, `npm run build` and `npm run build:sittuyin` OK.
- Known flake: Makruk `clock.spec` "clock counts down…" can fail under full-suite load, like online-004.
- `plat-006` is now `passing`.
  - `packages/family` names each game in th/my/en. `src/sites.ts` takes each game's address and languages
    from its own `site.config.ts` / `product.config.ts`, and each vite.config injects the siblings as
    `__FAMILY__`.
  - The shared `MoreGames` component shows a home-page section and a footer on every page. A link keeps
    the viewer's language only if the sibling site speaks it.
  - Address overrides are per product now (`MAKRUK_SITE_URL`, `SITTUYIN_SITE_URL`). A shared `SITE_URL`
    would have leaked one site's address into the other's links.
  - Verification:
    - family unit 3, game-shell 28.
    - `family.spec.ts` in both apps; Makruk e2e 66/66 and Sittuyin e2e 27/27.
    - Both PWA suites 2/2, both builds OK, lint and typecheck clean.
    - Screenshots reviewed: Makruk home at 1280px and Sittuyin home at 390px.
- Pitfall: a Bash call that `cd`s changes the working directory for the next parallel call. Always `cd` to
  an absolute path when running a suite.
- `sit-010`: the local parts came first (details below), then the production checks and the READMEs.
  - Search: per-page my/en titles and descriptions (`SeoController`), canonical + hreflang, robots.txt and
    sitemap.xml (12 URLs) generated from `site.config.ts`, JSON-LD, crawlable fallback content in
    index.html, and an OG image (`npm run icons`).
  - About: what Sittuyin is, plus the GitHub, contribute, bug-report and review-the-Burmese links.
  - Verification: seo.test 6, `seo.spec.ts` and `about.spec.ts`, full Sittuyin e2e 29/29, PWA 2/2,
    `build:sittuyin`, `npm run verify` exit 0.
  - Still open, and both need production (sit-009): check the tags on the live site, and write
    `apps/sittuyin/README.md` and `README.my.md` with media captured from production.
- `sit-011`: `apps/sittuyin/docs/i18n-review.md` is written (scope, terminology, sign-off). The feature stays
  `blocked`, because a native Burmese reviewer must do the review.
- The owner chose `my-chess.beanroti.com` and approved pushing both products.
- `sit-009` is now `passing`.
  - Created D1 `sittuyin`, and set `AUTH_SECRET` on the `sittuyin` Worker.
  - Added the custom-domain route, plus a `changes` job (paths-filter) that gates `deploy` (Makruk) and
    `deploy-sittuyin`.
  - Pushed 8590056..a5e32a7. Run 34860305355 is all green.
  - Production smoke 11/11 on both sites: health, guest token, Burmese home, computer game, online room
    across two browsers, more-games links, Makruk computer game and room.
- `sit-010` is now `passing`.
  - Live SEO check 7/7: raw HTML tags, per-page my/en tags, noindex rooms, robots, sitemap, OG image, About.
  - `apps/sittuyin/README.md` and `README.my.md` are written, with media captured from production
    (`npm run capture:readme`, ffmpeg + ImageMagick). Sampled frames were reviewed and show no domain.
  - The root README lists Sittuyin as live.
- Remaining (humans only): `polish-002` (Thai review) and `sit-011` (Burmese review). Submitting the Sittuyin
  sitemap in Search Console is an owner action.

### Session 007

- Date: 2026-09-15
- Goal: owner request about phone browsers. Buttons hid behind the nav bar; lessons needed scrolling; the nav
  should be hidden during games and lessons; Burmese lines overlapped; the lesson progress bar should be sticky.
- Added feature `polish-003` (platform), now `passing`:
  - Focus mode in game-shell: on phones, games and lessons hide the nav, and a game gets a back link.
  - Lessons fill one screen: the progress header on top, the actions at the bottom, and the board fitting the
    space in between.
  - The game board is measured to fit the screen together with the bars, trays, turn banner and actions.
  - "Back to live" moved under the history buttons.
  - Buttons grow with wrapped labels, and Sittuyin line heights were raised for Burmese.
- Verification: new `mobile.spec.ts` in both apps (Sittuyin 5, Makruk 1), full e2e Sittuyin 34/34 and Makruk
  67/67, `npm run verify` exit 0, and phone/tablet/desktop screenshots reviewed before and after.
- A container-query version of the game layout was tried first and dropped. On tablets and tall phones it left
  empty bands around the board, because the board is width-limited there. Measuring the column fixed it.
- Pitfall again: Bash calls that `cd` move the working directory for parallel calls. Playwright run from the
  repo root has no config and fails every test at once; that is not a real result.

### Session 008

- Date: 2026-09-15.
- Goal: start Xiangqi (Chinese chess), the third product, per a local implementation-note briefing
  (`docs/xiangqi-implementation-note.md` — untracked, `.git/info/exclude`; not the system of record).
- Baseline on entry: `./init.sh` green (all workspaces pass).
- Step 0 (plan into tracked artifacts) done:
  - Owner accepted all 10 suggested defaults (languages `zh-Hans`+`en`, Fairy-Stockfish `xiangqi` as rules
    authority, SVG-path piece art, Red/Black colours, engine SAN notation first, its own approved design
    identity, subdomain chosen at deploy, system CJK font stack, six piece-named bots).
  - `apps/xiangqi/docs/PLAN.md` written (product decisions, architecture, gap analysis against the platform's
    Makruk/Sittuyin-shaped assumptions, 15-step work breakdown, terminology table, risks) — same shape as
    `apps/sittuyin/docs/PLAN.md`.
  - `docs/PLATFORM.md` updated: Xiangqi listed as the third product, target layout gained
    `apps/xiangqi/{web,worker}`, a pointer to the new plan, and the two open questions (brand identity,
    subdomain) it still needs an owner call on.
  - Root `AGENTS.md` product list updated (Sittuyin corrected to live; Xiangqi added as planned).
  - `feature_list.json` gained 15 `not_started` features: `plat-007..010` (size-aware rules-core/lessons,
    decisive stalemate+perpetual results, intersection board + non-square fitting, family tests independent of
    game count) and `xq-001..011` (engine, game end, AI, design, web app, lessons, online, deploy, join family,
    SEO/About/README, native review), in the dependency order the plan lays out. No feature was marked
    `passing` — this session did docs only.
- Known risk: Xiangqi breaks two platform assumptions Makruk and Sittuyin share (8x8 board, pieces on
  squares). The `plat-007/008/009/010` features exist specifically to remove those assumptions generically;
  each one must leave Makruk and Sittuyin's full E2E and PWA suites green. The chasing-rule algorithm
  (`xq-002`) is flagged as the highest-risk engine task — port from the Fairy-Stockfish source, do not invent.
- Next best step: `plat-007` (size-aware rules-core helpers and lessons) — the first platform-prep feature,
  needed before `xq-001` can build the Xiangqi engine on `describeVariantConformance`.
- `plat-007` started, paused mid-work by request (session paused, not ended). Status `in_progress`, notes in
  `feature_list.json` have the exact resume point. Done so far:
  - `squareNameOf`/`squareOf` moved to `packages/rules-core/src/coords.ts`, exported from rules-core's
    `index.ts`; `packages/board-ui/src/coords.ts` re-exports both from rules-core (public API unchanged) and
    keeps `parseUci`.
  - `packages/rules-core/src/coords.test.ts` added: 8x8 round-trip, 9x10 round-trip incl. the two-digit-rank
    cases the plan calls out (`a10` &lt;-&gt; 81, `i10` &lt;-&gt; 89 with `files=9`), and invalid-name rejection.
  - `npm run verify` re-run clean at this checkpoint: exit 0, no errors or failures in the log.
  - `packages/rules-core/src/board8.ts` (the Makruk-family 8x8 helpers) was deliberately left unchanged, as
    the plan requires.
- Not yet done (still open in `plat-007`):
  - `packages/rules-core/src/testing/conformance.ts` still hardcodes the 8x8 assumptions: `expect(variant.files
    * variant.ranks).toBe(64)`, the `square < 64` loop, and `squareName`/the `/[a-h][1-8]/g` match on the
    move-record assertion. None of this has been touched yet.
  - `packages/game-shell/src/ui/LessonPlayer.tsx` and `packages/game-shell/src/testing/lessons.ts` still use
    the 8x8 `parseSquare`/`squareName` and fixed-width `.slice(0,4)`/`.slice(2,4)` UCI parsing. Not touched yet.
  - Nothing from this feature is committed. `git status` at the pause point: modified
    `packages/rules-core/src/index.ts`, rewritten `packages/board-ui/src/coords.ts`, new
    `packages/rules-core/src/coords.ts` and `coords.test.ts` — all untracked/uncommitted.
  - No E2E run yet (Makruk / Sittuyin learn specs) — do that only after the LessonPlayer/testing changes land,
    since those are the files that actually touch lesson behaviour.
- To resume: finish the two "still to do" files above, run `npm run verify` + both E2E suites, then commit as
  `refactor(rules-core): board-size-aware squares for conformance and lessons (plat-007)` per the plan, and
  only then mark `plat-007` `passing` with that evidence.

### Session 009

- Date: 2026-09-15.
- Goal: resume `plat-007`, paused mid-work at the end of session 008.
- Baseline on entry: `git status` clean (the session 008 checkpoint was already committed as `af4b5a1`).
  `./init.sh` green.
- `plat-007` is now `passing`. Finished the two files the resume note flagged:
  - `packages/rules-core/src/testing/conformance.ts`: dropped the hardcoded `expect(variant.files *
    variant.ranks).toBe(64)` for a `> 0` check; the `pieces()`/`pieceAt()` loop now runs to `variant.files *
    variant.ranks` instead of a literal `64`; the seeded-playout assertion switched from the 8x8
    `squareName`/`/[a-h][1-8]/g` to `squareNameOf(record.to, variant.files)` against `/[a-p]\d{1,2}/g`, so a
    two-digit rank (e.g. `i10`) still matches.
  - `packages/game-shell/src/ui/LessonPlayer.tsx`: `InfoStep`/`SquaresStep` now build/read square names with
    `squareOf`/`squareNameOf(*, props.variant.files)` instead of the fixed 8x8 `parseSquare`/`squareName`.
    `MoveStep` no longer compares solutions to the played move with `uci.slice(0, 4)` (which assumes a
    2-character square on both sides); a new `sameSquares()` helper parses both strings with board-ui's
    `parseUci(uci, files)` and compares by square index (and, for a drop, piece type), which is correct for
    any board size.
  - `packages/game-shell/src/testing/lessons.ts`: the same swap — `highlight`/`answer` squares validated with
    `squareOf`, and the move-step / `targetsOf` legality checks now parse every candidate UCI with `parseUci`
    instead of slicing fixed offsets.
  - No other file needed touching; `board8.ts`'s fixed 8x8 `squareName`/`parseSquare` stay as-is for
    Makruk/Sittuyin's own engine code, per the plan.
- Verification: `npm run verify` exit 0 (all workspaces, including the new `coords.test.ts` from session 008).
  `npm run e2e` (Makruk) 67/67. `npm run e2e -w apps/sittuyin/web` 34/34 — the full suite, not just the
  `learn.spec.ts` the plan called out, as an extra regression check since board-ui/game-shell are shared.
- Committed as `refactor(rules-core): board-size-aware squares for conformance and lessons (plat-007)`.
- Next best step: `xq-001` (Xiangqi engine) is next per `apps/xiangqi/docs/PLAN.md`'s work breakdown, now that
  `plat-007` no longer blocks it. `plat-008/009/010` (decisive stalemate+perpetual results, intersection board
  + non-square fitting, family tests independent of game count) are still `not_started` and are on the same
  critical path before Xiangqi's board/UI work, per the plan's dependency order.

### Session 010

- Date: 2026-09-16.
- Goal: resume from session 009's next step and implement `xq-001` (Xiangqi board, FEN and move
  generation), per `apps/xiangqi/docs/PLAN.md` step 2.
- New environment pitfall: this sandbox had no Node.js or `nvm` installed at all (not just the wrong
  default Node version) — `node`/`npx` were not on `PATH` and `~/.nvm` did not exist, so `./init.sh`
  failed immediately at `node -v`. Fixed by installing nvm from the standard install script
  (`https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh`) into `~/.nvm`, then
  `nvm install 22.23.1` (the `.nvmrc` version). A stale local checkout also meant `git fetch` found three
  commits already on `origin/main` (`plat-007` finished, plus `fe9674a` planning Xiangqi as the third
  product) that this session did not have locally; synced with `git reset --hard origin/main` before
  starting (the only local commit at that point was a docs-only note based on the stale state, safely
  discarded). If a future session hits `node: command not found`, install nvm the same way first, and
  always `git fetch`/compare against `origin/main` before concluding there is no work left.
- `xq-001` is now `passing`.
  - `packages/xiangqi` (`@chaturanga/xiangqi`), modelled on `packages/sittuyin`'s file layout but with its
    own board module: a 9x10 point-index board (`board.ts`), attack detection including the flying-general
    rule (`attacks.ts`), FEN (`fen.ts`), move generation (`movegen.ts`), the `Game` class (`game.ts`),
    `perft.ts`, and `variant.ts` exporting `xiangqi satisfies Variant<Game>`. No promotion and no hands
    (`hasHands: false`), so the package is simpler than Sittuyin's in those two respects.
  - Every rule (palace confinement, the river, the horse leg, the elephant eye, the cannon screen, the
    flying general, SAN letters and disambiguation) was probed against Fairy-Stockfish (ffish 0.7.10)
    directly before being coded, not guessed from memory. The opening position's 44 legal moves were
    diffed byte-for-byte against ffish's own list. SAN uses different letters for Horse (H) and Elephant
    (E) than their FEN letters (N, B) — confirmed by probe, not assumed.
  - One real bug, found by the lock-step reference test and not by any hand-written test: `game.ts`'s SAN
    disambiguation imported `fileOf`/`rankOf` from `@chaturanga/rules-core`, which resolves to the
    Makruk-family's fixed 8x8 `board8.ts` helpers (`sq & 7`, `sq >> 3`) — silently wrong for a 9-wide
    board past file g. Fixed by importing Xiangqi's own 9-wide versions from `./board` instead.
  - Verification (all bullets in `feature_list.json`'s `xq-001` entry): `fen.test.ts` 14 round-trip + 15
    invalid-FEN cases; `movegen.test.ts` 20 tests covering every piece rule, the flying general, and the
    pin it creates on its own blocker; `variant.test.ts` runs the shared `describeVariantConformance`;
    `perft.test.ts` and `reference.test.ts` against `scripts/perft-reference.cjs`'s ffish-generated
    reference — full deep run (`PERFT_DEEP=1`, every perft depth plus 400 lock-step random games
    comparing legal moves/SAN/FEN every ply) 101/101 passed in 34s. `npm run verify` (whole repo) exit 0;
    no Makruk or Sittuyin file was touched.
  - Scope boundary, matching the plan: `status()` only distinguishes `ongoing`/`checkmate` at this step
    (using the existing shared `GameStatus` union, no new kind added); a no-legal-moves-and-not-in-check
    position returns the generic `stalemate` kind as a documented placeholder, since Xiangqi's real rule
    (stalemate is a loss, not a draw) is `xq-002`, which depends on `plat-008` (also not started). For the
    same reason `reference.test.ts` stops each game on ffish's own `isGameOver()` signal and does not
    compare this engine's status/game-over state against ffish, only legal moves, SAN and FEN.
- Next best step: `xq-002` (Xiangqi game end: stalemate loss, perpetual check/chase — ported from the
  Fairy-Stockfish chasing algorithm, not invented — 50-move rule, insufficient material) is next per the
  plan, but it depends on `plat-008` (decisive stalemate/perpetual `GameStatus` kinds, shared
  `resultFromStatus` and protocol `ResultReason`) landing first, exactly as `xq-001` depended on
  `plat-007`. Do `plat-008` first.

### Session 011

- Date: 2026-09-16.
- Goal: `plat-008` (decisive stalemate and perpetual results), Step 3 of `apps/xiangqi/docs/PLAN.md`, so
  `xq-002` is unblocked next.
- `plat-008` is now `passing`.
  - `packages/rules-core/src/types.ts`: `GameStatus`'s `stalemate` kind gains an optional `winner?: Color`
    (undefined stays a draw, exactly what Makruk and Sittuyin always produce); two new decisive kinds,
    `perpetual-check` and `perpetual-chase`, each carrying `winner: Color` like `checkmate` already does.
  - The drift the feature exists to prevent is fixed at the source, not by hand-syncing two copies:
    `packages/rules-core/src/result.ts` (new) is now the single implementation of `RESULT_REASONS`,
    `ResultReason`, `GameResult`, `resultFromStatus`, `FINAL_REASONS` and `isUndoableResult`.
    `packages/game-shell/src/result.ts` re-exports it. `packages/server-kit/src/roomLogic.ts` deleted its
    near-duplicate local `resultFromStatus` and imports the shared one. `packages/protocol/src/game.ts`
    builds its zod `ResultReason` enum from rules-core's `RESULT_REASONS` array instead of a hand-written
    string list (protocol gained a `@chaturanga/rules-core` dependency; rules-core still depends on
    nothing, so no cycle) — the wire schema now cannot list a reason the shared logic doesn't know.
  - `packages/rules-core/src/result.test.ts` (new, 23 tests): every `GameStatus` kind through
    `resultFromStatus`, including stalemate with and without a winner and both perpetual kinds;
    `isUndoableResult` true for every position-based ending and false for every `FINAL_REASONS` entry; a
    test that `FINAL_REASONS` is exactly `RESULT_REASONS` minus the position-based endings, so those two
    lists can't drift apart either.
  - `packages/game-shell/KEYS.md` documents the two new `play.reason.*` keys and notes Makruk/Sittuyin
    never produce them. No Makruk or Sittuyin file needed touching: `GameOverModal`'s `resultTitleKey`
    already branches purely on `GameResult.winner` (so a winner-bearing stalemate just renders as a normal
    win, no new `play.result.*` key needed), and the locale-completeness test only checks literal
    `t('key')` calls, while the reason line is read through a template literal — checked both, neither
    forces new locale keys on the two existing products.
  - This session's own environment gap: the sandbox had no Playwright browser installed at all (same
    class of issue as the missing Node/nvm from Session 010) — fixed with
    `npm exec -w apps/makruk/web -- playwright install chromium` before any E2E could run.
  - Verification: `npm run verify` (whole repo) exit 0 — rules-core 32 (was 9), protocol/game-shell/
    server-kit unchanged and green, every other workspace unchanged. Makruk full E2E 65/67 and Sittuyin
    full E2E 34/34 (both a pure regression check — neither variant can produce a decisive stalemate or a
    perpetual result). The 2 Makruk failures are `clock.spec` "clock counts down" and online.spec "reload
    rejoins" — both were already documented known flakes before this session. Verified independently, not
    assumed: `git stash`-ed every `plat-008` change and reproduced the identical `clock.spec` failure on
    the unmodified `xq-001` commit (`4301d83`) before restoring the stash, and re-ran `online.spec`'s
    reload test alone 3/3 green. Neither failing test touches any file this feature changed.
  - New pitfall for a `clock.spec` "known flake": it now fails consistently in this sandbox, even alone
    and serial (`--workers 1 --repeat-each 3`, 3/3 failed), which is stronger than the old "passes alone,
    flakes under full-suite load" note — likely because this sandbox's freshly-installed Chromium/
    Playwright build differs from whatever build was cached when that note was written. Left as a noted
    risk in `plat-008`'s `notes` field for a future session to look at with a real browser, not chased
    here since it's unrelated to this feature and reproduces on the pre-`plat-008` baseline too.
  - Pitfall: writing JSON/Markdown text containing backticks or `${...}` through `python3 -c "..."` inside
    a double-quoted Bash command is unsafe — bash expands `` `...` `` and `${...}` in the double-quoted
    argument before python ever sees it, silently corrupting any evidence text that quotes code containing
    template literals. Caught it this session by re-reading the written JSON back before moving on, and
    fixed it by writing the update as a standalone `.py` script file (via the `Write` tool, no shell
    interpolation involved) and running that instead. Do this for any generated text with backticks or
    `$` in it, or use the `Edit` tool directly for Markdown.
- Next best step: `xq-002` (Xiangqi game end) is unblocked now that `plat-008` is done — stalemate loss,
  idle-repetition draw, perpetual-check loss, perpetual-chase loss (ported from the Fairy-Stockfish
  chasing algorithm, not invented — flagged in the plan as the highest-risk engine task in the whole
  Xiangqi plan), 50-move rule, insufficient material.

### Session 012

- Date: 2026-09-17.
- Goal: `xq-002` (Xiangqi game end), Step 4 of `apps/xiangqi/docs/PLAN.md`.
- Baseline: `./init.sh` failed only on lint of an untracked leftover probe (`packages/xiangqi/probe4.mjs`,
  `console` undefined). The committed tree was green. The probe was moved out of the repo, not committed.
- `xq-002` is now `passing`.
  - Ported, not invented, from Fairy-Stockfish at `705dd366` (the last `position.cpp` commit before ffish
    0.7.10; `position.cpp` on master is still identical): `src/chase.ts` = `Position::chased()`,
    `src/gameEnd.ts` = `is_optional_game_end()` (50-move rule with the AXF check offset, threefold
    repetition judged perpetual check → perpetual chase → draw) + `has_insufficient_material()` + ffish's
    `result(true)` order, `src/bitboard.ts` = the bitboard helpers they read (BigInt square sets so the port
    reads line by line). `Game` keeps one StateInfo per ply and pops it on undo.
  - The previous session's untracked `chase.ts` draft was replaced: it skipped the pin, impaired-horse,
    fake-root and discovered-check branches, and wrongly never chased crossed soldiers.
  - `packages/xiangqi/RULES.md` (new): board, pieces, every game-end ruling, the chase algorithm branch by
    branch, named cases, lock-step coverage and tallies.
  - `src/gameEnd.test.ts` (new, 14 named tests), each also run on ffish (`isGameOver(true)`/`result(true)`).
    The local `docs/xiangqi-implementation-note.md` the feature's first verification bullet names is not in
    this environment (it was untracked), so its probes were re-derived and checked inside these tests.
  - `src/reference.test.ts` now compares the result on every ply, in three modes: random games (half
    repetition-biased), forced 8-ply quiet cycles, and cycles found by ffish alone (ffish tries every quiet
    move pair and keeps decisive cycles). The positive chase/check cases therefore come from the reference
    engine, not from the code under test.
  - Verification: `npm run verify` (whole repo) exit 0. `npm run test:deep -w packages/xiangqi`: 117/117 in 242s. Deep tallies: random games 91 checkmate, 3
    stalemate, 205 repetition, 1 perpetual check, 11 fifty-move, 8 insufficient material; forced cycles
    2689 repetition, 10 perpetual check, 2 perpetual chase; ffish-found cycles 190 perpetual chase, 71
    perpetual check. No disagreements. No Makruk or Sittuyin file touched, and no app imports
    `@chaturanga/xiangqi` yet, so no E2E applies.
  - Known limits: ffish only returns the result string, so lock-step can't tell perpetual-check from
    perpetual-chase (or repetition from fifty-move) when the result is the same; the named tests pin the kind.
    `Game.move()` now computes chase sets every ply; fine for play, but the `xq-003` bots should search on raw
    board ops, not `Game.move()`.
  - Pitfall: the Fairy-Stockfish source is fetchable in this sandbox
    (`raw.githubusercontent.com/fairy-stockfish/Fairy-Stockfish/705dd366f6/src/...`); read it before
    guessing any ffish ruling.
- Next best step: `xq-003` (Xiangqi bots and ladder), or `plat-009` (intersection boards) if bots should wait
  for a playable UI. `xq-003` is next by priority.

### Session 013

- Date: 2026-09-17 (same day as session 012, continued at the owner's request: "continue for next 4 hours and
  finish as many as u can").
- Push: blocked all session. The machine's GitHub credentials expired (`gh auth status`: failed to log in;
  the HTTPS remote has no credentials), so every commit below is local on `main`. The owner needs to run
  `gh auth login` and `git push origin main`.
- `xq-003` in_progress (only the GitHub Actions run is missing).
  - `packages/xiangqi-ai` is done: adapter, evaluation, six bots per D10, conversion mode and hints.
  - ai-core has an optional `SearchAdapter.repetitionScore` hook; Makruk and Sittuyin don't implement it, so
    they are unchanged.
  - An ai test exposed that a root move repeating a position was never searched further. For hooked adapters
    it is now searched and capped at the contempt draw.
  - Palace-first `findGeneral` made search about 40% faster.
  - The ladder runs locally as a bundled Node script: vitest's module transform makes the search about 4x
    slower. All five pairs pass over 20 games each: +20-0=0, +18-2=0, +18-2=0, +19-0=1, +14-2=4.
  - `strength.yml` now runs `npm run test:strength` for every package and lists `packages/xiangqi-ai`.
- `plat-009` passing.
  - board-ui gained `grid: 'points'` and `underlay`; `useFittedBoard` and the desktop width cap take an aspect ratio.
  - Visual check: Makruk and Sittuyin board screenshots are byte-identical before and after (captured twice
    each, with the change stashed and restored). Sittuyin full-page shots aren't stable run to run even with no
    change.
  - Makruk E2E 65/67: `clock.spec` is the known baseline failure; `computer.spec` "keeps animating" passed
    2/2 when re-run alone. Sittuyin E2E 34/34; both PWA suites 2/2.
- `plat-010` passing: family.test.ts and both apps' family.spec.ts loop over `familyLinks()` and name no
  sibling.
- `xq-004` in_progress, waiting for the owner.
  - Proposal "Mo" (ink + seal vermilion, maple board): `apps/xiangqi/docs/design.md`, screenshots in
    `apps/xiangqi/docs/evidence/`.
  - Piece characters are SVG outlines generated from Noto Serif TC Black (OFL, `npm run glyphs`), per D4.
- `xq-005` in_progress. Every verification step passes, but the site is styled on the unapproved design.
  - Covers pass-and-play, computer, PWA and zh-Hans/en.
  - E2E 16/16 at the time, PWA 2/2.
  - The AI worker rebuilds the whole game, so bots avoid losing perpetuals.
- `xq-006` passing: 13 lessons, every claim checked against the engine; learn.spec completes one lesson in each
  language.
- `xq-007` passing.
  - `apps/xiangqi/worker`: GameRoom/Matchmaker on xiangqi, D1 migration, placeholder database_id, no route.
  - workerd tests 10/10, including a 12-ply line from the start that the server scores as a perpetual chase
    and stores in D1.
  - Two-browser online E2E passes.
- `xq-010` in_progress. About page (zh-Hans/en, GitHub links; about.spec 1/1) and `apps/xiangqi/AGENTS.md`
  are done. SEO, sitemap, Open Graph image and README media all need the site address (D8).
- `xq-011` blocked: review sheet `apps/xiangqi/docs/i18n-review.md` is written; it needs a native Chinese
  reviewer.
- Final checks this session: `npm run verify` exit 0; Xiangqi E2E 23/23 with Worker; Xiangqi e2e:pwa 2/2;
  `npm run build:xiangqi` OK.
- Pitfalls:
  - Hand-made Xiangqi FENs are easy to get wrong: generals facing on an open file, or the side not to move in
    check. Parse them with `new Game(fen)` before using them in a test. Four fixtures this session failed for
    that reason.
  - `pkill -f <pattern>` kills the shell running it when the pattern appears in its own command line. Kill by
    PID from `pgrep` instead.
  - vitest hides console output from passing tests: write probe results to a file.
- Next best step:
  - **Owner:** push; approve or redirect the Mo design (xq-004); choose the Xiangqi subdomain (D8).
  - **Agent, after the push:** dispatch the Xiangqi ladder on Actions (xq-003). xq-008, xq-009 and the rest of
    xq-010 wait for the subdomain; xq-011 waits for a native reviewer.

### Session 014

- Date: 2026-09-18. The owner chose the Xiangqi subdomain (D8) and asked for the app to be live on the
  internet.
- `xq-003` passing. All five ladder pairs were dispatched on GitHub Actions for `packages/xiangqi-ai` and
  reproduced the local scores exactly, as the deterministic node budgets predict: +20-0=0, +18-2=0, +18-2=0,
  +19-0=1, +14-2=4 (runs 35294963037, 35294969487, 35294975629, 35294983079, 35294989782).
  - Pitfall: `gh` was signed in as a second account with no admin rights on the repository, and
    `gh workflow run` failed with `HTTP 403: Must have admin rights to Repository`. `gh auth switch --user
    socheek-del` fixes it.
- `xq-008` in progress; the site is live and everything but online play is verified.
  - The address is set only in `apps/xiangqi/web/site.config.ts` (override `XIANGQI_SITE_URL`) and the
    Worker's `routes`. D1 `xiangqi` created and its id committed. Root script `deploy:xiangqi`.
  - CI gained a `xiangqi` paths filter and a `deploy-xiangqi` job. A push touching only `apps/xiangqi`
    (run 35296012879) deployed Xiangqi alone and skipped the other two, which is what the filter promises.
  - New production smoke suite `apps/xiangqi/web/e2e-prod` + `playwright.prod.config.ts`: 7/8 against the
    live site. The one failure is `POST /api/guest` 500, because `AUTH_SECRET` is unset (owner action).
- `xq-009` passing. `packages/family` gained `xiangqi` and the `zh-Hans` family language; every game is named
  in all four languages. The Xiangqi app renders `MoreGames` as a home section and a footer. plat-010 held:
  no sibling app's spec needed an edit. After the deploy, `e2e-prod/family.spec.ts` checked all three live
  sites, 3/3.
  - Pitfall: in `MoreGames` a sibling is *named* in the visiting site's language always, but *linked* with
    `?lang=` only when it speaks that language. Conflating the two made the first production family check
    fail on every site.
- Verification this session: `./init.sh` clean at the start; `npm run verify` exit 0 after the family change;
  `npm run build:xiangqi` OK; Xiangqi, Makruk and Sittuyin `family.spec.ts` 1/1 each locally; production
  smoke 7/8 + family 3/3.
- Later in session 014, the owner set `AUTH_SECRET` and approved the "Mo" design.
  - `xq-008` passing. `npm run smoke:prod -w apps/xiangqi/web` 11/11, including `POST /api/guest` issuing a
    token, and `e2e-prod/online.spec.ts` played a room on the live Worker: a 5+0 room created, joined by code
    from a second browser, seats w and b, two moves reaching both boards with identical move lists, no chat.
  - `xq-004` passing. The approval covers the shipped defaults: maple board, Noto Serif TC Black piece
    outlines. Recorded in `apps/xiangqi/docs/design.md` and the four docs that called it unapproved.
  - `xq-005` passing. Re-verified after the family links joined the home page and shell: Xiangqi E2E 24/24,
    e2e:pwa 2/2.
- **Parallel session warning.** Session 015 (Shogi planning) ran in this same working tree at the same time
  and staged its files in the shared index, so `git status` mixed both sessions' work and a plain
  `git commit` from either one would have swept up the other's. It committed its own paths as `6394f16`; the
  Xiangqi work went in separately. Two sessions in one repository need separate git worktrees, or one must
  wait.
- `xq-010` README half done (the owner asked for the README). `apps/xiangqi/README.md` and
  `README.zh-Hans.md` follow the Sittuyin pair's shape, with the live address only in a `[play]` link
  definition at the bottom of each. New `apps/xiangqi/web/scripts/capture-readme.mjs`
  (`BASE_URL=<live site> npm run capture:readme -w apps/xiangqi/web`, needs ffmpeg and ImageMagick) captured
  `docs/media/{play-computer,online,lesson}.gif` and `mobile.png` from production; sampled frames of all
  three GIFs and the collage were reviewed and show no address bar, domain or room share link. The root
  README lists Xiangqi as live.
- Next best step:
  - **Owner:** `xq-011` needs a native Chinese reviewer. The Shogi plan (`6394f16`) proposes decisions
    D1-D12 that are still unconfirmed.
  - **Agent:** finish `xq-010` — the SEO half: per-language titles and descriptions, hreflang, canonical,
    JSON-LD, sitemap/robots from `SITE_URL`, and an Open Graph image. Xiangqi's OG image needs its CJK
    wordmark as outlines, because the app deliberately loads no CJK font (D9); `generate-glyphs.mjs` shows
    how to fetch outlines for named characters.

### Session 015 (planning only, parallel session)

Planning session for the fourth product, **Shogi (将棋)**, run alongside another session that was finishing
Xiangqi (`xq-008`, `xq-009`). No code was written and no other game's files were touched; every shared file
was appended to, not rewritten.

- `apps/shogi/docs/PLAN.md` written: proposed owner decisions D1-D12, architecture, the platform gap analysis,
  a 14-step work breakdown, the Japanese terminology table and the risks.
- `feature_list.json`: 14 features appended (76 to 90) — `plat-011..013` (M14 platform prep) and
  `sg-001..011` (M14-M15 Shogi). All `not_started`, none marked done, nothing existing edited except the
  header's project line and `last_updated`.
- `docs/PLATFORM.md` and the root `AGENTS.md` now name Shogi as the fourth game and point at its plan.
- Rules reference probed with ffish 0.7.10 (Fairy-Stockfish `shogi`), so the engine step starts from facts:
  - start FEN `lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL[] w - - 0 1`, 30 legal moves.
  - promotion is a `+` suffix on the move (`g8g9+`, SAN `Pxg9=G`); a pawn to the last rank is offered *only*
    as the promoting move, so forced promotion falls out of move generation.
  - drops are `S@a2`, the notation `rules-core` already documents.
  - nifu is enforced by the reference: with a pawn in hand and a pawn on every file, 0 pawn drops.
  - promoted pieces are written `+P` — a two-character square, which breaks the one-letter-per-square
    assumption the three live engines share. Shogi writes its own FEN reader and writer.
- Platform seams found by reading the code, each with a feature:
  - `useMoveInput.play()` discards an optional promotion ("no supported game has both today") → `plat-011`.
  - hands are modelled as a setup phase (`KEYS.md`: `play.placing` when `hasHands`) → `plat-012`.
  - `BoardProps.showCoordinates` is a boolean and the labels are generated inside board-ui; Shogi needs
    9→1 and 一→九 → `plat-013`.
  - `FamilyLanguage` is a closed union, so `ja` means a Japanese name for every game → `sg-009`.
  - already generic, checked not assumed: `hand()` + `HandTray` counts, drop notation through the protocol,
    `SearchAdapter` and its `repetitionScore` hook, `server-kit`, `plat-008`, `plat-010`.
- Nothing is verified beyond the ffish probe, because nothing was implemented. No feature changed state.
- Next best step:
  - **Owner:** confirm or redirect the Shogi decisions D1-D12, especially D7 (design identity) and D8 (the
    subdomain). D11 (the 27-point impasse rule) is settled by a probe in `sg-002`, not by preference.
  - **Agent:** Xiangqi first — `xq-008` and `xq-010` are still open in the parallel session. Then start
    `plat-011`, which is the smallest of the three prep features and unblocks the Shogi app step.

### Session 016 (Makruk piece art, parallel session)

- Date: 2026-09-18
- Goal (owner request): the stylised Makruk pieces confuse some players — add a piece set that looks like a
  real Thai set.
- Done: `art-003` **passing**.
  - `apps/makruk/web/src/features/board/pieces/traditional.tsx`: a third set, "ไม้แกะแบบดั้งเดิม" /
    "Traditional wood". Each piece is the lathe-turned side profile of the physical piece — chedi Khun with a
    finial, round lotus-bud Met, blunt flared Khon (no spire, so it never reads as a Khun), carved Ma head,
    cleft Ruea hull, cowrie Bia — over a wood gradient with collar rings and a cast shadow. A promoted Bia is
    the cowrie turned over, showing its toothed aperture, as on a real board.
  - Gradient ids come from `useId()` (with `:` stripped, invalid in `url()`), so the 32 pieces on a board do
    not share one another's gradients.
  - Registered in `PIECE_SETS`; `th`/`en` names added; `apps/makruk/docs/design.md` records the three sets.
  - The default is still `classic` — nothing changes for existing players until they pick the new set.
- Verified: `art.spec.ts` 4 passed (theme-002 now asserts 3 sets × 7 preview SVGs; art-003 checks persistence,
  all 12 crafted squares at 360px and 32 pieces in a new game); `typecheck` clean; `test -w apps/makruk/web`
  108 passed; eslint clean on the changed paths; `./init.sh` green before the work started.
- Evidence screenshots (gitignored): `apps/makruk/web/e2e-evidence/{settings-pieces,traditional-360,board-traditional}.png`.
- Not touched: the Xiangqi `xq-010` work in progress in this same tree (`apps/xiangqi/web/package.json`,
  `scripts/capture-readme.mjs`) was left uncommitted for that session.
- Owner decision 2026-09-18: the traditional set stays an option in settings only (default stays `classic`),
  and the Thai name "ไม้แกะแบบดั้งเดิม" is confirmed. No code change followed — both were already true.
- Owner follow-up 2026-09-18: the set must look as close to real pieces as the design principles allow, so it
  was redrawn from a reference photograph of a physical Thai set (Wikimedia Commons, `Category:Makruk pieces`,
  `Piezas del makruk.png`). The Chrome extension was not connected, so the reference was opened with the
  repo's own Playwright chromium and the six silhouettes were measured by pixel analysis (flood fill on the
  wood-coloured pixels, then per-row widths). Measured sizes in px: Khun 53x92, Ma 56x114, Khon 44x73,
  Met 35x73, Ruea 51x55, Bia 41x30 — so Met and Khon are the same height, the Bia is a flat puck, and the Ma
  is the tallest piece. The raw rows could not be used directly (the photo is a 3/4 view, so every base read
  as a cylinder); the profiles were re-authored from the measured proportions instead.
- How the art is built now: each turned piece is generated from a lathe profile ([half-width, y] from the
  foot up) by `turned()`, with corner-aware smoothing so a disc edge stays sharp and a cap stays round;
  grooves are placed by height and get their width from the profile; a depth gradient darkens the foot. Ma is
  a hand-drawn carving. The whole set is scaled 1.12x about the ground line to fill the square.
- Next best step:
  - **Agent:** `xq-010`, then `plat-011`.
