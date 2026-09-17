# Session Handoff

## Verified Now

- **Repository:** `socheek-del/chaturanga`, a family of games.
  - Makruk (Thai chess) is live; players see only the new "more games" link since the last deploy.
  - Sittuyin (Burmese chess) is live on its own subdomain (address in `apps/sittuyin/web/site.config.ts`); production smoke 11/11 and SEO check 7/7 on 2026-09-14. Plan: `apps/sittuyin/docs/PLAN.md`.
- **Shared packages:**

  | Package | Contents |
  |---|---|
  | `rules-core` | Variant interface and conformance suite |
  | `makruk`, `sittuyin` | Rules engines verified against Fairy-Stockfish |
  | `ai-core`, `ai`, `sittuyin-ai` | Shared search and each game's bots |
  | `game-shell` | Product config, sessions, game screen, lesson player, online client, lobby and room, `MoreGames` |
  | `board-ui`, `ui` | Board, hand trays, move input; palette-free primitives |
  | `server-kit` | Room logic (clocks wait for a setup phase), Durable Objects, seat tokens, `registerPlayRoutes` |
  | `family` | Game names in th/my/en; sibling addresses read from each app's `site.config.ts` |
  | `protocol` | Message schemas |

- **Sittuyin app** (`apps/sittuyin/web` + `apps/sittuyin/worker`): setup phase, pass-and-play, computer (6 bots), 12 lessons, online rooms and quick match on its own Worker and D1, PWA, SEO tags, sitemap, OG image, About page.
- **Last full run (session 006):** `npm run verify` exit 0; Sittuyin e2e 29/29 and PWA 2/2; Makruk e2e 66/66 and PWA 2/2; `npm run build` and `npm run build:sittuyin` OK.

## Changed Sessions 012–013 (2026-09-17)

- **Xiangqi, built but not deployed:**
  - engine with Fairy-Stockfish game-end rules (xq-001, xq-002);
  - bots with a local ladder (xq-003; the Actions run is pending);
  - "Mo" design proposal (xq-004, awaiting owner);
  - web app with pass-and-play, computer, PWA and zh-Hans/en (xq-005, in_progress until the design is
    approved);
  - 13 lessons (xq-006);
  - online play on its own Worker (xq-007).
- **Platform:** intersection boards and aspect-aware fitting (plat-009); family tests independent of game count
  (plat-010); ai-core `repetitionScore` hook.
- **Not pushed:** GitHub credentials expired on this machine. Run `gh auth login` then `git push origin main`.
- **Owner decisions pending:**
  - the Xiangqi design (`apps/xiangqi/docs/design.md`, `apps/xiangqi/docs/evidence/design-light-1280.png`);
  - the Xiangqi subdomain (D8).

## Changed This Session (006)

- sit-007 lessons, sit-008 online play, plat-006 links between games, sit-009 deploy, sit-010 SEO/About/README: `passing`.
- sit-011: review sheet `apps/sittuyin/docs/i18n-review.md` written; `blocked` on a native reviewer.
- CI deploys each product only when its paths, a shared package or the lock file change (`changes` job).
- Session 007: polish-003 mobile focus layout, owner request, `passing`. Nav hidden in games and lessons on
  phones; lessons fit one screen; the board is measured to fit; Burmese line heights raised. Checks: `e2e/mobile.spec.ts`
  in both apps.
- Online client and lobby/room UI moved from the Makruk app into game-shell; seat tokens and play routes into server-kit.
- Site address overrides are per product: `MAKRUK_SITE_URL`, `SITTUYIN_SITE_URL`.

## Broken Or Unverified

- **Known defect:** none open.
- **Owner actions:** submit the Sittuyin sitemap in Google Search Console; find native Thai (polish-002) and Burmese (sit-011) reviewers.
- **Known flakes (pass on re-run):** Makruk online-004 "reload rejoins", Makruk clock.spec "clock counts down" under full-suite load.
- **Risks:**
  - Run npm and vitest under the `.nvmrc` Node (`. ~/.nvm/nvm.sh && nvm use`).
  - A Bash call that `cd`s moves the working directory for later calls: always `cd` to an absolute path.
  - `gh` is logged in as another account by default; use `GH_TOKEN=$(gh auth token -u socheek-del)` for this repo.
  - `package-lock.json` is written by npm 11 (`npx -y npm@11 install`), the version CI uses.

## Next Best Step

- **Every feature an agent can finish is passing.** Left: polish-002 and sit-011 (native reviews), acct-002/acct-003 (deferred by the owner).
- **Candidates for new owner-approved work:** migrate `packages/ai` onto `ai-core` (needs a ladder re-run); a guided first game with coach tips for Sittuyin (in the plan, not in sit-007's verification).
- **After UI changes:** `npm run capture -w apps/sittuyin/web` (review screenshots) and `BASE_URL=<live site> npm run capture:readme -w apps/sittuyin/web` (README media).
- **Must not change:** Makruk behaviour, Worker and D1 names, and the no-accounts / open-lessons / no-chat decisions.

## Commands

- Startup: `./init.sh`
- Verification: `npm run verify` · `npm run e2e` (Makruk) · `npm run e2e -w apps/sittuyin/web` · `npm run e2e:pwa -w apps/<game>/web`
- Dev: `npm run dev:makruk` (Worker :8787) · `npm run dev:sittuyin` (Worker :8788)
- Deep rules checks: `npm run test:deep -w packages/makruk` · `npm run test:deep -w packages/sittuyin`
- Ladders: `gh workflow run strength.yml -f package=packages/ai|packages/sittuyin-ai -f pair=N -f games=20`
