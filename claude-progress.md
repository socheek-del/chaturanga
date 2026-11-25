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
- Owner second follow-up 2026-09-18: the photo-realistic version was still too sleek. The owner supplied the
  set they mean — the classic flat Makruk piece art — and asked for that language. The set is now flat: one
  fill plus a carved line, no gradients and no 3D shading. Sizes measured from that reference (percent of a
  square): Khun 50x81, Ma 50x81, Khon 41x70, Met 28x48, Ruea 66x50 (widest, lowest), Bia a 53-wide disc of
  concentric rings — a Bia lies on the board, so it is drawn from above, which is the single biggest change.
- Owner third follow-up 2026-09-18: "make the pieces the exact same as the original. No tweaking of any
  sort." So the set is no longer a redrawing at all — it is the original art. The 14 files (7 pieces x 2
  colours, including Bia Ngai for a promoted Bia) are Yevrowl's Makruk pieces from Wikimedia Commons,
  **CC BY-SA 4.0**, downloaded verbatim by `apps/makruk/web/scripts/import-traditional-pieces.mjs` into
  `src/features/board/pieces/traditional/` next to `CREDITS.md`. This is the one exception to "all art is
  made in-house", and it carries obligations: attribution travels with the art (now on the About page in th
  and en) and any modified version of the art stays CC BY-SA 4.0. CC BY-SA 4.0 is one-way compatible with
  GPL-3.0, so it can ship inside this repo.
- Rendering: each piece is two files stacked — the "black" file is the filled silhouette, the "white" file
  the carved line art — with colours supplied at render time (bone body + dark cuts, or near-black body +
  pale cuts). The pale cuts are masked to the silhouette so they do not halo it. Chromium ignores `mask` on
  a nested `<svg>`, so the mask goes on a wrapping `<g>`; that cost an hour and is worth remembering.
- Superseded: the in-house redraws (the photo-realistic one and the flat one) are gone from the product.
  Their lathe-profile generator lives only in git history (`b8f7eca`, `29af7f1`).
- How the earlier in-house art was built: the four turned pieces are generated from lathe profiles ([half-width, y] from
  the plinth up) by `turned()`, with corner-aware smoothing so a plinth edge stays sharp and a body stays
  round; the turning lines are clipped to the silhouette so they read as cuts. Ma is a hand-drawn carving.
  The pale side is bone with dark cuts, the dark side near-black with pale cuts so it survives the dark
  board themes.
- Next best step:
  - **Agent:** `xq-010`, then `plat-011`.

### Session 017 (Shogi, built and deployed)

Implemented the Shogi plan written in session 015. The site is live and every feature but two is `passing`.

