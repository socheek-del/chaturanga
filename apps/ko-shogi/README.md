# Ko Shogi

An independent English PWA for **Ko Shogi, reconstructed rules**, a source-based historical reconstruction. The game includes local play, six bounded bots, an interactive tutorial, an illustrated piece atlas, saved games, offline installation and private online rooms.

The selected rules and reconstruction choices are documented in [`../../packages/ko-shogi/RULES.md`](../../packages/ko-shogi/RULES.md). Historical source, adoption and rights notes are in [`docs/PLAN.md`](docs/PLAN.md) and the linked research notes. This product does not claim that one version is the most popular or uncontested.

## Development

From the repository root, run `npm run dev:ko-shogi`. The web app is served on port 5231 and its local Worker on port 8794. Build both product parts with `npm run build:ko-shogi`.

The standalone web and Worker test suites run with `npm test -w apps/ko-shogi/web` and `npm test -w apps/ko-shogi/worker`. The Worker validates online moves with the Ko Shogi rules engine and stores room state in its own Durable Objects.

## Deployment

Deployments and private staging use Melon through `ssh melon`; the private stage port is 19926. `KO_SHOGI_SITE_URL` stays unset until the product hostname resolves and TLS is verified. Do not publish a Caddy route or app-directory entry before HTTPS and WebSocket smoke passes.
