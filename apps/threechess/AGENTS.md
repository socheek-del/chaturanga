# AGENTS.md: Three-player chess

Three-player chess is a PWA with three-person pass-and-play and a one-human/two-bot mode. It ships in English and uses
the hex-cell rules in `packages/threechess/RULES.md`. Product plan: `docs/PLAN.md`.

## Product facts

- **Rules:** `packages/threechess` (`RULES.md`); pure TypeScript, three seats (`w`, `b`, `r`), 91-cell hexagon.
- **Web:** `web`; home, rules, pass-and-play board, move log, undo, promotion choice, saved local game, PWA,
  SEO, sibling links, a tutorial, and independent bot saves for all three human seats. Online rooms are planned.
- **Bots:** `packages/threechess-ai`; bounded Max-n search in a browser Web Worker.
- **Worker:** `worker`; static web assets and `/api/health`. V1 saves games in the browser.
- **Site address:** `web/site.config.ts` (override `THREECHESS_SITE_URL`) and the Worker route in
  `worker/wrangler.jsonc`.
- **Commands:** `npm run dev:threechess`, `npm run build:threechess`, `npm run deploy:threechess`,
  `npm test -w packages/threechess`.
- **Dev ports:** web :5193, Worker :8793.

The public tutorial teaches the hex directions, promotion and elimination. Its fixtures and browser checks are in the web app. Use `THREECHESS_E2E_URL` to run the browser suite against a deployed release.
