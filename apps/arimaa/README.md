# Arimaa

Arimaa is a separate English-language PWA for the official standard two-player game. The product includes an original geometric board identity, chosen army setup, pass-and-play, six seeded local bot levels, saved games and a 15-lesson interactive tutorial.

## Run locally

```sh
npm run dev:arimaa
# or run the independent Vite UI alone:
npm run dev -w apps/arimaa/web
```

The app uses Vite port 5207 and Worker port 8817. The worker launcher creates a private local signing secret and applies the local Arimaa archive migration. The product reads its own address from `ARIMAA_SITE_URL` (default `https://arimaa.beanroti.com`).

## Verify and build

```sh
NODE_OPTIONS=--no-experimental-webstorage npm run test -w apps/arimaa/web
NODE_OPTIONS=--no-experimental-webstorage npm run test -w apps/arimaa/worker
NODE_OPTIONS=--no-experimental-webstorage npm run build -w apps/arimaa/web
npm run build:arimaa
```

The tutorial exercises the same `@chaturanga/arimaa` rules engine as game play. Local sessions and lessons work offline after the PWA service worker installs. Private invite rooms and quick-match use Arimaa's isolated server-kit Worker and archive; every setup placement and full turn is validated by the server.

Stage a committed, verified revision privately on Melon with `scripts/melon/stage.sh arimaa <full-commit-sha> 19920`. The staged service owns its Worker state and D1 archive. Public promotion remains separately gated by the license conditions below and public hostname checks.

## Release conditions

See [the product plan](docs/PLAN.md) and [rules contract](../../packages/arimaa/RULES.md). Public release remains gated by the Arimaa Public License v2025.02 conditions recorded there. No external announcement or rights-holder contact has been made.
