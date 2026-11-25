# Quality Document

A quality snapshot for each product domain and architectural layer. Both agents
and humans use this document to see where the codebase is strong and where it
needs work.

**Update cadence:** After each significant session, or before starting a new milestone.

**Grading scale:**

- **A**: All verification passing, clean architecture, agent-legible, stable tests
- **B**: Verification passing, mostly clean, minor gaps in legibility or test coverage
- **C**: Partially working, known gaps, some code areas hard for agents to understand
- **D**: Not working, or major structural issues

---

## Product Domains

| Domain | Grade | Verification | Agent Legibility | Test Stability | Key Gaps | Last Updated |
|--------|-------|-------------|-----------------|---------------|----------|-------------|
| Rules engine (Makruk) | A | Unit + perft + lock-step vs Fairy-Stockfish + Variant conformance | packages/makruk/RULES.md, typed API | Deterministic seeds | Array-scan movegen limits AI depth | 2026-09-14 |
| Rules engine (Sittuyin) | A | Unit + perft + lock-step (FEN, counting, game over) vs Fairy-Stockfish + Variant conformance | packages/sittuyin/RULES.md, every rule an ffish-probed test | Deterministic seeds | Not used by any app yet | 2026-09-14 |
| Rules engine (Hiashatar) | B | 27 unit and conformance checks; selected reconstruction has no matching Fairy-Stockfish preset | packages/hiashatar/RULES.md and isolated package | Seeded replay/undo | No external oracle | 2026-11-25 |
| Local play & pass-and-play | A | Unit + E2E (moves, history, views, clocks) | GameScreen shared by all modes | Stable; fake clock for timers | — | 2026-09-13 |
| Single player (AI) | A | Unit (tactics, repetition incl. opponent reply, root window, conversion) + E2E (worker, hints, takeback) + 20-game ladder per level pair on Actions | search/evaluate/bots split; ladder logs end reason + FEN per game | Ladder deterministic (node budgets, seeded openings); ~2 h for L6 vs L5 on Actions | No transposition table; Met-only mates vs bare Khun sometimes run out the count; browser strength follows time budgets, ladder follows node budgets | 2026-09-13 |
| Single player (Hiashatar AI) | B | Four AI unit checks and browser play as both colors | packages/hiashatar-ai on ai-core | Seeded search | No strength ladder yet | 2026-11-25 |
| Tutorials & gamification | A | Lesson content validated against engine; E2E lesson/path/guided | Lessons are plain TS data | Stable (no date-dependent logic) | Content reviewed by engineer, not a Makruk teacher | 2026-09-13 |
| Online play | A | Pure room logic + workerd DO tests + two-browser E2E | Thin DO over pure reducer | Real wrangler dev in E2E | No spectator UI beyond read-only banner | 2026-09-13 |
| Accounts & ratings | B | Glicko-2 reference test, workerd tests (register/confirm/login/lockout/reset, mocked Resend), E2E full account flow via dev outbox + rated game + guest carry-over | accounts/{routes,store,password,email}.ts | Local D1 via wrangler in E2E | Production email unverified (no Resend key); no per-IP rate limit on register/forgot-password | 2026-09-13 |
| Themes & art | A | E2E + screenshot review | pieces/ folder, Mascot.tsx | — | Ruea/Khun silhouettes close at 36px | 2026-09-13 |
| Localization (TH/EN) | B | Key parity + literal-key test; E2E in both languages | locales/*.json + lesson L10n | — | Needs native Thai review (polish-002) | 2026-09-13 |
| PWA & polish | A | Installability via CDP, offline E2E, sound/motion E2E | vite.config.ts, sound.ts | — | — | 2026-09-13 |

## Architectural Layers

| Layer | Grade | Boundary Enforcement | Agent Legibility | Key Gaps | Last Updated |
|-------|-------|---------------------|-----------------|----------|-------------|
| `packages/rules-core` | A | Engine purity lint rule; Variant enforced by `satisfies` + shared conformance suite | variant, board8, attacks, errors, testing/ | — | 2026-09-14 |
| `packages/makruk` | A | ESLint no-restricted-globals for src; clock is pure (`now` injected) | board, movegen, fen, game, clock, perft, variant | ffish is devDependency only | 2026-09-14 |
| `packages/sittuyin` | A | Engine purity lint rule; depends only on rules-core | board, fen, movegen, game, perft, variant | — | 2026-09-14 |
| `packages/ai` | B | Uses `@chaturanga/makruk/core` only | search/evaluate/bots/index | Strength ladder slow; own copy of the search until it migrates to ai-core (ladder re-run needed) | 2026-09-14 |
| `packages/ai-core` | A | Engine purity lint rule; SearchAdapter is the only game contact; tested on a toy game (Nim) | search, persona, random | — | 2026-09-14 |
| `packages/sittuyin-ai` | B | Engine purity lint rule; uses sittuyin `/core` + ai-core | adapter, evaluate, setup, bots, index, strength ladder | Search ~55k nodes/s vs Makruk ~90–110k at equal budgets (adapter + hands overhead; browser bots are time-capped, so top level is shallower); ladder not yet verified | 2026-09-14 |
| `packages/protocol` | A | Zod schemas only | game.ts | No `variant` field yet (plat-005) | 2026-09-14 |
| `apps/makruk/web` | A | No rules logic outside engine; sessions share one interface | features/, pages/, stores/ | Bundle not code-split per route | 2026-09-14 |
| `apps/makruk/worker` | A | All moves validated via engine; room rules are pure functions; dev email outbox only when DEV_EMAIL_OUTBOX=1 | room/, match/, accounts/, ratings/ | — | 2026-09-14 |
| CI & deploy | A | verify + deploy on main; scoped token; AUTH_SECRET as secret | .github/workflows/ci.yml | E2E not run in CI (needs browsers + wrangler) | 2026-09-13 |

## Change History

### 2026-11-25

- Added Hiashatar rules, bounded bot, interactive tutorial, PWA and private-room server. Local verification passed; Melon staging and public hostname remain to be completed.

### 2026-09-13

- Changes: M0–M5 and most of M7 implemented and verified; see claude-progress.md.
- Domains promoted: engine, local play, tutorials, online, themes & art, PWA → A; AI and i18n → B
- Domains demoted: none
- New gaps identified: bot ladder counting-rule draws (fixed, re-running); native Thai review; accounts
- Gaps closed: page scroll on move, coach tip after resignation, repetition shuffling in bots
