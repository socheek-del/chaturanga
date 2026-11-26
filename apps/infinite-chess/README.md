# Open Plane — Infinite Chess

Open Plane is the Chaturanga family's Infinite Chess Classical product. It provides local games against three
deterministic bounded bots, pass-and-play, ten interactive lessons, installable offline play, and private two-player
invite rooms. The Worker validates every online move through the same rules engine; rooms have no chat.

## Development

From the repository root, use the Node version in `.nvmrc` and run:

```sh
npm run dev:infinite-chess
npm run build:infinite-chess
```

The web app runs on port 5230 and the local Worker on port 8825. Focused checks are:

```sh
npm test -w packages/infinite-chess
npm test -w packages/infinite-chess-ai
npm test -w apps/infinite-chess/web
npm test -w apps/infinite-chess/worker
npm run e2e -w apps/infinite-chess/web
npm run e2e:pwa -w apps/infinite-chess/web
```

`packages/infinite-chess` contains the sparse exact-coordinate rules engine. `packages/infinite-chess-ai` contains the
seeded bot. The independent PWA and isolated online service live in `web/` and `worker/`. Shared repository code used
by the product is part of the complete corresponding source in the repository root.

The bots deliberately search a finite candidate set because an unbounded board gives sliding pieces infinitely many
empty destinations. Every selected move is checked by the rules engine. Beginner, Club and Strong currently use
bounded one-ply scoring, with wider move candidates and less randomness at higher levels.

## Rules, attribution, and license

The selected profile is the official Classical default from [InfiniteChess.org](https://www.infinitechess.org/guide).
The implementation, board interface, art, and lesson wording are original. The research and rights record is in
[`docs/PLAN.md`](docs/PLAN.md) and [`docs/reports/Infinite Chess rules adoption and rights.md`](docs/reports/Infinite%20Chess%20rules%20adoption%20and%20rights.md).
The visual identity is recorded in [`docs/design.md`](docs/design.md).

Product-specific source is licensed under AGPL-3.0-or-later; the complete license text is in [`COPYING`](COPYING).
See [`NOTICE.md`](NOTICE.md) for rule-source and font attribution. The prominent in-product source link points to
this file and the complete corresponding source at the public repository.

## Melon staging

Push a verified commit to `main`, confirm exact-commit CI, then run:

```sh
INFINITE_CHESS_SHA=<full-commit-sha> npm run stage:infinite-chess
```

This uses `ssh melon` and the private stage port 19925. It creates its own persistent Worker state directory and does
not change Caddy or the app directory. Public promotion requires the hostname to resolve to Melon and pass HTTPS,
TLS, health, and WebSocket checks.
