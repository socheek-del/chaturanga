# Session Handoff

Updated 2026-11-24 after Three-player chess work.

## Verified now

- `main` contains the six existing game products. Three-player chess is live.
- Three-player rules: custom Chaturanga Ring, 8 files × 12 ranks, three clockwise seats, checkmate eliminates,
  stalemate passes, and the last king wins. See `apps/threechess/docs/PLAN.md` and
  `packages/threechess/RULES.md`.
- `plat-020`, `tpc-001` and `tpc-002` are passing in `feature_list.json`. Full `npm run verify` passed with
  `NODE_OPTIONS=--no-experimental-webstorage`; Three-player Playwright e2e passed 3/3 in installed Chrome.
- `npm run build:threechess`, `npm run build:beanroti-apps` and `npm run build:chess` passed. The catalog source
  is `apps/beanroti/web/public/apps.json`, with the Three-player entry published.
- `./init.sh` could not install dependencies because npm registry DNS returned `ENOTFOUND`. This machine has
  Node 25; `.nvmrc` expects Node 22. Verification used the local Node 25 web-storage workaround.

## Production

Three-player chess and its Beanroti listing are live. The owner approved a v1 exception to the dedicated D1 rule because games save in the browser. Worker versions and smoke evidence are in `feature_list.json` (tpc-003).

## Useful commands

- `npm run dev:threechess`
- `npm run verify`
- `npm run e2e -w apps/threechess/web`
- `npm run build:threechess` · `npm run deploy:threechess`
- `npm run build:beanroti-apps` · `npm run deploy:beanroti-apps`
- Product rules and plan: `packages/threechess/RULES.md`, `apps/threechess/docs/PLAN.md`
