# Session Handoff

## Active work

- Implement the [42-entry rollout](docs/CHESS-LIKE-ROADMAP.md) one product at a time. Every game requires an interactive tutorial, a bot mode and applicable multiplayer.
- Current feature is `plat-022`. Next is `shatranj-001`, then the Three-player Chess tutorial, bots and online play. Record only verified evidence in `feature_list.json` and `claude-progress.md`.
- Push verified increments directly to main. Use GitHub Actions for verification and Melon over SSH for release. Cloudflare is a fallback when a documented Melon limitation prevents delivery.

## Verified

- `./init.sh` passed using Node 22.23.1 from `/private/tmp/node22/node_modules/.bin` on this machine.
- All seven Melon origins returned HTTP 200 on ports 19787–19793. The existing Caddy and workerd containers are live.
- The isolated Makruk probe on port 19887 verified static assets, authenticated room creation, WebSocket state and recovery after restarting the container. Its state and bundle scratch directory are separate from production.
- `scripts/melon/stage.sh <product> <full-commit-sha> <free-loopback-port>` builds a pinned commit and starts a separate stage. It does not modify Caddy. Use product health and assets to confirm the stage, then record evidence.

## Remaining release verification

Apply and verify SQL migrations in standalone workerd, test backup and restore, implement Caddy promotion and rollback, and confirm HTTPS plus WebSockets. Confirm the Beanroti catalog on Melon before publishing new entries. Keep the staging data isolated from production.
