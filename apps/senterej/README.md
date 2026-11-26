# Senterej

Senterej is a historical Ethiopian chess game with an opening phase called Werera. Both players can move
repeatedly and retract their own moves until a capture begins ordinary turn-taking. This clean-room English
PWA includes six seeded bots, pass-and-play, saved games, eight interactive lessons, offline access and
private online rooms. The Senterej Worker validates each action and records its actor; rooms have no chat.

## Run locally

From the repository root, run `npm run dev:senterej`. The web app uses port `5223` and its Worker uses port
`8823`. Run `npm run build:senterej` to build the PWA and Worker. The site address is configured only in
[`web/site.config.ts`](web/site.config.ts) through `SENTEREJ_SITE_URL`; online persistence uses Senterej's
own Durable Object namespace and D1 database.

Focused checks are `npm test -w packages/senterej`, `npm test -w packages/senterej-ai`,
`npm test -w apps/senterej/web`, and `npm test -w apps/senterej/worker`. Browser coverage is available with
`npm run e2e -w apps/senterej/web` and `npm run e2e:pwa -w apps/senterej/web`. Set
`PLAYWRIGHT_BASE_URL` to a forwarded Melon stage URL to run those same browser checks against the built
release.

## Rules and release

The selected historical rules and digital conventions are recorded in [`docs/PLAN.md`](docs/PLAN.md) and the
[implemented rules contract](../../packages/senterej/RULES.md). Historical sources provide provenance; the
product's board, art, interface and teaching text are original. Deploy verified revisions to Melon using the
[release runbook](../../docs/MELON-RELEASE.md). Keep the product out of public navigation until its own
hostname passes DNS, HTTPS and WebSocket smoke checks.
