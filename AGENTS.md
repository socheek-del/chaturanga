# AGENTS.md

Chaturanga is a family of traditional chess games. Each game is its own web PWA product:

- **Makruk** (Thai chess): live.
- **Sittuyin** (Burmese chess): live.
- **Xiangqi** (Chinese chess): live (`apps/xiangqi/docs/PLAN.md`). Its design is "Mo"
  (`apps/xiangqi/docs/design.md`), approved by the owner on 2026-09-18.
- **Shogi** (Japanese chess): live (`apps/shogi/docs/PLAN.md`). Its design ("Kaya") still awaits owner
  approval (`apps/shogi/docs/design.md`), so the live site is styled on an unapproved proposal. It is the
  first game with pieces in hand during play and an optional promotion; the platform-prep features
  `plat-011..013` made both generic.
- Others may follow.

Owner decisions, target layout and order of work are in `docs/PLATFORM.md`. Facts about a single game live next
to that game: `apps/makruk/AGENTS.md` for the Makruk product, `apps/sittuyin/AGENTS.md` for the Sittuyin product, `apps/xiangqi/AGENTS.md` for the Xiangqi product, `apps/shogi/AGENTS.md` for the Shogi product, and `packages/<game>/RULES.md` for the rules
as implemented.

This repository is designed for long-running coding-agent work. The goal is not to maximize raw code output.
The goal is to leave the repo in a state where the next session can continue without guessing.

## Startup Workflow

Before writing code:

1. Confirm the working directory with `pwd`. The repo root contains `feature_list.json`.
2. Read `claude-progress.md` for the latest verified state and next step.
3. Read `feature_list.json` and choose the highest-priority unfinished feature.
4. Review recent commits with `git log --oneline -5`.
5. Run `./init.sh`. It installs dependencies and runs `npm run verify`.
6. Run the smoke or end-to-end verification relevant to the area before new work.

If baseline verification is already failing, fix that first. Do not stack new feature work on top of a
broken starting state.

## Working Rules

- Work on one feature at a time (`single_active_feature`). Each feature names its `product` (`platform`,
  `makruk`, `sittuyin`).
- Do not mark a feature `passing` just because code was added. Run its `verification` steps and record
  `evidence`.
- Keep changes within the selected feature scope unless a blocker forces a narrow supporting fix.
- Do not silently change verification rules, weaken tests, or rewrite the feature list to hide unfinished work.
- Prefer durable repo artifacts over chat summaries.

## Platform Rules

- **One rule for the layout.** Nothing game-specific lives at the repository root or in a shared package.
  A game's identity lives in its own folders (`apps/<game>/`, `packages/<game>/`):
  - rules
  - piece art, theme
  - lessons
  - locale content and its list of languages
  - PWA manifest, site address
  - README
  - Worker and D1 database

  Adding a game must never edit another game's files.
- **Separate products.** Each game has its own site on its own subdomain, brand, PWA, languages, Worker and
  D1. Games link to each other only through a "more games" section (plat-006).
- **Design.** Each game has its own design identity built on shared component primitives. Never copy
  Duolingo's look (fonts, colours, chunky buttons, zig-zag path). This is an owner decision because of legal risk.
- **Languages per product.** Makruk is Thai (default) and English. Sittuyin is Burmese (default, Unicode
  only) and English. Every user-visible string goes through i18n keys, complete in every language the
  product declares.
- **Online play.** No chat of any kind. The server validates every online move with the game's rules
  engine.
- **Rules engines.**
  - Each engine follows the matching Fairy-Stockfish variant (`makruk`, `sittuyin`) and is verified against
    ffish.
  - Each implements `Variant` from `@chaturanga/rules-core` and runs `describeVariantConformance`.
  - None uses DOM, network, timers, or randomness without an injected seed.
- **Site addresses are temporary.** Never hardcode a domain. Each app reads its address from its own single
  setting, and screenshots and GIFs must not show the domain.

## Project Facts

- **Stack:** npm workspaces · TypeScript · React 19 + Vite · Tailwind v4 · Cloudflare Workers + Durable
  Objects + D1 · Vitest · Playwright.
