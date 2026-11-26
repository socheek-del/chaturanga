# Arimaa

Arimaa is a separate English-language PWA for the official standard two-player game. The product includes an original geometric board identity, chosen army setup, pass-and-play, six seeded local bot levels, saved games and a 15-lesson interactive tutorial.

## Run locally

```sh
npm run dev -w apps/arimaa/web
```

The Vite app uses port 5207 and reads its own address from `ARIMAA_SITE_URL` (default `https://arimaa.beanroti.com`). Its `/api` and `/ws` development proxies are reserved for the isolated Arimaa Worker.

## Verify and build

```sh
NODE_OPTIONS=--no-experimental-webstorage npm run test -w apps/arimaa/web
NODE_OPTIONS=--no-experimental-webstorage npm run build -w apps/arimaa/web
```

The tutorial exercises the same `@chaturanga/arimaa` rules engine as game play. Local sessions and lessons work offline after the PWA service worker installs. Private online rooms and their isolated Melon Worker are the next implementation increment.

## Release conditions

See [the product plan](docs/PLAN.md) and [rules contract](../../packages/arimaa/RULES.md). Public release remains gated by the Arimaa Public License v2025.02 conditions recorded there. No external announcement or rights-holder contact has been made.
