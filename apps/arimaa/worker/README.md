# Arimaa game service

The Arimaa Worker serves the product PWA and owns its private online rooms, quick-match Durable Object, guest-token secret, and isolated D1 archive. Each setup placement and complete turn is replayed through `@chaturanga/arimaa`; room messages do not include chat.

## Local development

Run `npm run dev:arimaa` from the repository root. The worker launcher creates a random ignored `.dev.vars` secret, applies the local `arimaa` D1 migration, and listens on port 8817. The web app proxies `/api` and `/ws` to that port.

## Verify and build

```sh
NODE_OPTIONS=--no-experimental-webstorage npm run typecheck -w apps/arimaa/worker
NODE_OPTIONS=--no-experimental-webstorage npm run test -w apps/arimaa/worker
npm run build:arimaa
```

The integration tests exercise real local Durable Objects, WebSockets, eviction/reconnect, setup clocks, move validation, room archive and rejection of chat messages.

## Melon

Stage a pushed, CI-passing full commit SHA privately on Melon with `scripts/melon/stage.sh arimaa <full-commit-sha> 19920`. The stage has its own signing secret and storage. Public routing remains subject to the product plan's licensing gate and separate public HTTPS/WSS verification.
