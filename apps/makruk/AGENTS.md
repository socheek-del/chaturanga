# AGENTS.md: Makruk

Makruk (Thai chess) is a web PWA. It offers:

- single player against the computer
- pass-and-play
- online play
- game-like tutorials
- themes in its own "Wat" (Thai temple) design system (`apps/makruk/docs/design.md`)
- every game saved in the browser, with PGN export and import, and a Fairy-Stockfish game review
  (review-001, review-002)

The original product plan is `apps/makruk/docs/PLAN.md`. The platform rules in the root `AGENTS.md` apply
here too.

## Makruk Facts

- **Code:**
  - rules: `packages/makruk` (`@chaturanga/makruk`)
  - AI: `packages/ai` (`@chaturanga/makruk-ai`)
  - web app: `apps/makruk/web` (`@chaturanga/makruk-web`)
  - Cloudflare Worker: `apps/makruk/worker` (`@chaturanga/makruk-worker`). It serves static assets,
    `/api/*`, `/ws/*`, the Durable Objects `GameRoom` and `Matchmaker`, and D1.
- **Language:** Thai is the default UI language; English is the alternative. Every user-visible string
  needs both `th` and `en`.
- **Rules reference:** Makruk start FEN `rnsmksnr/8/pppppppp/8/8/PPPPPPPP/8/RNSKMSNR w - - 0 1`. Rule
  questions are settled against Fairy-Stockfish's `makruk` variant (`packages/makruk/RULES.md`).
- **Site address:** the domain is temporary, so never hardcode it.
  - Web code reads `SITE_URL` from `apps/makruk/web/site.config.ts`. It is injected as `__SITE_URL__` and
    `%SITE_URL%` in index.html; robots.txt and sitemap.xml are generated from it.
  - Other places: `apps/makruk/worker/wrangler.jsonc` routes and PUBLIC_ORIGIN, and the `[play]` link in
    `apps/makruk/README.md` / `README.th.md`.
- **Deploy:**
  - Production is currently the Worker custom domain in `wrangler.jsonc` on the Cloudflare zone `beanroti.com`.
  - GitHub Actions deploys on push to `main`.
  - `npm run deploy` (= `deploy:makruk`) applies D1 migrations (`apps/makruk/worker/migrations`) first.
  - Worker name and D1 database are both `makruk`.
- **Saved games and review (review-001, review-002):** built on the shared layer in `game-shell`
  (plat-017); `src/features/review/kit.ts` is everything Makruk supplies. Games are stored in
  localStorage (`makruk.games`, analyses under `makruk.analysis.<id>`). The engine is Fairy-Stockfish WASM
  (`fairy-stockfish-nnue.wasm@1.1.12`, GPL-3.0), stored verbatim in `web/public/engine/` (`CREDITS.md`;
  re-download with `npm run engine -w apps/makruk/web`) and precached for offline use. It searches in
  threads, so **the whole site is cross-origin isolated**: `web/public/_headers` in production and
  `CROSS_ORIGIN_ISOLATION` in `vite.config.ts` for dev and preview. Anything loaded from another origin
  (an image, a font, a script) must now send `Cross-Origin-Resource-Policy`, or it will be blocked. There is
  no public Makruk opening list, so no Book label. PGN carries `[Variant "makruk"]`.
- **Accounts:** removed from the product for now (owner decision 2026-09-14).
  - The site is open to everyone, with no sign-in, ratings or history.
  - Online play uses an invisible anonymous seat token (`apps/makruk/web/src/features/online/identity.ts`).
  - The worker still contains the dormant account code (username + password with PBKDF2, email
    confirmation, password reset; no Google/OAuth) and its tests.
- **Lessons:** all lessons are open (no locking), and there is no daily streak.
- **Worker config:**
  - Secret `AUTH_SECRET` (required).
  - Secret `RESEND_API_KEY` for email delivery via Resend; registration is disabled until it is set.
  - `EMAIL_FROM` is a var in `wrangler.jsonc`.
  - `DEV_EMAIL_OUTBOX=1` stores emails in D1 and exposes `/api/dev/outbox`. It is only for local dev,
    workerd tests and Playwright; never enable it in production.
- **Tests:**
  - Worker tests run inside workerd (`@cloudflare/vitest-plugin`), with D1 migrations applied in
    `apps/makruk/worker/test/apply-migrations.ts`.
  - `npm run e2e` starts vite + wrangler dev with a local D1.
  - `npm run e2e:pwa -w apps/makruk/web` checks installability and offline play on a production build.
- **Bot ladder:** `npm run test:strength -w packages/ai` is slow and writes results to
  `packages/ai/strength-results.log`.
  - It is resumable: finished games go to `packages/ai/strength-games.log`, keyed by bot config.
  - Split it with `STRENGTH_PAIR=n STRENGTH_SHARD=k/count`, then run once more without a shard to record
    the verdict.
  - L6 vs L5 takes about 15 min per game on one core, so run it on GitHub Actions instead
    (`gh workflow run strength.yml -f pair=5 -f games=20`). The verdict job's `strength-verdict` artifact
    has the per-game log.
  - Games start from seeded paired 6-ply openings, because noise-free bots are deterministic.
