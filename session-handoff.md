# Session Handoff

## Active work

- Implement the [42-entry rollout](docs/CHESS-LIKE-ROADMAP.md) one product at a time. Every game requires an interactive tutorial, a bot mode and applicable multiplayer.
- Current feature is `tpc-007`, Three-player Chess online invite rooms. Shatranj public release is blocked on DNS. Record only verified evidence in `feature_list.json` and `claude-progress.md`.
- Push verified increments directly to main. Use GitHub Actions for verification and Melon over SSH for release. Cloudflare is a fallback when a documented Melon limitation prevents delivery.

## Verified

- `./init.sh` passed using Node 22.23.1 from `/private/tmp/node22/node_modules/.bin` on this machine.
- All seven Melon origins returned HTTP 200 on ports 19787–19793. The existing Caddy and workerd containers are live.
- The isolated Makruk probe on port 19887 verified static assets, authenticated room creation, WebSocket state and recovery after restarting the container. Its state and bundle scratch directory are separate from production.
- `scripts/melon/stage.sh <product> <full-commit-sha> <free-loopback-port>` builds a pinned commit and starts a separate stage. It does not modify Caddy. Use product health and assets to confirm the stage, then record evidence.

## Melon release workflow

plat-022 passed. The 8ee28c4 Makruk and Beanroti stages, migrations and repeat run, two-seat WebSockets, backup restore and HTTPS rollback were verified. Melon’s live catalog matches the staged data. Use [the runbook](docs/MELON-RELEASE.md) for Shatranj. Its release still needs its own hostname, public smoke and catalog update.

## Shatranj

The classical engine, rule fixtures and seeded Fairy-Stockfish comparison are complete in `packages/shatranj`. Next build the bot and product, then verify the tutorial, both human bot seats, local and invite play, and the public Melon release.

Update: Shatranj now has its bot, PWA, tutorial and server. Local Playwright passed all five scenarios. Stage the pushed product on Melon and verify production build assets and a real room. Public DNS for `shatranj.beanroti.com` was absent and the available token lacks DNS edit. The existing game certificate covers seven explicit names and omits Shatranj. Once DNS resolves to Melon, configure Caddy to obtain TLS for the new hostname, run public HTTPS and WebSocket smoke, then publish the directory entry.

Melon stage 9232a07 is healthy as `chaturanga-stage-shatranj-19897` in `~/chaturanga-release.shatranj.AUuZbW`. Its migration and six deployed browser checks passed. Keep its state and promote the staged container when DNS is ready.

## Three-player Chess

The tutorial and coordinate labels are live from 3154fc8 on Melon port 19899, with five public browser checks passing. Bot mode is live from 8771c1c on Melon port 19900. All nine browser tests passed locally, on the stage and on the public site. Port 19899 still serves the preceding tutorial release for rollback. Next implement three-seat online invites and reconnects with isolated persisted state.

Online implementation is on main after the local 11-scenario browser pass. Stage the exact online revision, verify the persisted room through a container restart, and run public HTTPS/WebSocket smoke. Current rollback origin is port 19900 (bots and tutorial).