- **Node:** version in `.nvmrc`. Run npm and vitest under it (`. ~/.nvm/nvm.sh && nvm use`). With the
  shell's default Node 20.13, npm skips rolldown's native binding and vitest fails to start. `init.sh` and
  CI already switch Node.
- **Layout:**
  - `packages/rules-core` (`@chaturanga/rules-core`): the Variant interface; the shared 8x8 board, move
    tables and attacks; rule errors. Its `/testing` export has the ffish loader and the conformance suite.
  - `packages/makruk` (`@chaturanga/makruk`): pure Makruk rules (`RULES.md`). The single source of truth
    for the Makruk web app, AI and worker.
  - `packages/sittuyin` (`@chaturanga/sittuyin`): pure Sittuyin rules (`RULES.md`). The single source of
    truth for the Sittuyin web app, AI and worker.
  - `packages/xiangqi` (`@chaturanga/xiangqi`): pure Xiangqi rules (`RULES.md`), including the chasing and
    perpetual-check rules ported from Fairy-Stockfish. `/core` is the raw API for search code.
  - `packages/xiangqi-ai` (`@chaturanga/xiangqi-ai`): Xiangqi bots on ai-core. Repetitions are judged by the real
    rules through ai-core's optional `SearchAdapter.repetitionScore` hook. The ladder is a bundled Node script
    (`npm run test:strength -w packages/xiangqi-ai`), about 4x faster than under vitest.
  - `apps/xiangqi/web`, `apps/xiangqi/worker`: the Xiangqi product. It has pass-and-play, computer, 13 lessons,
    online rooms, PWA and zh-Hans/en, on board-ui's `grid="points"`. The Worker runs on :8789, deploys on its
    own subdomain and D1 (xq-008), and links to its siblings (xq-009). SEO and the READMEs are still to come
    (xq-010). `npm run smoke:prod -w apps/xiangqi/web` drives the live site.
  - `packages/shogi` (`@chaturanga/shogi`): pure Shogi rules (`RULES.md`), including drops, optional and
    forced promotion, nifu, uchifuzume and sennichite. `/core` is the raw API for search code. It differs
    from Fairy-Stockfish in two documented places (uchifuzume, impasse).
  - `packages/shogi-ai` (`@chaturanga/shogi-ai`): Shogi bots on ai-core; drops are ordered last and left out
    of quiescence. The ladder is a bundled Node script (`npm run test:strength -w packages/shogi-ai`).
  - `apps/shogi/web`, `apps/shogi/worker`: the Shogi product (`apps/shogi/AGENTS.md`). Pass-and-play,
    computer, 15 lessons, online rooms, PWA and ja/en, on the 9x9 squares board with both piece stands always
    on screen. The Worker runs on :8790, deploys on its own subdomain and D1 (sg-008), and links to its
    siblings (sg-009). `npm run smoke:prod -w apps/shogi/web` drives the live site.
  - `packages/ai-core` (`@chaturanga/ai-core`): game-independent alpha-beta search over a `SearchAdapter`,
    bot personas and root-move picking.
  - `packages/ai` (`@chaturanga/makruk-ai`): Makruk computer opponents, run in a Web Worker. It keeps its own
    copy of the search until it migrates to ai-core with a ladder re-run.
  - `packages/sittuyin-ai` (`@chaturanga/sittuyin-ai`): Sittuyin bots (ai-core search, evaluation, setup
    placement policy). Product plan: `apps/sittuyin/docs/PLAN.md`.
  - `packages/protocol` (`@chaturanga/protocol`): Zod schemas for REST and WebSocket messages.
  - `packages/family` (`@chaturanga/family`): the family's game list with names in every site language.
    `src/sites.ts` reads each game's address and languages from its own `site.config.ts` and
    `product.config.ts`, and each app's vite.config injects its siblings as `__FAMILY__` for `MoreGames`.
    A site address is overridden per product (`MAKRUK_SITE_URL`, `SITTUYIN_SITE_URL`, `XIANGQI_SITE_URL`),
    never with a shared variable.
  - `packages/ui` (`@chaturanga/ui`): React primitives (Badge, Button, Card, Modal, ProgressBar,
    SegmentedControl, Switch, `cn`). They carry shape, state and accessibility but no palette: every
    colour is a Tailwind token the product defines, listed in `packages/ui/TOKENS.md`. Apps must list it
    in an `@source` line in their `index.css` so Tailwind generates its classes.
  - `packages/board-ui` (`@chaturanga/board-ui`): React board of any size (piece art, colours and labels
    passed in), `HandTray` for pieces in hand, and `useMoveInput` over `legalUci()` (board moves, drops,
    diagonal and in-place promotion). Apps must list it in an `@source` line in their `index.css` so Tailwind
    generates its classes.
  - `packages/game-shell` (`@chaturanga/game-shell`): shared app layer for the sites. `ProductConfig`
    (languages, default, language names, Open Graph locales, fonts, storage prefix), locale helpers, SEO
    tags, results, time controls, `createGameSession(variant)`, lesson shapes and progress, and the online
    client (`createIdentity(storageKey)`, room API, WebSocket connection, `createOnlineSession(variant)`);
    `/testing` has `describeLocales` and `describeLessons`. `/ui` has the game screen (board, hand trays,
    player bars, move list, controls, result dialog), the lesson player, and the online lobby and room.
    Games and lessons call `useFocusMode`, and each app's AppShell uses `useFocusModeProvider` to hide its phone
    nav bar and show a back link. All of these come
    with the product's art, words, sounds and counting injected — the keys they read are in
    `packages/game-shell/KEYS.md`. Each app declares its product in `apps/<game>/web/product.config.ts` and
    `@source`s `game-shell/src/ui`.
  - `packages/server-kit` (`@chaturanga/server-kit`): the online-play Worker layer — the room state
    machine (clocks wait for a setup phase), room codes, seat tokens, `registerPlayRoutes` (health, guest
    token, rooms, quick match, room socket), and the `GameRoomBase` and `MatchmakerBase` Durable Objects,
    all driven by a `Variant`. A product subclasses `GameRoomBase`, names its variant, and stores finished
    games in its own D1.
  - `apps/makruk/web`, `apps/makruk/worker`: the Makruk product (`apps/makruk/AGENTS.md`).