- **Platform prep (`plat-011`, `plat-012`, `plat-013`, all passing).** board-ui's move input now holds a move
  whose from-to pair has both a promoting and a plain version and asks the player (GameScreen renders the
  prompt with the product's own art); the shared parser learned the `+` suffix. `Variant.hasSetupPhase`
  (optional, defaulting to `hasHands`) separates Sittuyin's setup from hands that fill from captures, so a
  Shogi game runs its clocks from ply 1 and keeps both piece stands on screen. `Board` takes `fileLabels` and
  `rankLabels`. No other game's files changed; Makruk, Sittuyin and Xiangqi tests are untouched and green.
- **`sg-001`, `sg-002` passing.** `packages/shogi`: 9x9, hands, drops, optional and forced promotion, nifu,
  uchifuzume, checkmate, losing stalemate, sennichite with the perpetual-check exception. 127 tests: perft
  over 13 positions, 60 lock-step random games and 200 forced repetition cycles against ffish comparing legal
  moves, SAN, FEN and the result every ply.
  - **Divergence found and kept:** Fairy-Stockfish's `shogi` variant does **not** implement uchifuzume — it
    played a mating pawn drop and scored it. This engine forbids it, exposes `Game.uchifuzumeUci()`, and keeps
    a Fairy-Stockfish-compatible mode so the comparison tests still pin every other difference. It also does
    not adjudicate impasse, and neither does Fairy-Stockfish (decision D11 settled by probe). Both are in
    `packages/shogi/RULES.md`.
  - Two bugs the reference test caught: the halfmove counter resets on a capture, a drop and a promotion but
    not on a plain pawn move; SAN disambiguates by the letter a piece prints (a gold, a promoted silver and a
    promoted pawn all print `G`), not by the piece.
- **`sg-003` in_progress.** `packages/shogi-ai`: six bots on ai-core, material including hands, drops ordered
  last and out of quiescence. Ladder locally: L2 beats L1 6-0, L3 beats L2 5-1, L4 beats L3 5-1, L5 beats L4
  10-0. L6 vs L5 is slow (about 5 minutes a game) and was still running at the end of the session — that pair
  is all that stands between this feature and `passing`.
- **`sg-004` in_progress (owner gate).** "Kaya" (榧): torreya wood, indigo controls, vermilion only for a
  promoted face; five-sided tiles with SVG kanji outlines, turned 180° for the far player. Screenshots in
  `apps/shogi/docs/evidence/`. The live site is styled on it while it waits for approval.
- **`sg-005`, `sg-006`, `sg-007`, `sg-009`, `sg-010` passing.** The app (e2e 23/23, PWA 2/2), 15 lessons,
  online rooms (workerd 10/10, two-browser e2e), the family links (all four sites), and SEO with an Open
  Graph image and both READMEs.
- **`sg-008` passing — the site is live.** D1 `shogi` created and migrated, `AUTH_SECRET` set, Worker
  deployed on its own subdomain, CI given a `shogi` filter and a `deploy-shogi` job. Production smoke 13/13,
  including a two-browser online game on the live Worker and the family links across all four live sites.
- **`sg-011` blocked**, as expected: `apps/shogi/docs/i18n-review.md` needs a native Japanese reviewer.
- Pitfalls worth remembering:
  - A hand-made Shogi FEN is invalid when a rook or lance shares a file with the enemy king — the side not to
    move ends up in check. Three fixtures failed that way before being parsed with `new Game(fen)` first.
  - `+P` makes a square two characters; anything that assumes one letter per square breaks.
  - The bishop on b2 has no legal move at all from the start position.
- Next best step:
  - **Owner:** approve or redirect the Kaya design (`sg-004`); find a native Japanese reviewer (`sg-011`).
  - **Agent:** finish the L6-vs-L5 ladder and record it, which moves `sg-003` to passing.

### Session 018 (chess planning only)

- Date: 2026-09-18
- Goal: plan international chess as the fifth product. No implementation.
- Done:
  - `apps/chess/docs/PLAN.md`: proposed owner decisions D1-D12, architecture, an ffish 0.7.10 probe of the
    `chess` variant, the gap analysis against the platform, a 12-step work breakdown and the risks.
  - `feature_list.json`: 12 new features, all `not_started` except `ch-011` (blocked on owner decision D1) —
    `plat-014` (promotion with a choice of pieces) and `ch-001..ch-011`, milestones M16-M17, priorities 91-102.
  - `docs/PLATFORM.md` and `AGENTS.md` record chess as the fifth game and its open owner decisions.
- Probe evidence (ffish 0.7.10, variant `chess`, run 2026-09-18): castling is `e1g1` / `e1c1` with SAN
  `O-O` / `O-O-O`; promotion is four moves on one from-to pair (`e7e8q,e7e8r,e7e8b,e7e8n`); en passant is
  `e5d6` (`exd6`) onto an empty square; stalemate and insufficient material end the game on their own, while
  threefold and the fifty-move rule report `*` unless `claimDraw` is true.
- Only real platform gap found: `useMoveInput` splits promotions into one plain and one promoting move, so
  four chess promotions would silently auto-queen. That is `plat-014`.
- Not done, on purpose: no code, no `packages/chess`, no `apps/chess/web`. A parallel Shogi session was
  working in the same tree during this session (it committed `ae80b7f` while this ran); `plat-014` touches
  `packages/board-ui/src/useMoveInput.ts` and `packages/game-shell/src/ui/GameScreen.tsx`, so it must not be
  started until that session's work is committed.
- Next best step:
  - **Owner:** confirm D1 (English only at launch), D7 (design identity gate) and D11 (threefold and
    fifty-move end the game automatically).
  - **Agent:** finish the open Shogi features (`sg-003`, `sg-004`), then `plat-014`, then `ch-001`.

### Session 019 (chess, built and deployed)

- Date: 2026-09-18
- Goal: execute `apps/chess/docs/PLAN.md` and put the site on the internet.
- Owner decisions taken at the start: D1 English only, D8 `chess.beanroti.com`, D11 threefold and the
  fifty-move rule end the game automatically, D7 propose-then-ship for the design identity.
- Done and verified:
  - `plat-014` — `useMoveInput` holds every way a from-to pair can be played and plays one by its move
    string; `GameScreen` renders the yes/no prompt for Shogi and one button per piece for chess. 37 board-ui
    and 42 game-shell tests pass.
  - `ch-001`, `ch-002` — `packages/chess`, proven against ffish 0.7.10: the full standard perft suite
    (start position depth 5 = 4,865,609; Kiwipete depth 4; positions 3-6), 60 lock-step random games from
    four openings comparing legal moves, SAN, FEN and the result on every ply, and the ten
    insufficient-material cases. `packages/chess/RULES.md` records the two probed behaviours that are not
    obvious: draws are not claimed here (D11), and the en passant square is written into a FEN whenever an
    enemy pawn attacks it, even when the capture would be illegal.
  - `ch-004` — the "Marble" identity, its own Staunton set drawn as SVG paths, screenshots in
    `apps/chess/docs/evidence/`. **Owner approval still outstanding.**
  - `ch-005`, `ch-006`, `ch-007` — the web app (86 unit tests, 23 Playwright tests), 16 lessons (80 tests),
    and online play on its own Worker (10 workerd tests plus a two-browser room).
  - `ch-008` — live on `chess.beanroti.com`: Worker `chess`, D1 `chess`, custom domain.
    `npm run smoke:prod -w apps/chess/web` is 13/13 against the live site, including two browsers playing
    a game through the deployed Worker.
  - `ch-009` — chess joined the family list, and all four sibling sites were rebuilt and redeployed so
    their "more games" sections include it. The live family check passes for all five sites.
  - `ch-010` — SEO tags, sitemap, Open Graph image, PWA icons, `apps/chess/README.md`,
    `apps/chess/AGENTS.md`, and the root README now lists five games.
  - `ch-003` — the bot ladder finished: L2>L1 +7-1=0, L3>L2 +7-1=0, L4>L3 +8-0=0, L5>L4 +8-0=0,
    L6>L5 +5-0=3. The script exited 0, so every level wins its pair.
- Still open:
  - `ch-004` needs the owner to approve or change the identity.
  - `ch-011` (a second site language) is blocked on the owner naming one.
- Next best step:
  - **Agent:** `sg-003` / `sg-004` for Shogi, the last unfinished features besides the owner gates.
  - **Owner:** approve the chess design identity, and decide whether chess gets a second language.


### Session 020

- Date: 2026-09-21
- Goal: finish `sg-003`, the last agent-actionable feature (session 019's next step).
- Baseline on entry: working tree clean, `./init.sh` exit 0, 8 commits on local `main` not yet pushed.
- `sg-003` is now `passing`. The two heavy ladder pairs had been left running in the background at the end
  of the previous session; both finished with exit code 0.
  - Final ladder, all five pairs, under the budgets committed in `packages/shogi-ai/src/bots.ts`:
    L2 keima > L1 fu +6-0=0 (6 games), L3 gin > L2 keima +5-1=0 (6), L4 kin > L3 gin +5-1=0 (6),
    L5 kaku > L4 kin +8-0=0 (8), L6 hisha > L5 kaku +6-2=0 (8). Every game ended in checkmate.
  - The first attempt at pair 5 had failed, and the fix is recorded rather than hidden: with L6 at
    `maxNodes` 900,000 and L5 at 500,000 the pair was +3-3=0, so the budgets were retuned (L5 down to
    400,000, L6 up to 3,000,000) and both heavy pairs were replayed from scratch. `strength-games.log`
    stores the bot signature with every game, which is how the failing run and the passing run were told
    apart — the log is gitignored, so the numbers live in `feature_list.json`.
  - Owner decision this session: accept the local 8-game runs for pairs 4 and 5 instead of the 20-game
    Actions ladder the old note planned. An L6-L5 game takes about 1,400 s here, so 20 games a pair is
    roughly 8 h of compute, and dispatching `strength.yml` would have required pushing the 8 waiting
    commits (which deploy the products they touch). `strength.yml` already lists `packages/shogi-ai`, so a
    wider ladder needs no code change later.
- Also corrected the stale `project` line in `feature_list.json`: chess is live, not planned.
- Nothing else in `feature_list.json` is agent-actionable. Every remaining item waits on a person:
  `sg-004` (Kaya design approval) and `ch-004` follow-ups, `polish-002` (Thai), `sit-011` (Burmese),
  `xq-011` (Chinese), `sg-011` (Japanese) reviews, `ch-011` (a second chess language), and
  `acct-002`/`acct-003` (deferred by the owner).
- Next best step:
  - **Owner:** approve or redirect the Shogi "Kaya" design (`sg-004`) and the chess "Marble" design
    (`ch-004` evidence); name a second chess language (`ch-011`); find native reviewers for the four
    translation reviews; decide whether to push the 8 waiting commits, which redeploy the touched products.
  - **Agent:** nothing is unblocked. If the owner wants the wider Shogi ladder, push and dispatch
    `strength.yml` for `packages/shogi-ai` pairs 4 and 5.

### Session 021

- Date: 2026-09-26
- Goal: owner request, an attack-map switch in every game (`plat-015`).
- Baseline on entry: working tree clean, `./init.sh` exit 0.
- Owner answers before building: red is every square the opponent attacks, green is every square the
  player attacks, a square in both is split, and the switch is allowed everywhere, online included.
- `plat-015` is `passing`:
  - `VariantGame.attackedSquares(color)` in all five engines, checked by the rules-core conformance suite
    and by spot tests per engine. Xiangqi needed its own scan (`attackedPoints`), because its check test
    skips advisors, elephants and general steps.
  - `board-ui` draws the tints (a ring over the art for a piece on a points board), `game-shell` shows the
    switch and legend, and each app remembers `showAttackMap` in its settings.
- Known issue found, not caused by this work: `e2e/family.spec.ts` fails in makruk, sittuyin, xiangqi and
  shogi, because the link name 'Chess' now matches several siblings. It fails the same with the change
  stashed. Online and clock specs failed once under parallel load and passed when re-run serially.
- Not pushed: pushing to `main` redeploys every product, so that stays the owner's call (the earlier
  unpushed commits are still waiting too).
- Next best step:
  - **Agent:** fix the `family.spec.ts` locator (exact link names).
  - **Owner:** try the switch, then push to deploy. The native reviewers should also check the new
    `play.attackMap*` strings.

### Session 022 (chess game review, branch `feat/chess-review`)

- Date: 2026-09-26
- Goal: owner request — a chess.com-style game review with Duolingo-like simplicity, and every game saved in
  the browser so it can be reviewed later. Owner choices this session: Stockfish lite WASM as the judge;
  the full chess.com label set (Brilliant, Great, Best, Excellent, Good, Book, Inaccuracy, Mistake, Miss,
  Blunder); accuracy, eval bar and graph, best-move arrow and line (no plain-words coaching beyond one
  sentence per label); games from the computer, pass-and-play and online; PGN export and import.
- Worked in a git worktree (`../t-chess-review`, branch `feat/chess-review`) because another session was
  running in the main checkout. Baseline on entry: `./init.sh` exit 0.
- Added `ch-014`, `ch-015`, `ch-016` (renumbered from ch-013..015 at merge time: session 021 had planned `ch-013` as chess puzzles) to `feature_list.json`; all three are `passing` with evidence there.
  - `ch-014`: PGN in `@chaturanga/chess`; `stores/history.ts` + `stores/recording.ts`; Games page.
  - `ch-015`: Stockfish 19 lite single in `public/engine/` (imported verbatim from the npm tarball, checked
    against the registry's integrity hash); `features/review/{uci,engine,analysis,openings}.ts`;
    `stores/analysis.ts` stores engine output per position, labels are computed on load.
  - `ch-016`: `pages/ReviewPage.tsx` and `features/review/components.tsx`; the shared `GameOverModal` and
    `GameScreen` gained an optional `review` action (additive; other products do not pass it).
- Two labelling bugs were found by looking at real games, and fixed with tests: a named trap (Fool's Mate
  is in the lichess list) was labelled Book, and a piece already hanging before the move counted as a
  sacrifice. Great and Brilliant were then tuned on the Opera Game, the Evergreen Game and a GM game (Great
  needs a 15-point gap in an undecided position; a sacrifice that forces mate is Brilliant).
- Verification: `npm run verify` exit 0; chess Playwright 32 passed; PWA suite: the new offline review case
  passes.
- Known issue, not from this work: `e2e-pwa/offline.spec.ts` "the app is installable" fails on `main` too —
  it expects manifest `lang: 'ja'` (copied from Shogi) while chess declares `en`.
- Merged and deployed (owner go-ahead): rebased onto `origin/main` as one commit `ae7913e`, verify and chess
  e2e (33) green again, pushed; CI green and redeployed the four sibling sites (shared `game-shell`
  changed). Chess has no CI deploy job, so it was deployed by hand with `npm run deploy:chess` (version
  eead9d75-c2dd-477c-ab7a-4094901c2fe8). `npm run smoke:prod -w apps/chess/web` 14 passed, including a new
  `e2e-prod/review.spec.ts` that reviews a game on the live site.
- Note for the next session: CI does not deploy chess on push; `npm run deploy:chess` is still manual.
- Next best step: owner tries the review on a phone (analysis speed on a slow device is the open question;
  `REVIEW_LIMITS` in `features/review/engine.ts` is the knob); consider a `deploy-chess` CI job.

### Session 023 (Makruk game review on a shared layer, branch `feat/shared-review`)

- Date: 2026-09-27
- Goal: owner request — the chess game review for Makruk too. Owner choices: Fairy-Stockfish WASM as the
  judge, extract the review into shared packages rather than copy it, Thai drafted by the agent and marked
  for native review, and all three parts (saved games, PGN, review).
- Worked in a new worktree (`../t-chess-review2`, branch `feat/shared-review` from `origin/main`).
- `plat-017` passing: PGN moved to `rules-core` for any variant; history, recorder, analysis store, UCI
  engine client (worker and Emscripten-module transports), label maths (`ReviewRules`), and the Games and
  Review screens moved to `game-shell`; chess supplies a `ReviewKit` and thin pages, behaviour unchanged
  (e2e 33). KEYS.md lists the review keys and `--grade-*`/`--eval-*` tokens.
- `review-001`, `review-002` passing for Makruk: saved games, PGN with `[Variant "makruk"]`,
  Fairy-Stockfish review. **The Makruk site is now cross-origin isolated** (COOP/COEP) because the engine
  uses threads; anything later loaded from another origin needs a CORP header. No opening book (none public).
- Two pre-existing test bugs fixed on the way: chess PWA expected manifest `lang: 'ja'`; Makruk
  `family.spec` matched "Chess" inside other game names (now `exact: true`).
- Verification: `npm run verify` exit 0; chess e2e 33, Makruk e2e 74, Makruk PWA 3, chess PWA 3 passed.
- Open: native Thai review of the new strings (polish-002); production isolation headers must be checked on
  the live site after deploy (the `_headers` file is the Cloudflare static-assets mechanism).
- Deployed: CI green on `dde7e46` (Makruk and siblings); chess by hand (version 7f8a609d). Live checks:
  chess `smoke:prod` 14 passed; new Makruk `smoke:prod` 2 passed (isolation headers live, engine served,
  review works). Remaining open item: native Thai review of the new strings (polish-002).

### Session 024 (board flicker on phones vs the computer)

- Bug (owner report): on a phone, every turn switch against the computer made the board and the player bars
  shrink and grow. Reproduced at 390x664 in chess: the board went 329px -> 301px -> 329px each turn. Cause: the
  "thinking…" line was mounted only on the bot's turn, and `useFittedBoard` sizes the board to the height left
  in the column. Local play was stable.
- Fix: every `ComputerGamePage` (chess, makruk, shogi, sittuyin, xiangqi) keeps the line mounted and hides it
  with `invisible` + `aria-hidden` while idle, so its space is always reserved.
- Regression test: chess `e2e/mobile.spec.ts` "the board keeps its size while the computer thinks on a phone"
  records the board width every frame across a bot reply; it fails without the fix (`[329, 301]`) and passes
  with it. Makruk's e2e now expects the idle line to be hidden rather than absent.
- Verification: `npm run verify` exit 0; chess mobile + computer e2e 5 passed; makruk/shogi/sittuyin/xiangqi
  computer e2e all passed.
- Deployed: CI green on `a1eb86a` (the other four sites); chess by hand (version 4693c4b1), chess `smoke:prod` 14 passed.

### Session 025 (in-app feedback through feedback-hub, branch `feat/feedback-hub`)

- Goal (owner request): let anyone send a problem or idea from any game; reports become GitHub issues that
  agents can work through.
- Built outside this repo: `~/githubrepos/feedback-hub` (Cloudflare Worker + D1 + GitHub App, drop-in widget,
  `/feedback` Claude Code skill). Public reports land `untriaged`; the owner's land `agent-ready`.
- Here (plat-018): shared `FeedbackLink` in `@chaturanga/game-shell/ui`, one line in each AppShell, `feedback.*`
  strings in all 9 locale files, KEYS.md updated. The sites are cross-origin isolated (COEP), so the widget
  cannot frame the bot check; public users finish on the hub's `/report` page in a new tab. The hub serves
  `widget.js` with `Cross-Origin-Resource-Policy: cross-origin` so COEP pages can load it.
- Localhost loads nothing by default, so e2e and offline tests are unchanged. To try it locally set
  `localStorage['feedback-hub:dev'] = 'http://localhost:8788'` and run the hub with `wrangler dev --port 8788`.
- Verification: `./init.sh` exit 0 (includes 4 new game-shell tests). Manual Chrome check against a local hub
  (see plat-018 evidence). E2E not re-run: the link never renders on localhost.
- Open: deploy the hub, then `npm run project -- add chaturanga socheek-del/chaturanga https://th-chess.beanroti.com https://my-chess.beanroti.com https://cn-chess.beanroti.com https://jp-chess.beanroti.com https://chess.beanroti.com --remote`
  in feedback-hub; native review of the new th/my/zh-Hans/ja strings. Not pushed: `main` auto-deploys.

### Session 026 (Card Chess: chess moves decided by Uno cards)

- Date: 2026-11-11
- Goal (owner request): a standalone Uno module with an engine portable to other domains, and an option in
  chess where the Uno card a player plays dictates the moves they may make; playful animations; design is an
  experiment (Mobbin consulted for card-hand patterns: fanned hands with a raised selection, stacked decks).
  Owner said to push and deploy on `main`.
- `uno-001` passing: `packages/uno` (`@chaturanga/uno`), a pure seeded Uno state machine with no chess in it
  (README in the package). Added to the engine-purity lint list.
- `cards-001` passing: Card Chess at `/play/cards` on the chess site, linked from the home page and the
  sitemap. Rules, bot, store and screen in `apps/chess/web/src/features/cards/` (documented in
  `apps/chess/AGENTS.md`). Decisions made by the agent, open for the owner to change:
  - colour → pieces: red queen/rooks, blue bishops, green knights, yellow pawns; the king moves with any card;
    a wild moves any piece and names the next colour.
  - two-player Uno law: Skip and Reverse give another move; Draw Two / Wild Draw Four also make the opponent
    draw. An extra move is a null move in the FEN and is cancelled when the move gives check.
  - every capture makes the other side draw one card; win by checkmate or by playing the last card.
  - stuck: draw one, then pass; in check: keep drawing (a free move only if both decks are empty).
  - visible name "Card Chess"; Uno is named only to describe the rules, and the card art is the site's own
    (trademark caution, as with the Duolingo decision).
  - no online mode yet: hidden hands need the server to deal.
- Verification: `packages/uno` 22 tests; chess `rules.test.ts` 17 tests; `e2e/cards.spec.ts` 9 passed;
  screenshots at 390x844 light and 1280x860 dark reviewed (deal, selection glow, Skip/+2 bursts, colour
  picker, win dialog with confetti). `npm run verify` exit 0; full chess e2e 43 passed; chess PWA e2e 3 passed.
- Baseline note: `./init.sh` failed once on a Makruk web engine test (`process.exit unexpectedly called with
  "0"` from the Fairy-Stockfish worker); the same error failed CI verify on `main` on 2026-09-29 and on the
  Card Chess push. Cause: Emscripten's threaded build calls `process.exit(0)` once its workers stop, and
  vitest forbids `process.exit`. Fixed in the test transport (`apps/makruk/web/src/features/review/engine.test.ts`):
  the clean exit is swallowed after the file's last test; any non-zero code still fails. 8/8 local runs pass.
- Deployed: pushed `af3646f` to `main`; `npm run deploy:chess` (version 380350ab); chess `smoke:prod` 14 passed;
  live check: home → Card Chess → deal shows 7 + 7 cards, sitemap lists `/play/cards`, no page errors.
- Open: owner review of the Card Chess rules and look; an online mode (server-dealt hidden hands); a `deploy-chess`
  CI job (chess still deploys by hand).

### Session 027 (Janggi, branch `feat/janggi`)

- Date: 2026-11-23
- Goal (owner request): Janggi, Korean chess, as the sixth product on a new subdomain, deployed.
- Baseline: `./init.sh` failed under the machine's Node 25 (its built-in `localStorage` breaks happy-dom tests:
  makruk-web and game-shell). nvm is not installed here; under Node 22.23.1 (`.nvmrc`) the same suites pass.
- Added `plat-019` and `jg-001..011` (states and evidence in `feature_list.json`), packages `janggi` and
  `janggi-ai`, apps `janggi/web` and `janggi/worker`, a CI deploy job.
- Decisions for the owner to confirm: `apps/janggi/docs/PLAN.md` (D1-D6).
- Verification: `npm run verify` exit 0; Janggi deep engine run 87 passed; Janggi e2e 31, PWA 2; production smoke
  10/10 of the Janggi checks. Playwright ran on a newer cached Chromium than the pinned build.
- Deployed by hand: D1 `janggi` (9c5a083d-6e82-4577-96bb-f45661865ca9), AUTH_SECRET set, version 2b6e2dfd.
- Open: merge to `main` (redeploys the siblings with the Janggi link and starts CI deploys; deploy chess by hand);
  finish the L6-L5 ladder; register the new origin with feedback-hub (`project add`), so its feedback link works;
  owner approval of the design; native Korean review; saved games and review for Janggi.
- Known, not from this work: `apps/xiangqi/web/e2e/family.spec.ts` fails on the "Chess" link (substring match; it
  needs `exact: true` as Makruk has). Left alone: a game's work does not edit another game's files.

### Session 028 (Beanroti directory identity)

- Date: 2026-11-24
- Owner request: give the directory a distinctive indie app identity, push and deploy.
- Cobalt and lime masthead, bean mark, responsive catalog grid, and matching 404 page. The catalog uses the live
  registry snapshot. The separate local registry update for Three-player Chess is outside this release.
- Browser smoke passed at 1360px light, 390px dark and 320px light, including the app count, search, slash and
  Escape shortcuts, Enter launch, sign-in label, icon fallback, 404 return link and horizontal fit. Reviewed
  desktop and mobile screenshots. The Cloudflare bundle dry run passed.
- Startup in the mixed working tree hit a pre-existing lock mismatch for the Vite React plugin. The Beanroti
  commit includes only the directory workspace entries and scripts.

### Session 029 (Three-player chess)

- Date: 2026-11-24
- Owner request: build Three-player chess from the Wikipedia overview, work on `main`, publish it, and add it
  to `app.beanroti.com`.
- The reference describes a family of variants, so this product documents its selected rules as Chaturanga
  Ring in `apps/threechess/docs/PLAN.md` and `packages/threechess/RULES.md`: 8 files × 12 ranks, three
  clockwise seats, checkmate elimination, pass on stalemate, last king wins. V1 is English pass-and-play.
- Implemented `plat-020`, `packages/threechess`, its own web PWA and Worker, a family entry, SEO/PWA assets,
  and the app directory catalog entry at `apps/beanroti/web/public/apps.json`. Updated repo docs and CI build
  and deploy jobs.
- Verification: `NODE_OPTIONS=--no-experimental-webstorage npm run verify` passed across the whole repo
  (Worker suites needed local bind/log access). Three-player web unit tests passed; Playwright e2e passed 3/3
  in installed Chrome. `npm run build:threechess`, `npm run build:beanroti-apps` and `npm run build:chess`
  all passed. The app's rules suite passed 22/22.
- Startup limitation: `./init.sh` could not install from npm because the registry resolved to `ENOTFOUND`;
  this machine has Node 25 rather than the pinned Node 22, so verification used the web-storage workaround.
- Deployment blocker: Cloudflare rejected `wrangler d1 create threechess` because the account has reached its
  10-database limit. The repo requires each game's own Worker and D1. No existing database was reused and no
  paid plan was changed. The catalog entry is in source but is not published while its game URL is offline.
- `tpc-001`, `tpc-002` and `plat-020` are passing in `feature_list.json`; `tpc-003` is blocked on dedicated D1
  capacity and production deploy. Do not push yet: main's CI deploy job will try this Worker, and the catalog
  would link to an unavailable site. After D1 capacity is resolved, update the ID, push `main`, deploy the
  game and catalog, and run a production smoke check.

### Session 030 (Three-player chess launch)

- Owner approved launching v1 on the existing Cloudflare plan with browser storage. Removed the unused D1
  binding and migration, then deployed the game and the Beanroti catalog entry.
- Chrome e2e passed 3/3. Public DNS resolved the game, its homepage and health endpoint responded over HTTPS,
  and the live catalog JSON returned the enabled listing. Worker versions are recorded under tpc-003.
- Regenerated the workspace lockfile to fix the missing Vite React plugin entry reported by npm ci.

### Session 031 (Three-player chess on hexagonal cells)

- Owner selected the hexagonal-cell category from the Wikipedia article. Replaced the ring with an original
  91-cell regular hexagon and three rotated home edges. The rules now use axial movement and promotion at
  the far boundary. The ring and hex save keys are separate.
- Engine suite and Variant conformance passed 19/19. Web unit tests passed 2/2 and Chrome e2e passed 3/3
  for turn order, persistence, takeback and mobile layout.
- The production build and Worker deploy passed. Public DNS and HTTPS smoke checks confirmed the hex game
  (version 5a47d737), and the live Beanroti catalog confirmed the updated listing.

### Session 032 (Three-player chess piece contrast)

- White now uses ivory circles and Black uses near-black rounded squares. Red uses crimson circles.
  The board pieces, player cards and promotion choices share these styles.
- Checked computed colors and shapes and reviewed Chrome screenshots at 390 and 1280 pixels.
  All three game browser tests passed, and the production web build passed.

### Session 033 (Wikipedia chess and chess-like games roadmap)

- Reconciled all 42 Wikipedia entries in `docs/CHESS-LIKE-ROADMAP.md`. Six live games already meet the minimum, Three-player Chess needs bots and online rooms, and 35 entries need new products. Added the roadmap, Shatranj pilot and Three-player follow-ups to the feature list.
- Fast-forwarded local `main` to `9e7e374`. Inspected Actions run 45311784040 and fixed its Three-player Chess test fixture type error in `c800e51`. Three-player Chrome e2e passed 3/3 and the production build and Wrangler dry run passed.
- Wrangler authenticated and listed ten D1 databases. New online releases need capacity under the dedicated-database design. No plan, database or DNS settings changed. Authored titles need permission or a suitable license for faithful publication.
- Next feature is the classical Shatranj pilot. The rules source and release requirements are in the roadmap. Keep the catalog update behind production verification.
- `./init.sh` passed under Node 22.23.1 after the fixture fix, including npm install and all workspace verification. Validated all 42 roadmap rows against the source, parsed the feature list as JSON, and ran `git diff --check`.

### Session 034 (Melon deployment target)

- Owner directed all deployments to Melon over SSH, with Cloudflare reserved for a confirmed Melon limitation. The earlier D1 quota is historical evidence and does not block Melon.
- Verified Docker, Compose, Caddy and seven standalone workerd game containers through `ssh melon`. Makruk and Three-player Chess passed loopback health checks. No server state changed. Public routing, persisted online state across container replacement and the catalog release path still need verification.
- Canceled the previous Actions run before any Cloudflare deploy completed. CI now verifies and builds. Subsequent releases use the Melon path. Recorded the platform preparation and revised rollout in the roadmap and feature list.

### Session 035 (tutorial release requirement)

- The owner requires a tutorial for every game. The rollout now requires interactive instruction and guided practice in every declared language, with browser completion and rules validation before release.
- Six existing games have lesson implementations. Three-player Chess has no lesson player, so recorded its tutorial as tpc-008. The Shatranj pilot includes the tutorial in its acceptance checks.
- Verified the roadmap still contains all 42 entries, the feature list parses, and the documentation diff passes `git diff --check`.

### Session 036 (Melon release implementation)

- Active feature is plat-022. The pinned Node 22.23.1 `./init.sh` passed and all seven existing Melon origins returned HTTP 200 on loopback.
- An isolated Makruk container on port 19887 served assets, delivered room state through WebSocket, and recovered the room after a container restart with `workerd --data-dir`. The stage needs writable bundle scratch space and the host CA mount used by the live origins. No production route or container changed.
- Added `scripts/melon/stage.sh` to build and run a Git archive on Melon with dedicated stage state. Remaining checks include the script on a fresh release, D1 migration and restore, Caddy HTTPS promotion and rollback, and the catalog. The feature remains in progress.
- Installed the pinned Chromium and reran the existing Makruk online suite, 7/7 passing. Source archive transfer over SSH was slow, so staging now fetches the exact pushed SHA from GitHub on Melon. Added a network-isolated migration runner for staged D1 databases. Fresh execution and idempotency still need verification.
- The isolated standalone migration runner applied all three Makruk SQL migrations and applied none on the second run. Fixed the Wrangler export difference between local and Melon installs and made static web workspaces eligible for staging without a build script.
- The route promotion helper passed a trusted HTTPS test on an isolated Caddy instance. A deliberate 503 rolled back the live test route and preserved the good Caddyfile. The existing Melon Caddy returned HTTP 200 for the Beanroti catalog and Three-player Chess health via direct HTTPS.
- Final exact-SHA stages passed for Makruk and Beanroti at 8ee28c4. The staged Makruk history endpoint used the migrated database, and two WebSocket seats played and synchronized two moves. An offline backup recovered the room in a new container. The staged and live Melon catalog JSON SHA-256 matched the repository. No production service or route changed.
- plat-022 passes. Release commands, promotion and state handoff are in `docs/MELON-RELEASE.md`. The active feature is now shatranj-001.

### Session 037 (Shatranj engine)

- Added classical Shatranj in `packages/shatranj`. The rules contract documents setup, alfil leaps, ferz promotion, decisive stalemate, reciprocal baring and digital draw conventions.
- Node 22 typecheck passed. Shatranj tests passed 21/21, including Variant conformance and 12 seeded Fairy-Stockfish games up to 160 plies. Shared result tests passed 36/36.
- The Shatranj feature remains in progress. Next is a bounded bot using ai-core, followed by the tutorial, local and online UI and the Melon release.
- Added the bounded bot and the Shatranj PWA with local play, both bot sides, an interactive tutorial, and server-validated invite rooms. Bot tests passed 2/2, tutorial validation passed 11/11, Playwright passed 5/5, and the production build and Worker dry run passed. Reviewed desktop and phone renders.
- Public rollout still needs a DNS record for `shatranj.beanroti.com` and a certificate for the new name. The available zone credential is read-only. DNS access was requested while Melon staging continues. Directory publication stays behind public smoke.
- `npm run verify` passed across the workspace. Melon stage `9232a07` is healthy on loopback port 19897 under `chaturanga-stage-shatranj-19897`. Its database migration applied. Playwright against the staged build over SSH passed 6/6, including offline play and result settlement.
- Shatranj is blocked on public DNS and new-host TLS. Keep the staged container and isolated state available. After public HTTPS and multiplayer smoke, announce Shatranj in the live catalog and mark shatranj-001 passing. The next active feature is the Three-player Chess tutorial (tpc-008).

### Session 038 (Three-player Chess tutorial)

- Added an eight-step tutorial on the existing hex board. It teaches the three pawn directions, piece movement, promotion, checkmate elimination and stalemate, with incorrect-answer feedback. The tutorial keeps the local game save separate.
- Node 22 typecheck passed, web unit tests passed 3/3 and local Playwright passed 5/5, including the full tutorial at 390px and 1280px. Melon release is next. Shatranj public DNS is still pending.
- Main CI passed at 35460b7. Promoted the tutorial on Melon port 19898 and verified the exact public bundle. All five public browser checks passed. Old origin retained for rollback.
- tpc-008 is passing. Follow-up 3154fc8 adds labels for the two tutorial cells named in each prompt, verified in all five local browser tests. It is staging separately. Next active feature is Three-player Chess bots (tpc-006).

### Session 039 (Three-player Chess bots)

- Promoted 3154fc8 to port 19899 on Melon. All five public tutorial and local-mode regression checks passed.
- Added a bounded three-seat Max-n opponent in a Web Worker. A human can choose any seat, play two bots, reload that seat's save and take back their last turn without touching pass-and-play.
- Bot tests passed 5/5, typecheck and lint passed, and local Chromium passed 9/9. Verified all human seats, legal bot moves, fallback, persistence and checkmate endings. Production PWA build and server dry run passed. Bot mode remains in progress until staged and public smoke.
- Promoted bot revision 8771c1c on Melon port 19900. All nine browser scenarios passed on the exact stage and on public HTTPS. tpc-006 passes. Rubric accepted with all applicable checks verified against the authored hex rules; there is no Fairy-Stockfish equivalent for this three-seat format.
- Active feature is tpc-007. Prev origin on port 19899 remains available for rollback. Shatranj remains staged and blocked on public DNS.

### Session 040 (Three-player Chess invite rooms)

- Implemented private three-seat rooms with guest identities, an engine-validated sequence of moves, room presence, and durable per-game storage. No chat. Room and bot modes keep their state separate from pass-and-play.
- Worker and web typechecks passed. Room-state tests passed 3/3, local Chromium passed 11/11, and the production PWA build and Worker dry run passed. Covered out-of-turn, illegal and stale moves, checkmate, three-seat synchronization, reconnect, and rejection of a fourth player.
- Public release and restart persistence are pending. Stage this revision on Melon on port 19901. Current public rollback is 8771c1c on port 19900.
- Full workspace verification passed. The Melon stage at port 19901 applied its database migration and passed all 11 browser scenarios. A fresh SSH tunnel fixed a transport timeout. A container restart preserved all three guest seats and the existing ply, and the connected browsers resumed play.
- Promoted fe0b009 to the public Three-player Chess route. All 11 public Chromium checks passed. Published catalog revision 886f994 after public smoke and verified the live description. tpc-007 is passing. The renderer, rules fidelity, verified persistence and handoff meet the evaluator rubric.
- Next is ctg-001, the documented al-Adli Chaturanga reconstruction. Its movement and endings are pinned in the handoff. Shatranj remains ready on port 19897 pending public DNS.

### Session 041 (Chaturanga historical reconstruction)

- Selected Ludii’s al-Adli reconstruction and verified its published model’s asymmetric king setup. Implemented orthogonal elephant leaps, immediate bare-king victory, and victory for a stalemated king. The rule contract documents far-rank promotion and digital draw conventions.
- Chaturanga typecheck and 20/20 engine tests passed, including Variant conformance and eight seeded comparisons against a configured Fairy-Stockfish move oracle. Its stock Chaturanga variant uses different rules. Next add the bot, tutorial, PWA and online modes.
- Chaturanga’s independent PWA, bounded bot Worker, tutorial and invite room server passed web and bot tests, five local Chromium scenarios and the production build. Reviewed desktop and phone visuals. Exact-SHA Melon stage and offline browser smoke are next. Public DNS for both Chaturanga and Shatranj is absent.
- Staged exact Chaturanga revision 89604bb on Melon port 19902 and applied its database migration. Six staged Chromium tests passed, including offline PWA play. ctg-001 is blocked on DNS and TLS, like Shatranj. Keep both staging releases available. Next active feature is mhs-001.

### Maharajah and the Sepoys rules

The rule package passes typecheck and all 18 tests, including shared conformance, both checkmate outcomes and six seeded Fairy-Stockfish comparisons. Next add bots for both roles, an interactive tutorial and the PWA with invite rooms.

The English PWA, original board and icon, interactive tutorial, browser bot and server-validated rooms are implemented. Bot tests passed 2/2, lesson tests passed 11/11 and local browser play passed 5/5. Stage this revision on Melon and run all six scenarios against production assets.

Maharajah stage e4e04fb is healthy on Melon port 19903 in `~/chaturanga-release.maharajah.ezafRG`. Its SQL migration and all six production-asset browser scenarios passed. The home screen fit 375px and 1440px. Public DNS remains absent for Maharajah, Chaturanga and Shatranj. Keep their stages ready while beginning Courier Chess.

### Courier Chess

Use the medieval 12×8 rules in the linked Wikipedia article. Begin after the obligatory joyleaps, with kings on f1/f8 and ferzes on g3/g6. Select immediate ferz promotion from the documented alternatives and use a draw for stalemate because its historical resolution is unknown. The museum rules describe a different promotion practice. Record the reconstruction in the engine and teach these choices explicitly.

Courier’s twelve-file engine passed typecheck and all 18 tests, including six seeded Fairy-Stockfish comparisons and the common Variant checks. Next wire the bot, board, lessons and private rooms to this engine.

Courier Chess now has an English PWA, an interactive tutorial, a bounded bot and isolated online rooms. Passed 2/2 bot tests, 12/12 tutorial checks and 5/5 local browser scenarios. Stage this revision on Melon to verify the built PWA and online room.

Courier stage dc1feb1 is healthy on Melon port 19904 in `~/chaturanga-release.courier.rsjSBn`. Its migration and all six staged browser checks passed. Public DNS remains absent, so preserve the stage and move to the next product.

### Grande Acedrex

Use the dice-free Cazaux/Musser reconstruction summarized by Wikipedia. It has same-file kings, pawns on ranks four and nine, first-move king leaps, bent moves for aanca and unicornio, file-specific promotion, and wins by mate, stalemating the opponent or baring their king. The installed Fairy-Stockfish WASM declined a 12×12 test configuration. Use independent rule fixtures and seeded replay verification.

The Grande Acedrex rules engine passes all 22 tests and typecheck. The suite covers bent pieces, king leap rights, file promotion, all historical endings, shared conformance and replay of seeded 12×12 games. Full repository verification passed at the preceding Courier product checkpoint.

Grande Acedrex’s English PWA and isolated online server are implemented. Passed 2/2 bot, 13/13 tutorial and 5/5 local browser checks, including rank-12 promotion, mate and an online king leap. Stage and verify the offline production build on Melon.

Grande Acedrex stage 5adadf2 is healthy on Melon port 19905 in `~/chaturanga-release.acedrex.sFoXPN`. Its migration and all six staged browser checks passed. Public DNS is absent, so keep the stage ready for HTTPS promotion.

### Tamerlane Chess

Select the common 11×10 array in the Wikipedia rules. Use the two true citadels, typed pawn upgrades, lone-royal mate, the checked shah's exchange and the three promotions of the pawn of pawns. Encode the board as eleven ordinary files within a thirteen-column grid. Research sources disagree on the rare pawn redeployment and occupied home-square cases, so document the precise playable interpretation and confirm it with fixtures.

Tamerlane's engine passed typecheck and all 35 rule checks. These cover the common rotation, typed pawns, all three special pawn stages, citadels and both royal exchanges. The shared goal-square result passed 37 rules-core tests and 3 protocol tests. Next integrate the board, bot and interactive lessons.

The Tamerlane PWA, bot, 14-step tutorial and isolated Worker are implemented. The board omits nonplayable cells from pointer and keyboard input. Bot tests passed 2/2, tutorial checks passed 16/16 and local browser scenarios passed 6/6, including citadel-draw persistence. Next verify the production build and deployed room on Melon.

Tamerlane stage f1206a7 is healthy on Melon port 19906 in `~/chaturanga-release.tamerlane.aDgzje`. Its migration and all seven staged browser scenarios passed. A public DNS record is still needed.

### Shatar

Select the traditional bers, fixed double d-pawn opening and history-sensitive mate rules of Fairy-Stockfish’s Shatar preset. Begin after the required d4/d5. Rook, bers and knight checks count as shak. A mate delivered solely by a knight loses for its mover in the selected engine. A bishop or pawn mate without a shak in its unbroken check sequence is drawn. A bare king is also a draw.

Shatar’s rule package passed typecheck and all 26 tests. It matched the stock oracle across seeded play and four exact mate outcomes. The engine persists both checking streaks. Next wire the PWA, bot and lessons. The independent Tamerlane product checkpoint also passed full repository verification.

Shatar’s PWA, bot, tutorial and isolated invite-room server are locally verified. Bot checks passed 3/3, tutorial checks 13/13 and local browser scenarios 7/7. Those browser checks include the different saved outcomes for a lone horse mate and a camel mate without shak. Stage the production build next.

Shatar stage 0581e7b is healthy on Melon port 19908 in `~/chaturanga-release.shatar.dkiN4E`. It applied its migration and passed all eight staged browser checks. Public DNS remains absent.

Tamerlane's higher contrast pawn badges now pass on a phone. Promote the newer stage a48a53d on port 19907 in `~/chaturanga-release.tamerlane.i0KJt0` once DNS is ready. All seven staged browser checks passed again.

### Hiashatar

Select Mats Winther’s documented reconstruction of the 10×10 game. Use enemy-only bodyguard zones, retain the horse exemption, and exclude the hia from checking the noyon. Implement single, double and triple initial pawn advances and the two possible en passant targets after a triple advance. Verify the starting array and pawn promotion against the same reconstruction.

The rules engine, bounded AI, original English PWA and 15-step interactive tutorial are complete. Rules passed 27/27, AI passed 4/4, web tests passed 17/17, and local browser checks passed 5/5. Full workspace verification passed; the final targeted AI change also passed typecheck and tests, and repository lint passed. The production build and desktop/phone review passed. Remaining before moving on: push the verified checkpoint, stage on Melon port 19909, and verify the built PWA, room reconnect/restart and offline mode. Keep the stage available pending public DNS, then begin Shatra from the next row in the roadmap.

Commit `2858c15` was pushed to main; GitHub CI passed. Melon stage is healthy on port 19909 in `~/chaturanga-release.hiashatar.ea0qfu`; its migration applied, all six built-PWA browser checks passed, and an unfinished room recovered and continued after a container restart. Public promotion waits for DNS. Shatra is now active: select the documented current tournament form of Altai Shatra and resolve its 62-square board, setup, reserve, capture, Biy and ending rules before coding.


### Session 038 (Shatra rules contract)

- Selected the current Altai tournament form under the 1983 Shatra Code. Local history says current competitions use that code; the detailed board guide documents 62 numbered fields, 14 active and 9 reserve Shatras per side, Biy/Batyr reserve access, horizontal-return timing and gate capture rights.
- Resolved the 2015 paper's 11-reserve statement in favor of the explicit 9-field fortress setup: it does not explain where extra pieces go, while the documented 62-field position is complete. The separate English Wikipedia chess-piece army is not the selected Altai tournament form.
- `shatra-001` remains active. Next: add `packages/shatra/RULES.md`, then implement and verify the engine before AI, tutorial, PWA, invite rooms and Melon stage.


### Session 042 (Shatra product implementation)

- Completed the independent Altai Shatra product: custom 62-field board and piece art, English PWA, human vs bot as either color, pass-and-play saves, a 16-step interactive tutorial, and isolated server-validated private rooms. Shared board input now retains multi-capture routes and offers a route choice; the lesson player uses the same route dialog.
- Rules tests passed 24/24, AI 3/3, board-ui 45/45 and rules-core 38/38. Tutorial validation passed 16/16. Web and Worker typechecks passed; local Chromium passed 5/5. Production-preview PWA install/offline check passed 1/1. `npm run build:shatra` and full `npm run verify` passed under pinned Node 22.23.1.
- Visual review covered desktop and phone. The first `./init.sh` attempt hit `ENOTFOUND registry.npmjs.org`; retrying with pinned Node 22 and `npm_config_offline=true` used the cached npm@11 package, installed all workspaces, and completed lint, typecheck and the full test suite.
- Commit `5eeaa70` pushed to main. CI failed in the existing `packages/acedrex-ai/src/bot.test.ts` because a full eight-ply bot test took 5.24s on GitHub, just above Vitest’s default 5s limit. The targeted test passed locally; the hosted run terminated before completing its eight plies. Follow-up keeps every assertion and raises that test’s timeout to 10s for hosted runner variance; targeted test passed locally in 3.39s. Push this narrow CI fix and rerun the workflow before Melon staging.
- CI passed for `7907568` (run 45536274512). Staged the exact SHA on Melon port 19910 in `~/chaturanga-release.shatra.Vw0eEp`; migration applied and the origin returns healthy HTTP. All six built-PWA browser scenarios passed over SSH, including offline reload and two-seat online play.
- Restarted the stage during an active room; both guest seats reconnected with the one-ply history and continued play. Stopped the service, copied its isolated state, and restored the room in a separate container on port 19911; both seats were recognized and continued. Removed the temporary restore container and backup. The original port 19910 stage is running and healthy.
- DNS lookup for `shatra.beanroti.com` returned no address. Marked `shatra-001` blocked at public HTTPS/WebSocket smoke, route promotion and catalog publication; keep the stage ready.

### Session 043 (Fortress Chess source gate)

- Started `fortress-001`, the next available roadmap product after the staged Shatra increment. The Wikipedia entry identifies the historic Russian four-player fortress game, but sources do not establish a most-popular edition. Selected Alexander Petrov's 1850 rules, cross-checked against his 1862 account, as the best documented choice.
- Reviewed Markov's detailed scholarly reconstruction and the Ludii model: 192 playable cells, four corner forts, two walls per fort with gate routes, four seats in two opposite-seat teams, extra R/B/N placement, the historical knight route, removal after checkmate, and team victory after both opponents are mated.
- Original Petrov scans could not be retrieved. Chose and labeled the open points as digital reconstruction conventions: top Red starts; players place fortress reserves; orthodox en passant and axis-aligned castling subject to walls; ordinary-rank-only promotion; immediate draw on stalemate. Product plan and rules contract are in `apps/fortress/docs/PLAN.md` and `packages/fortress/RULES.md`.
- No Fortress code has been written or verified yet. Next implement the pure rules package, starting with the 192-cell mask and blocked-edge/wall routes, then test against Markov's examples before adding bots or product UI. Melon remains the deployment target; public hostname is `fortress.beanroti.com`.

### Session 044 (Fortress engine and bot)

- Implemented `@chaturanga/fortress`: the 192-cell board, eight wall segments, four-arm starting arrays, reserve setup, seat-specific movement, blocked knight routes, king safety, axis castling, en passant, promotion, FEN, checkmate removal and team endings. A move-resolution defect discovered by the en-passant and castling fixtures is fixed: special-move metadata now comes from generated legal moves, not the coordinate string alone.
- Added 23 rules tests, including Variant conformance, Markov's three wall-end diagonals, setup round-trip/undo, en passant, castling, checkmate elimination and team victory. `npm run typecheck -w packages/fortress` and `npm run test -w packages/fortress` pass.
- Added `@chaturanga/fortress-ai`, a bounded deterministic Max-n search where Red/White and Blue/Black share utility. Its 4 tests cover setup, all four seats and an exhausted-node legal fallback. Package typecheck and tests pass.
- Updated the shared conformance suite to use each variant's first declared seat and accept repeated turns while a setup-phase hand remains. The Fortress plan marks the engine and bot package steps complete.
- Next build the standalone English PWA: custom 16×16 board, interactive tutorial, saves, human-seat selection against three bots and pass-and-play. The shared online kit is still two-seat, so use a Fortress-specific worker patterned on Three-player Chess and verify server-side legality. Melon deployment and public DNS remain ahead.

### Session 045 (Fortress product)

- Completed the standalone Fortress PWA, custom 192-cell board, four-seat pass-and-play and save/reload, human-seat selection against three bounded team bots, 12-step rules tutorial and private four-seat invite rooms. The Worker replays every move through `@chaturanga/fortress`, stores each room in its own Durable Object and archives finished games in an isolated D1.
- Added a regression test for the Fortress WebSocket move schema after browser testing exposed that coordinate moves were rejected; setup/drop and ordinary/promoting moves now validate, while malformed inputs fail.
- `./init.sh` ran with Node 22.23.1 and completed the full repository `npm run verify`. `npm run build:fortress` passed. Fortress rules passed 23/23, bot 4/4, tutorial 2/2 and Worker 4/4. Local Chromium passed 9/9 scenarios (all four human seats, local saves, full tutorial, 4-seat invite/reconnect); production-preview PWA checks passed 2/2 (installability and offline tutorial/local play).
- Python Playwright screenshots reviewed the home and live board at 390px and 1440px. Next add the verified CI build, push the release increment, and stage its exact SHA on Melon. Keep the feature `in_progress` until room state survives stage restart/restore; public DNS is a separate release gate.

### Session 046 (Fortress hosted conformance timing)

- The first GitHub Actions run for `266be20` reached `npm run verify` but failed after 9m1s: the unchanged rules-core seeded-game replay and attacked-square conformance checks each exceeded Vitest's default five-second timeout on the hosted runner. Local timing was 4.74s and 3.28s respectively, confirming host variance rather than a functional failure.
- Added per-check timeout options to `describeVariantConformance` and set 20 seconds for those two Fortress checks only. All five seeded 120-ply games, move/replay/undo assertions, and attack coverage assertions remain unchanged.
- `npm test -w packages/fortress` passed 23/23 (9.38s); rules-core and Fortress typechecks passed; targeted ESLint and `git diff --check` passed. Commit `fc5577d` is pushed to main; GitHub Actions run 45552897158 passed full verification and every workspace build in 8m38s.
- Staged exact SHA `fc5577d3a53e6c90a572457bb24750b3b0e34e52` on Melon at port 19911 in `~/chaturanga-release.fortress.Gz3JGZ`; migration `DB/0001_games.sql` applied. Staged Playwright checks passed the tutorial, local save/reload/takeback, all four bot seats, mobile board, offline reload, four-seat room, illegal-move rejection, reconnect, restart recovery, copied-state restore and missing-room behavior. The restore container and copy were removed; the original stage is healthy.
- `getent ahosts fortress.beanroti.com` returned no record. Set `fortress-001` to `blocked` for public HTTPS/WSS smoke, Caddy promotion and catalog publication. Keep the stage running and continue to the next roadmap item, Crazyhouse.

### Session 047 (Crazyhouse selection)

- Started `crazyhouse-001`, the roadmap row immediately after Fortress. Selected the standard two-player Crazyhouse rules used on online chess servers; the target list does not enumerate competing Crazyhouse editions.
- Cross-checked rules against the Free Internet Chess Server and Lichess descriptions and the 2020 Crazyhouse research review. Captures become color-reversed pocket pieces; drops may check or mate; pawns cannot drop on ranks one/eight; same-file pawn drops are allowed; promoted captures revert to pawns. A pawn dropped on its own second rank retains a double-step. Use standard chess draw semantics on the full state.
- Reviewed the U.S. Copyright Office's game guidance. The rules method and name are not copyrightable there, while source wording and artwork can be; no exclusive publisher or permission gate appeared in the reviewed sources. Use original code, text and visuals. Fairy-Stockfish will be an oracle under the repository's GPL-3.0-compatible setup.
- Added Crazyhouse plan, rights report, rules contract and product AGENTS. No code is implemented. Next build `@chaturanga/crazyhouse`, implement Crazyhouse FEN with pockets and `~` promotion provenance, and verify against the installed `crazyhouse` preset.

### Session 048 (Crazyhouse baseline and oracle probes)

- Startup `./init.sh` could not sync uncached npm@11 in offline mode. Sandboxed `npm run verify` also hit local loopback/log-file EPERM in Cloudflare Worker pools. Reran the full `npm run verify` under pinned Node 22.23.1 with loopback/log access; lint, all workspace typechecks and all tests passed.
- Probed bundled Fairy-Stockfish 0.7.10 directly. Crazyhouse start FEN is `...[] w KQkq - 0 1`; captures populate the bracket pocket; drop UCI/SAN is `P@square`; the 50-move clock is active. The reference does not automatically adjudicate insufficient material for king versus king, a lone minor, or a lone minor in hand. Updated plan, rules contract and rights report accordingly.
- Crazyhouse remains the active roadmap feature. Before engine coding, commit the selection/rules/state update. Implement `@chaturanga/crazyhouse` using the chess package for orthodox board move generation and an independent pocket/drop/provenance layer, then add FEN, fixture, conformance and seeded ffish tests.

### Session 049 (Crazyhouse rules engine)

- Implemented `packages/crazyhouse` as a pure Variant package. It delegates orthodox board move generation to `@chaturanga/chess`, keeps Crazyhouse pockets and promoted-square provenance in its own state, adds legal drop generation/check blocking, canonical bracket-pocket FEN and independent repetition identity, and handles drop undo/replay and Crazyhouse SAN suffixes.
- Typecheck and targeted ESLint passed. `npm test -w packages/crazyhouse` passed 30 tests: 18 shared conformance checks, 10 rules fixtures and a Fairy-Stockfish suite covering eight curated edge positions plus 16 seeded games. Each seeded ply compared legal moves, SAN, FEN, game-over and result; pawn drops occurred in the playouts.
- Next implement `@chaturanga/crazyhouse-ai`, then wire the standalone PWA, lessons, saves, online Worker and Melon stage. The feature remains `in_progress` until the complete product is staged and restart/restore checks pass.

### Session 050 (Crazyhouse bot)

- Added `packages/crazyhouse-ai` on `@chaturanga/ai-core`: in-place search adapter for orthodox moves and drops, pockets/provenance in move make/unmake and repetition keys, pocket-aware evaluation, checking drops in quiescence, tactical drop ordering, conversion mode and bounded six-level personas.
- AI typecheck and targeted ESLint passed. `npm test -w packages/crazyhouse-ai` passed 5 tests covering every level as both colors, positions with both pockets, mating pawn drops, pocket/provenance identity, deterministic seeded choices, bounded nodes and terminal positions.
- GitHub CI run 45560562799 for exact engine SHA `13f0baaae3547b4a98a47d5e5796cae9fa0c6046` passed full repository verification and all workspace builds. Next build the standalone Crazyhouse PWA and interactive tutorial.

### Session 051 (Crazyhouse PWA and online rooms)

- Completed the Crazyhouse product PWA: original piece art and foundry visual identity, six bot levels as White or Black, pass-and-play, local save/reload/takeback, and 14 interactive lessons covering captures, pockets, drops, special moves and endings.
- Added the product Worker on `@chaturanga/server-kit`: private two-seat rooms, quick match, authenticated reconnect, server-authoritative Crazyhouse move/drop validation, chat-free sockets, isolated Durable Objects and a Crazyhouse-only D1 finished-game archive. Added local dev/build scripts, port 8795, migration, product README and standalone Worker configuration.
- Worker tests passed 8/8. They cover the Crazyhouse start position, illegal/out-of-turn rejection, capture-to-pocket and `P@e4` acceptance, Durable Object eviction recovery, quick match, chat rejection and a finished-game D1 row. Web tests passed 47/47, including lesson/locale checks and an explicit assertion for every shared online lobby, room and time-control key.
- Local Chromium passed 5/5 scenarios: tutorial, local saved capture/drop/takeback, bot as Black, narrow-screen tutorial list, two-seat invite and synchronized pocket drop, plus reconnect after a page reload. Production-preview PWA install/offline passed 1/1. Visual review at 1440px and 390px found no horizontal overflow; it found missing time-control labels, which were translated and covered by the new regression test.
- Full `npm run verify` passed under Node 22.23.1 after the locale fix. `npm run build:crazyhouse` passed with the PWA assets and Worker bindings. Exact-SHA GitHub CI, Melon staging, stage smoke, restart and copied-state restore remain next; public DNS/TLS and catalog publication are separate gates.

### Session 052 (Crazyhouse Melon stage)

- Exact commit `0b160b035447083d390b999aced2d216688abefb` passed GitHub CI run `45569846694`. Staged it on Melon at port 19912 in `~/chaturanga-release.crazyhouse.KzM8xm`; the isolated D1 migration applied and both the homepage and health endpoint returned 200.
- Built-PWA Chromium smoke passed the interactive tutorial, bot as Black, service-worker activation and offline reload, private invite, two-seat capture-to-pocket, server-validated `P@e4`, reload reconnect and absence of chat.
- Restarted the stage with an active two-seat game. Both seats recovered the saved position and the room accepted another move. Stopped the stage, copied its isolated state, and restored it in a separate temporary container on port 19913. Both seats recovered, continued through capture and reply, and the server accepted `P@e4`. Removed the temporary container and copy; the original stage is running and healthy.
- DNS lookup for `crazyhouse.beanroti.com` returned no address. Marked `crazyhouse-001` blocked at public HTTPS/WebSocket smoke, Caddy promotion and catalog publication; left the stage running and changed no public route or catalog.
- Next roadmap row is Congo (Wave 1). Before engine work, research its established two-player rules and permission status, then write the selected rules contract and implementation plan. If its source or rights gate blocks the work, move to the next ready roadmap row.

### Session 053 (Congo rules selection)

- Startup `./init.sh` could not fetch npm@11 because `registry.npmjs.org` did not resolve. The full repository `npm run verify` passed under Node 22.23.1 with loopback access.
- Selected Demian Freeling's 1982 two-player 7×7 Congo chess variant from MindSports, distinct from the nineteenth-century four-seat hexagonal game with the same name. The official rules establish the castles, river, pieces, drowning, Monkey routes, Pawn and Superpawn, and Lion capture. The Wikipedia entry's cited endgame convention draws only when the two Lions remain and neither can capture immediately.
- The rights review found no open license for MindSports prose/art. U.S. Copyright Office guidance says game methods and titles are not protected by copyright, while written rules and graphics may be; all code, art, rules prose and tutorial content will be original. This scoped finding is not worldwide trademark/copyright clearance.
- Added `apps/congo/docs/PLAN.md`, `apps/congo/docs/reports/Congo rules and rights.md`, `packages/congo/RULES.md` and `apps/congo/AGENTS.md`. Next build the pure 7×7 engine with Monkey capture routes, river-exit markers, drowning, Lion endings and conformance fixtures.

### Session 054 (Congo rules engine)

- Implemented `@chaturanga/congo` as a pure 7×7 Variant with the complete selected piece movement, optional Monkey capture routes (captured pieces remain blockers during the route), Lion capture, automatic Superpawn promotion, river-exit FEN markers, drowning, no-move losses, bare-Lion draws and threefold repetition.
- Added 31 package tests for start/FEN, invalid positions, each piece, capture/promotion, river entry/exit/drowning, Monkey routes, endings, shared Variant conformance and seeded replay/undo. There is no compatible Fairy-Stockfish preset for Congo; rules fixtures are checked against the source-backed contract.
- Extended `VariantMoveRecord` with optional ordered `captures` and `movedPieceRemoved` fields. Shared conformance now recognizes a legal river move whose mover drowns at turn end. Full repository `npm run verify` passed under Node 22.23.1; package lock includes Congo.
- Exact rules commit `d39c377a0ac60e0efdf0e700262c1f875ffb10f1` was pushed to main; local full verification and GitHub CI run `45581462791` both passed.

### Session 055 (Congo bot)

- Added `@chaturanga/congo-ai` on ai-core with six deterministic bounded personas, Lion-capture terminal scoring, a Congo-specific evaluation, promotion/capture ordering and river-aware position identity. AI outputs are legal UCI route strings, including Monkey multi-captures.
- Package typecheck/lint and 3 bot tests passed: legal output for both sides at every level, direct Lion capture, Monkey/river situations, seeded choice, bounded search and terminal null result.
- Next: build the standalone English PWA and interactive rules tutorial; read and follow the frontend-design skill before product UI work. Keep the overall feature `in_progress` through online play, CI, Melon staging and DNS/public release checks.

### Session 056 (Congo PWA and online service)

- Built the standalone English PWA with original field-guide styling, animal piece seals, a responsive 7×7 river board, six bot levels, pass-and-play, local save/reload/takeback, and eight interactive lessons. Web tests passed 35/35; local browser E2E passed 5/5 and installed offline PWA smoke passed 1/1.
- Added the Congo-only Worker, Durable Object and D1 migration for private rooms and quick match. Worker tests passed 9/9, covering server-side illegal-move rejection, a complete Monkey multi-capture route, reconnect recovery, finished-game persistence and chat rejection. Shared protocol tests passed 6/6 after supporting full route notation.
- `npm run build:congo` passed. Full `npm run verify` passed under Node 22.23.1 (lint, typecheck and all workspace tests). Next commit the product increment, confirm exact-SHA CI, and stage on Melon with tutorial/bot/room smoke plus restart and copied-state restore. Public route/catalog publication still requires DNS and TLS.

### Session 057 (Congo Melon release checkpoint)

- Commit `77cfac9949333c2f075e84c0f2ec185601366e3d` passed GitHub CI run `45590944839` (full workspace verification and build matrix). Melon staged it at port 19913 in `/home/melon/chaturanga-release.congo.yFqc4U`; the Congo-only D1 migration, health and homepage passed.
- Staged production-browser smoke passed tutorial completion, bot as Black, mobile lesson layout, private invite, two-seat move sync/reconnect (5/5 total), and PWA offline install/reload (1/1). A first remote online scenario raced the WebSocket open; added an explicit readiness wait, then the same staged suite passed. Runtime files were unchanged by this E2E fix.
- A live two-seat room survived container restart and both seats continued. A stopped-state copy in a separate container on port 19914 recovered both stored identities and synchronized further moves; removed the temporary restore container/copy and left the primary stage healthy.
- `congo.beanroti.com` still has no DNS answer. No Caddy route or catalog entry was changed. `congo-001` is blocked only at public DNS/TLS/HTTPS-WSS smoke and directory publication. Start the next ready Wave 1 row, Jeson Mor, while the Congo stage remains available. Node 22.23.1 remains at `/private/tmp/node22/node_modules/.bin`.

### Session 058 (Congo dependency audit and Jeson Mor research)

- The production dependency audit of staged Congo found Hono 4.13.7 advisories and a high Zod 4.6.4 memory-exhaustion advisory. Updated the shared lock to Hono 4.13.22 and Zod 4.6.7; `npm audit --omit=dev` now reports zero. `npm audit fix` also removed the two critical root build-tool findings. Five advisories remain in build/test dependencies (four moderate in Workbox glob/minimatch and one high in happy-dom); npm only offers a forced downgrade/major change, so those were not forced.
- Full `npm run verify` passed under Node 22.23.1 after the lock change; `npm run build:congo`, local browser smoke 5/5 and offline PWA smoke 1/1 passed. GitHub CI run `45596551183` passed the preceding test/handoff commit `7e74d45`; the lockfile patch was then committed separately and verified in the next session.
- Jeson Mor source and rights research is complete in `apps/jesonmor/docs/reports/Jeson Mor rules selection.md` and its adjacent source notes; implementation starts after Congo's replacement stage is verified.

### Session 059 (Congo patched runtime release and Jeson Mor start)

- Dependency patch commit `fdf1325efcd7b3d63c3ac1eb20c86fe6fa28f176` passed exact-SHA GitHub CI run `45599461942`, including full `npm run verify` and the complete build matrix.
- Re-staged that exact commit on Melon at `127.0.0.1:19914`, directory `/home/melon/chaturanga-release.congo.350fpC`, container `chaturanga-stage-congo-19914`. Its Congo-only D1 migration and health/homepage checks passed. The previous port 19913 stage remains available for rollback.
- The staged production dependency audit reported zero vulnerabilities. Production browser checks passed 5/5 for tutorial, bot as Black, narrow lesson layout, private invite, synced moves and reconnect; installed offline PWA passed 1/1. Full npm audit still reports five build/test-only findings (four moderate in Workbox glob/minimatch; one high in happy-dom) whose available npm fixes require forced downgrade or major change.
- Melon's resolver returned no IPv4 or IPv6 address for `congo.beanroti.com`. No Caddy route or catalog entry changed. Congo is blocked only at public DNS/TLS, HTTPS/WSS smoke and directory publication; the verified port 19914 stage remains running.
- Jeson Mor is now the active feature. Research selects the best-documented 9×9 checkerboard form without claiming a popularity ranking. The same knight must reach e5, survive one opponent reply, then leave e5 on its next turn; this resolves ambiguity in the cited later rules. Authored-content boundaries and source limitations are in `apps/jesonmor/docs/`. Next create the product plan/rules contract and game-local package/app scaffolds, following the Shogi/other 9×9 patterns. Read the frontend-design skill before building the product UI.

### Session 060 (Jeson Mor rules engine and bots)

- Added the product plan, local rules/AGENTS files, and kept the research report/source-rights notes under `apps/jesonmor/docs/`.
- Implemented `@chaturanga/jesonmor`: 9×9 knight movement and capture, selectable first side via FEN, capture-all elimination, a capturable pending e5 goal with a required same-knight escape after one reply, threefold repetition, the explicit no-legal-move loss convention, replay and undo. The goal marker is serialized in FEN so rooms can recover it. Shared conformance and focused tests passed 28/28.
- Added generic `elimination` result support to rules-core and the six-level `@chaturanga/jesonmor-ai` adapter on ai-core. Fifteen AI tests passed, including legal choices for every level as both colors, immediate capture-all and center escape, seeded repeatability and state restoration.
- The first full `npm run verify` stopped on three unused-symbol lint findings; those were removed. The next full run passed under Node 22.23.1: ESLint, every workspace typecheck, and every workspace test. Next build the independent web app and tutorial, then its online service.

### Session 061 (Jeson Mor PWA and online service)

- Completed the independent English PWA with original equestrian field-atlas identity and horse art, choice of first player, six bounded bot levels, pass-and-play, local save/reload/takeback, and seven interactive lessons covering every selected rule. Web tests passed 29/29; local Playwright passed 5/5 for tutorial, persistence, bot as Black, phone layout, invite-room moves and reconnect; installed offline PWA smoke passed 1/1.
- Added the Jeson Mor-only Worker, Durable Objects, quick match, private rooms, reconnect, move validation through the pure Variant, no-chat behavior and isolated D1 archive. Worker tests passed 9/9. `npm run build:jesonmor` passed for both the Vite PWA and Wrangler Worker dry run.
- Full repository `npm run verify` passed with `NODE_OPTIONS=--no-experimental-webstorage` in the available Node 25 environment. Without that compatibility flag, Node 25's built-in `localStorage` conflicts with happy-dom; the repository pins Node 22 for CI. Exact-SHA GitHub CI remains required on the new product commit.
- Next commit and push to main, verify that commit's CI, stage on Melon, and run built PWA, online room, restart and copied-state restore smoke. Keep the public route and catalog gated on DNS/TLS and HTTPS/WSS checks. The product remains `in_progress` until the Melon stage checks pass.

### Session 062 (Jeson Mor Melon staging)

- Commit `3a31bf29739ca08024abced86014a35e31d4ea56` is pushed to main. Exact-SHA GitHub CI run `45612186318` passed full repository verification and the production build matrix.
- Melon staged the exact SHA at port 19915 in `/home/melon/chaturanga-release.jesonmor.s1Jcyr`, container `chaturanga-stage-jesonmor-19915`. The isolated D1 migration, `/api/health` and homepage returned healthy.
- Built-stage Playwright passed 6/6: guided lesson/answer, local save/reload/takeback, bot as Black, narrow-screen lessons, two-seat invite/move sync/reconnect, and installed offline reload. A live two-seat room recovered after Docker restart and continued; a stopped-state copy restored both seats and accepted another legal move. Removed the temporary restore container and state copy; confirmed the primary stage healthy.
- Melon resolves no A or AAAA record for `jesonmor.beanroti.com`. Public HTTPS/WSS smoke, Caddy promotion and app-directory publication remain blocked; no route/catalog change was made. `jesonmor-001` is blocked only at that public gate; keep its stage running.

### Session 063 (Suffragetto source and rights research)

- Started the next Wave 1 feature, `suffragetto-001`, after Jeson Mor's Melon stage was verified. Completed parallel research on the original rules/provenance, later interpretations/popularity evidence, and rights scope; the report is `apps/suffragetto/docs/reports/Suffragetto rules and rights.md` with notes beside it.
- Selected the surviving WSPU/Sargeant Bros. second-edition two-player form as the best-documented default, not a statistically proven popularity winner. The date record conflicts (circa 1907–08, c.1909, and a surviving second edition catalogued 1917). Authored rules, art and brand will be original; source scans/prose are not product assets and the rights note is not worldwide clearance.
- Recorded the rules/rights boundary in the plan, Variant contract and local AGENTS instructions. No game code has been written. Before the engine, derive and test the full 17×17 zone and S/P setup coordinate map from the archival board, then resolve goal/Arena membership and chain/exchange conventions in fixtures.

### Session 064 (Suffragetto board transcription)

- Transcribed the surviving second-edition board into `apps/suffragetto/docs/board-coordinates.md` without retaining source images in the repository. Canonical coordinates use `a1` at the Suffragette-side bottom-left.
- Recorded every board cell, the 9×17 Arena envelope, 3×2 goal cutouts outside the pink capture zone, both 21-cell L-shaped holding areas, both six-cell staging areas, and all 42 marked setup cells. The buildings cannot be capture squares.
- Updated the product plan, local AGENTS guidance and engine contract with the coordinate map. Next implement and test a machine-readable layout fixture before move generation.
- `./init.sh` stopped while syncing npm@11 because `registry.npmjs.org` did not resolve. The workspace has the locked dependencies already; the only installed Node is 25.9, while `.nvmrc` requests 22.23.1. Plain verification needed loopback permission; full `npm run verify` then passed with loopback access and `NODE_OPTIONS=--no-experimental-webstorage` to handle Node 25's built-in storage conflict.

### Session 065 (Suffragetto layout fixture)

- Added `@chaturanga/suffragetto` with a pure layout fixture for all 289 coordinates, pink Arena, goal cutouts, Prison/Hospital, yards/grounds and the exact S/P setup. Five tests cover counts, masks and large-piece placement.
- Fixed shared square notation and board-ui parsing to support the 17th file `q`, and updated shared conformance coordinate extraction. Existing board-ui coordinate tests remain intact.
- Focused verification passed: Suffragetto layout 5/5, rules-core 40/40, board-ui 46/46; all three package typechecks passed. Root workspace CI/local verification should run again after the engine is implemented.
- Next implement the pure Variant movement engine and test setup/FEN, eight-direction steps, chained hops/captures, the reserved zones, exchanges, goal occupancy, repetition, undo/replay and shared conformance.

### Session 066 (Suffragetto rules engine)

- Implemented the pure 17×17 Suffragetto `Variant` in `packages/suffragetto`: setup/FEN, steps and chained hops, captures and prisoner transfers, forbidden zones and locked goals, exchanges, goal victory, repetition, no-move loss, move history and undo. Remaining source gaps are explicit digital conventions in `packages/suffragetto/RULES.md`.
- Exchanges use a distinct action notation (`X21@b1` means two small and one large pair). Shared board-ui parsing treats it as an action rather than a board route; protocol validation accepts it and lesson conformance understands action moves.
- Focused Suffragetto tests and shared `Variant` conformance passed 36/36; board-ui passed 47/47; game-shell passed 93/93; protocol passed 6/6. Full workspace `npm run verify` passed with loopback access and `NODE_OPTIONS=--no-experimental-webstorage` under Node 25.9. `.nvmrc` Node 22.23.1 is not installed; `./init.sh` could not fetch npm@11 because registry DNS failed.
- Next implement the Suffragetto AI package with bounded deterministic personas and exchange/capture coverage, then the product PWA/tutorial. Product build, browser, Worker, Melon and exact-SHA CI verification remain outstanding.

### Session 067 (Suffragetto bots)

- Added `@chaturanga/suffragetto-ai` with six deterministic, bounded bot personas on `@chaturanga/ai-core`. Its search adapter preserves long chained routes and exchange actions as lossless UCI strings.
- Focused bot tests passed 17/17 across every level as both roles, including the six-cell winning move, Arena capture/transfer, exchange availability, seeded choice and restoring a supplied game after search. Typecheck, lint and the two-game 32-ply strength smoke passed.
- Engine SHA `7f82b77d8fc1db3f049b89079772d578d04f20cd` is pushed to main; exact-SHA GitHub CI run `45629891192` passed.
- Next read the `frontend-design` skill and build the original standalone English PWA, responsive board, interactive tutorial for every rule, bot play, local saves and offline installation. Then implement the private room Worker/D1 and deploy to Melon.

### Session 068 (Suffragetto Melon release)

- Completed the original English Suffragetto PWA with responsive 17×17 play, original artwork, six bounded bots, local save/reload/takeback, offline install, private online rooms and an isolated Worker/D1. Seven interactive lessons teach the selected rules. Web tests passed 34/34, Worker tests 9/9, `npm run build:suffragetto` passed, and full workspace `npm run verify` passed with `NODE_OPTIONS=--no-experimental-webstorage` under Node 25.9. The `.nvmrc` runtime is unavailable and `./init.sh` could not fetch npm@11 because registry DNS failed.
- Commit `0e46a1ee3bf5fd3f9075e025f387a54a01638123` is pushed directly to main. Exact-SHA GitHub CI run `45638729555` passed full workspace verification and the build matrix.
- Melon staged that exact SHA at `127.0.0.1:19916` in `/home/melon/chaturanga-release.suffragetto.Bz3TYJ` (`chaturanga-stage-suffragetto-19916`). Its product-local D1 migration, health endpoint and homepage passed. Built-stage Playwright passed 5/5; installed offline PWA smoke passed 1/1.
- A live two-seat room recovered both seats and its two-ply history after container restart; both clients reconnected, then played and synchronized another legal move. With the service stopped, the state directory was copied to an isolated restore container; the restored room accepted a second seat and a legal move. Removed the temporary restore container/state copy and confirmed the original stage healthy.
- `suffragetto.beanroti.com` has no DNS answer. Public HTTPS/WSS smoke, Caddy promotion and app-directory publication are blocked; no route or catalog entry changed. `suffragetto-001` is blocked only at that public gate. Keep the stage running.
- The next listed ready Wave 1 product is `dameo-001`; begin with rules, edition/popularity evidence and rights research before engine work.

### Session 069 (Dameo research and rules contract)

- Started the next Wave 1 product, `dameo-001`, after Suffragetto's exact-SHA CI, Melon stage and recovery checks passed. The staged Suffragetto release remains running; its only blocker is missing public DNS.
- Completed separate research on Dameo's canonical rules, edition/popularity evidence and rights boundary. The synthesis report is `apps/dameo/docs/reports/Dameo rules variants rights.md`, with source notes in `apps/dameo/docs/research_notes/Dameo rules variants rights/`.
- Selected Christian Freeling's standard 8×8 Dameo with 18 men per side as the canonical, best-documented form. Online activity and catalog counts show adoption but do not establish it as more popular than Big Dameo/community experiments. Do not claim a popularity winner.
- Recorded the selected movement/capture/promotion rules in `packages/dameo/RULES.md` and the product plan. Compulsory maximum capture, captured-piece blockers until route end, no repeated captured piece in one route, and end-of-turn promotion must be encoded as full-turn behavior.
- The primary rules say draws can come from undefined “mutual exhaustion of material”; another creator page names agreement/threefold; Wikipedia names threefold/no-possible-win. The plan pins threefold as automatic and a mutually accepted draw as the explicit digital adjudication for the undefined no-winner case. No 50-move or guessed material heuristic is added.
- Rights notes require original rules/tutorial prose, board art and product branding; no reuse license was found on the official pages, and trademark clearance for `Dameo` as public branding remains outstanding.
- Next encode and test the 8×8 setup/coordinate fixture before move generation. Then implement the pure Variant and continue through bots, interactive tutorial, PWA and the isolated Melon service.

### Session 070 (Dameo setup fixture)

- Added the `@chaturanga/dameo` package scaffold and machine-readable standard setup: all 64 squares, White/Black 18-man 8+6+4 trapezoids, vertical symmetry and `a1`-origin square naming.
- The five layout tests assert every setup coordinate, side counts, non-overlap, mirror mapping, empty middle ranks and invalid coordinates. Focused tests passed 5/5; package typecheck and ESLint passed. The workspace lockfile now recognizes the new package.
- Updated the plan, feature evidence and clean-state checklist. Next implement move generation, starting with line moves and compulsory maximum-capture route enumeration; keep complete capture turns serializable as one legal move.

### Session 071 (Dameo rules engine)

- Implemented `@chaturanga/dameo` as a pure 8×8 `Variant` with canonical FEN, men/line movement, queenwise kings, compulsory global maximum capture, multi-capture routes, delayed captured-piece removal/blocking, no repeated capture, empty-square revisiting, end-of-turn promotion, elimination/no-move/threefold outcomes, history, replay and undo.
- Added source-derived fixtures for starting counts, FEN rejection/round-trip, each movement class, line promotion, mandatory/global maximum capture, long king captures, delayed-removal blocking, passing the back rank, termination, repetition and attack-map semantics. The attack map marks occupied targets, including defended friendly pieces, in keeping with the shared interface.
- `npm test -w packages/dameo` passed 36/36 (two test files, including shared Variant conformance and five seeded 120-ply games); `npm run typecheck -w packages/dameo` and `npx eslint packages/dameo` passed. No compatible Fairy-Stockfish Dameo preset is available, so there is no external move oracle.
- The product-layer mutual-agreement draw action remains for app/online integration. Next add bounded bots for both sides, then read the frontend-design skill before designing the independent English PWA and interactive lessons.

### Session 072 (Dameo bounded bots)

- Added `@chaturanga/dameo-ai` on ai-core with six deterministic levels using fixed node budgets, complete route IDs, tactical ordering for captures/promotions, and evaluation for material, advancement, center control and threatened pieces.
- All 16 bot tests passed: all six levels return legal moves as White and Black; the search finds immediate elimination and the mandatory maximum-capture route; full line routes survive ID encoding; seeded choices repeat; node limits are bounded; supplied live games are restored after search; terminal positions return null. Package typecheck and ESLint passed.
- Updated `package-lock.json` and reinstalled workspace links offline. Full workspace `npm run verify` passed under Node 25 with `NODE_OPTIONS=--no-experimental-webstorage` and loopback enabled for the Cloudflare Worker test pools. No Actions run appeared for rules commit `c80e49b80f9bf7369ec73569b5860ec3a617942a`; the bot push will trigger the next exact-SHA full CI run for both increments.
- Next read `frontend-design`, create the product's original design brief and comprehensive interactive tutorial, then build the PWA/local saves/offline install and isolated online Worker for Melon. Public branding still waits on trademark review.

### Session 073 (Dameo product design)

- Read the `frontend-design` skill before UI work and wrote `apps/dameo/docs/design.md` as the original route-atlas direction: paper/ink/copper palette, locally available typography, custom carved-token art, clear route states, responsive board-first screens, accessibility and reduced-motion requirements.
- Recorded the design checkpoint in the product plan, feature evidence, quality grade, clean checklist and session handoff. No product UI has been added yet.
- Next implement the complete interactive tutorial using the shared lesson player and the source-derived Dameo Variant. It must exercise men, line shifts, king range, compulsory/global-maximum capture, delayed blockers/Coup Turc, back-rank timing, blockage, repetition and the mutually agreed-draw convention.

### Session 074 (Dameo interactive tutorial)

- Added the standalone English Dameo web workspace, PWA manifest, game-local site setting, SEO endpoints, local Noto Sans files, route-atlas home, original carved-token art and responsive lesson catalog. The product has a dedicated locale and storage namespace; family links and feedback strings use shared product components.
- Authored nine interactive lessons across three units. `RULE_LESSONS` maps setup, movement, line shifts, king range and captures, compulsory maximum routes, delayed blockers, Coup Turc, promotion timing, blocked loss, threefold repetition, agreed draws and omitted 50-move/material heuristics to a lesson. Every move exercise is validated by the Dameo Variant. Where an engine position has no legal wrong answer, the lesson uses an accurate quiz or task-specific route, avoiding false-negative feedback for legal moves.
- Web lesson and locale checks passed 45/45; web typecheck and ESLint passed; the production Vite PWA build passed. Headless Chromium opened `/`, entered the first lesson, answered the setup quiz, reported no page errors and measured equal 390px client/scroll width. Screenshots were inspected at `/private/tmp/dameo-home.png` and `/private/tmp/dameo-tutorial.png`. Full workspace `npm run verify` passed with loopback enabled: ESLint, all workspace typechecks and all tests.
- `npm install --package-lock-only --ignore-scripts --offline` could not reach the uncached npm registry. Added the new workspace and symlink entries to `package-lock.json` from the exact package manifest, and linked the existing local `@vitejs/plugin-react` into the ignored app `node_modules` for this checkout. A clean install/CI run must validate lock consistency.
- Pushed tutorial milestone `84ecf9feeb8e40ed05b7d6fcb8f020e25e830317` (`feat(dameo): add interactive tutorial PWA`). Exact-SHA CI run `45658443801` failed at `npm ci`: the Dameo web workspace also needs its nested `apps/dameo/web/node_modules/@vitejs/plugin-react@6.3.0` lock entry. Copied the already-locked sibling package metadata into Dameo and `npm ci --ignore-scripts --dry-run --offline` now passes; push this lock correction and recheck CI.
- Next add local and computer play using `@chaturanga/dameo-ai`, persist/reload and verify offline play, then implement the accepted-draw action and isolated online Worker/D1. Stage the complete product on Melon after Worker and browser/offline/restart checks. Public promotion still waits for name clearance and DNS/TLS/HTTPS/WSS.

### Session 075 (Dameo local and bot play)

- Retried the required `./init.sh` startup path under Node 25.9; it stopped while fetching npm 11 because `registry.npmjs.org` returned `ENOTFOUND`. Continued using the installed workspace dependencies with `NODE_OPTIONS=--no-experimental-webstorage`.
- Exact-SHA GitHub CI run `45658960096` passed for the lock correction commit `1aa3ac2d3c1df51e1fdb9ff08ec70c5028ed55a3`.
- Added three separate persistent Dameo session stores for pass-and-play and the bot-as-White/bot-as-Black seats. The shared `GameSessionState` now supports `agreeDraw()`; online adapters intentionally no-op because online agreement must be accepted by the server's draw-offer state machine.
- Added the worker client/worker for `@chaturanga/dameo-ai`, preserving the full replay history for repetition-aware bot search. Bot replies are checked against live FEN and fall back to a legal move if the worker errors.
- Added a route-atlas setup/game flow with all six bot personas, either human color, same-device passing, replay-persisted sessions, two-step local draw offers, takeback, resignation, rematch and complete shared-game-shell locale keys.
- Dameo web tests passed 45/45; game-shell tests passed 94/94. Dameo app and game-shell typechecks, ESLint, and `npm run build:dameo` passed; production PWA precached 17 assets (657.45 KiB). The build still warns that the main JS bundle is 517.30 kB minified.
- Chromium smoke passed: as Black, the bot made the opening move, Black played a legal move and the bot replied; local White moved, the page reloaded with its move intact, Black moved and White accepted the draw. No browser exceptions or 390px horizontal overflow. Setup and result screens were visually inspected.
- Full `NODE_OPTIONS=--no-experimental-webstorage npm run verify` passed with loopback access: ESLint, typecheck in all workspaces, and all workspace tests. The default sandbox attempt failed only when existing Cloudflare Worker test pools were denied loopback listeners (`EPERM`).
- Production-build offline smoke passed in Chromium: Workbox precache controlled the page with 14 cached requests; the lesson route loaded offline, then the bot worker played/replied legally while disconnected. No page errors.
- Committed/pushed `ef829ccb8d66c3d01a9c47e62a374342c540c1f1` (`feat(dameo): add local and bot play`) directly to main. Exact-SHA CI run 45663916887 is in progress.
- Melon stage is deferred to the online Worker increment because `scripts/melon/stage.sh` requires `apps/dameo/worker/wrangler.jsonc`. This is a release workflow dependency, not a Melon capacity limitation. No route/catalog change was made.
- Next add isolated server-authoritative private rooms/quick match and online draw offers, then full verification, exact-SHA CI and Melon restart/restore stage checks. Public promotion remains gated by name review and DNS/TLS/HTTPS/WSS.

### Session 076 (Dameo online rooms)

- Added `apps/dameo/worker`: a Dameo-bound `GameRoom` and matchmaker on the shared server-kit, Hono play routes, isolated D1 migration/archive, product-specific Wrangler config and Worker tests. Every online move is replayed through `@chaturanga/dameo`; the shared protocol rejects chat. The local dev launcher creates an ignored `.dev.vars` with a private random signing key; Melon staging generates its own secret.
- Integrated the shared online lobby and room into Dameo's independent PWA, including invite links, quick match, side selection, time controls, authoritative draw offers and all English locale keys. Added root `dev:dameo` and `build:dameo` Worker support and regenerated the lockfile offline.
- Focused Worker tests passed 9/9, including health/API, room start position, illegal/wrong-turn validation, same-seat reconnect, Durable Object eviction, 5+0 quick match, agreed draw, D1 game archive and chat rejection. Dameo web tests passed 45/45; web/Worker typechecks and ESLint passed.
- `npm run build:dameo` passed, including the Wrangler dry-run bundle with Dameo Durable Objects, D1 and PWA assets. The PWA precache contains 17 build entries (676.31 KiB); the main JS bundle is 536.61 kB and triggers Vite's existing size warning.
- Two-context Chromium online smoke created a private room, joined it from a second browser profile, synchronized a legal move, accepted a draw and found no 390px horizontal overflow or page errors. Production offline smoke again verified cached tutorial and bot play with the service worker active, 14 cache requests and no page errors.
- Full `NODE_OPTIONS=--no-experimental-webstorage npm run verify` passed with loopback access: repository lint, every workspace typecheck and all workspace tests. CI run 45663916887 for the preceding local/bot commit `ef829cc` completed successfully. Exact-SHA CI for this online increment and Melon stage/restart/copied-state restore are next.
- No public route or directory entry changed; naming clearance and DNS/TLS/HTTPS/WSS remain public-release gates. `.dev.vars` and local Wrangler state are ignored and not included in the commit.
- Committed/pushed online milestone `6987d5b6a6e67938d27d55d1189c4ce43268bdd3` (`feat(dameo): add online play`) directly to main. Exact-SHA CI run `45668832352` passed full verification/build matrix.
- Staged that SHA on Melon at `127.0.0.1:19917` in `/home/melon/chaturanga-release.dameo.dTpb5d` (`chaturanga-stage-dameo-19917`); product-local D1 migration, health and homepage passed. Built-stage browser smoke covered tutorial, both bot colors, private room, legal move sync, reload reconnect, draw agreement, mobile overflow and browser errors. Container restart restored seats and one-ply history; isolated copied-state restore restored the same room and synchronized another legal move. Temporary restore container/data were removed; primary stage is healthy.
- `dameo.beanroti.com` has no DNS answer. Trademark clearance is also open, so HTTPS/WSS, Caddy and directory publication remain blocked; no public route or catalog entry changed. Keep the verified stage running. Next roadmap feature is Gess (`gess-001`), starting with rules/variant/rights research.

### Session 077 (Gess research and rights gate)

- Completed parallel source research for Gess rules, edition/popularity evidence and rights; the synthesis report is `apps/gess/docs/reports/Gess rules variants rights.md`, with notes in the adjacent research folder.
- Selected the 1994 Archimedeans rules as the best-documented candidate, not a proven popularity winner. Candidate play uses an 18×18 board, 43 stones per side, 3×3 formations, collision captures and ring-based victory. Exact setup transcription, the center-only footprint conflict, and no-move/repetition outcomes remain unresolved.
- No applicable license or written permission for a digital adaptation was found. The 1995 repost permission covers reproducing text only; it does not grant game adaptation rights. Gess is blocked before implementation under AGENTS.md pending rights confirmation or an applicable license. No contact was sent.
- The next roadmap entry is Duell (1976). Begin with primary rules, edition/popularity and rights research. Dameo remains staged on Melon at port 19917; its public promotion is blocked by absent DNS and pending name review.

### Session 078 (Duell research and rights gate)

- Completed separate rules, editions/adoption and rights research for Duell. The synthesis report is `apps/duell/docs/reports/Duell rules variants rights.md`, with cited source notes next to it.
- Identified the roadmap target as Lakeside's 1976 8×9 Duell in Geoffrey Hayes's game family; the later 9×9 Tactix reissue is distinct. The edition is well documented, but a popularity winner is not established.
- Primary scan evidence describes 5-1-2-6-K-6-2-1-5 back ranks, 3s facing players, orthogonal die tumbling with at most one right-angle turn, no passing, exact landing captures, and King/key-square wins. Starting side, die chirality, key-square timing, no-move, repetition and draws need verification/conventions.
- No digital adaptation permission/license was found and present-day rights ownership is unresolved. Duell is blocked before implementation; an expired U.S. patent does not alone establish digital rights clearance. No rights-holder contact was sent.
- The next roadmap entry is Ploy, standard two-player form first. Begin rules/variant/adoption and rights research before implementation. Dameo remains staged on Melon at port 19917; public promotion waits on absent DNS and trademark review.
