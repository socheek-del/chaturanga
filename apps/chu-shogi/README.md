# Chu Shogi · The Meridian Table

An independent English Chu Shogi PWA using the Chu Shogi Renmei competition profile (2019), with its 2004 Lion clarifications. The plan records the edition, source trail, and digital conventions; this product does not claim association affiliation or that this edition is the most popular.

The product includes local pass-and-play, six bounded bots, locally saved games, twelve interactive lessons, a 29-rank reference atlas, and private server-authoritative two-player rooms. Complete Lion routes are one move in the rules engine, bot search, room protocol, replay, and route picker. Online rooms have no chat.

## Development

Use the repository's pinned Node version (`.nvmrc`). From the repository root:

```sh
npm run dev:chu-shogi
npm run build:chu-shogi
npm run typecheck -w apps/chu-shogi/web
npm run typecheck -w apps/chu-shogi/worker
npm run test -w apps/chu-shogi/web
npm run test -w apps/chu-shogi/worker
```

The web app runs on port 5207 and proxies `/api` and `/ws` to its local Worker on 8819. The Worker creates a private local signing secret and migrates its local D1 on startup. The production web origin is configured only through `CHU_SHOGI_SITE_URL` in `web/site.config.ts`.

## Service and release

`worker/` owns this product's Durable Object namespaces and D1 archive. Its migration stores completed room records; room moves are replayed through `@chaturanga/chu-shogi` before acceptance. The deployment target is Melon over `ssh melon`. Follow [`../../docs/MELON-RELEASE.md`](../../docs/MELON-RELEASE.md) and stage a pushed, CI-passing revision on port 19919. Do not add a public route or app-directory listing until product-name review, DNS, TLS, HTTPS and WebSocket smoke pass.

See [`docs/PLAN.md`](docs/PLAN.md), [`docs/design.md`](docs/design.md), and [`../../packages/chu-shogi/RULES.md`](../../packages/chu-shogi/RULES.md) for the product and selected rules profile.
