# Session Handoff

## Active work

- Implement the [42-entry rollout](docs/CHESS-LIKE-ROADMAP.md) one product at a time. Every game requires an interactive tutorial, a bot mode and applicable multiplayer.
- Current feature is `shatranj-001`. Next are the Three-player Chess tutorial, bots and online play. Record only verified evidence in `feature_list.json` and `claude-progress.md`.
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