- **Commands:**
  - `npm run verify`: lint, typecheck and unit tests in every workspace.
  - `npm run dev` / `npm run e2e` / `npm run build` / `npm run deploy`: currently run the Makruk product.
    `dev:makruk`, `build:makruk` and `deploy:makruk` name it explicitly.
  - `npm run test:deep -w packages/<game>`: perft to every depth plus 400 lock-step games against ffish.
- **License:** GPL-3.0 (public repo; Fairy-Stockfish WASM is allowed).
- **Source control:** remote `git@github-socheek-del:socheek-del/chaturanga.git` (renamed from `Makruk`;
  the old URL redirects). Branch `main`. Conventional Commits.
- **CI:** `.github/workflows/ci.yml` runs verify and build on every push and PR, and on push to `main`
  deploys each product whose own folders — or a shared package — changed.
  `.github/workflows/strength.yml` runs a bot ladder on demand for any of the bot packages.

## Required Artifacts

- `feature_list.json`: source of truth for feature state
- `claude-progress.md`: session log and current verified status
- `init.sh`: standard startup and verification path
- `session-handoff.md`: compact handoff for larger sessions
- `clean-state-checklist.md`: run before ending a session
- `evaluator-rubric.md`: score a feature before accepting it
- `quality-document.md`: per-area quality grades

## Definition Of Done

A feature is done only when all of the following are true:

- the target behavior is implemented
- the required verification actually ran
- evidence is recorded in `feature_list.json` or `claude-progress.md`
- the repository remains restartable from the standard startup path

## End Of Session

Before ending a session:

1. Update `claude-progress.md`.
2. Update `feature_list.json`.
3. Record any unresolved risk or blocker.
4. Walk through `clean-state-checklist.md`.
5. Commit with a descriptive message once the work is in a safe state.
6. Leave the repo clean enough for the next session to run `./init.sh` immediately.
