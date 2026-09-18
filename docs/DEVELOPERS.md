# Developer guide

Everything needed to build, test and deploy Chaturanga. Players want [the main README](../README.md); this
file is for people changing the code.

- **Contributing rules and review expectations:** [`CONTRIBUTING.md`](../CONTRIBUTING.md)
- **Why the repository is shaped this way, and what comes next:** [`docs/PLATFORM.md`](PLATFORM.md)
- **Facts about one game:** `apps/<game>/AGENTS.md`, and `packages/<game>/RULES.md` for its rules as
  implemented

## The one rule of the layout

The games share engineering but not identity. Everything a player sees — rules, art, lessons, words, site
address, languages — belongs to exactly one game and lives in that game's folders (`apps/<game>/`,
`packages/<game>/`). The shared packages hold only what every game needs. **Adding a game must never edit
another game's files.**

Each game is its own product: its own subdomain, brand, PWA, languages, Cloudflare Worker and D1 database.
Games reference each other only through the "more games" section, which is generated from
[`packages/family`](../packages/family).

## Stack

npm workspaces · TypeScript · React 19 + Vite · Tailwind v4 · Cloudflare Workers + Durable Objects + D1 ·
Vitest · Playwright. Node version is pinned in [`.nvmrc`](../.nvmrc) — run npm and vitest under it
(`nvm use`), because the default Node on many machines makes npm skip rolldown's native binding and vitest
then fails to start.

## Repository layout

| Path | What it is |
|---|---|
| [`packages/rules-core`](../packages/rules-core) | The `Variant` interface every rules engine implements, the shared 8×8 board and attacks, and a conformance test suite |
| [`packages/makruk`](../packages/makruk) | Makruk rules, verified move-for-move against [Fairy-Stockfish](https://github.com/fairy-stockfish/Fairy-Stockfish) |
| [`packages/sittuyin`](../packages/sittuyin) | Sittuyin rules (setup phase, promotion, counting), verified the same way |
| [`packages/xiangqi`](../packages/xiangqi) | Xiangqi rules (9×10 point board, palace and river, perpetual check and chase), verified the same way |
| [`packages/ai-core`](../packages/ai-core) | Game-independent alpha-beta search and bot personas |
| [`packages/ai`](../packages/ai), [`packages/sittuyin-ai`](../packages/sittuyin-ai), [`packages/xiangqi-ai`](../packages/xiangqi-ai) | Computer opponents for Makruk, Sittuyin and Xiangqi |
| [`packages/ui`](../packages/ui), [`packages/board-ui`](../packages/board-ui) | Palette-free component primitives; a board of any size with pieces in hand |
| [`packages/game-shell`](../packages/game-shell) | Game screen, lesson player, online lobby and room, languages and search tags for every site |
| [`packages/server-kit`](../packages/server-kit) | Online rooms, clocks and matchmaking as Durable Objects, driven by a rules `Variant` |
| [`packages/family`](../packages/family) | The list of games, so each site can link to the others |
| [`packages/protocol`](../packages/protocol) | Message schemas shared by browsers and servers |
| [`apps/makruk`](../apps/makruk) | The Makruk product: React PWA (`web`) and Cloudflare Worker (`worker`) |
| [`apps/sittuyin`](../apps/sittuyin) | The Sittuyin product: React PWA (`web`) and Cloudflare Worker (`worker`) |
| [`apps/xiangqi`](../apps/xiangqi) | The Xiangqi product: React PWA (`web`) and Cloudflare Worker (`worker`) |

A rules engine is pure: no DOM, no network, no timers, and no randomness without an injected seed. Each one
follows the matching Fairy-Stockfish variant and is checked against it.

## Run it locally

```bash
git clone https://github.com/socheek-del/chaturanga.git
cd chaturanga
nvm use          # Node version from .nvmrc
./init.sh        # install dependencies and run all checks
```

Then start one product:

| Game | Command | Web | Worker |
|---|---|---|---|
| Makruk | `npm run dev:makruk` | http://localhost:5173 | :8787 |
| Sittuyin | `npm run dev:sittuyin` | http://localhost:5174 | :8788 |
| Xiangqi | `npm run dev:xiangqi` | http://localhost:5176 | :8789 |

Each command runs that game's Cloudflare Worker (with a local D1) beside its Vite dev server, which proxies
`/api` and `/ws` to it.

## Checks

| Command | What it runs |
|---|---|
| `npm run verify` | Lint, type checks and unit tests in every workspace, including the Workers inside `workerd` |
| `npm run e2e -w apps/<game>/web` | Playwright against a local web app and Worker |
| `npm run e2e:pwa -w apps/<game>/web` | Installability and offline play on a production build |
| `npm run smoke:prod -w apps/xiangqi/web` | The live site, starting no server of its own |
| `npm run test:deep -w packages/<game>` | Perft to every depth plus 400 lock-step games against ffish |
| `npm run test:strength -w packages/<game>-ai` | The bot ladder (slow; also runs on Actions as "Bot strength ladder") |

CI runs `verify` and the builds on every push and pull request, and deploys each product only when that
product's own folders, a shared package or the lock file changed.

## Deploying

No site address is hardcoded. Each app reads its own address from `apps/<game>/web/site.config.ts`, which can
be overridden per product at build time (`MAKRUK_SITE_URL`, `SITTUYIN_SITE_URL`, `XIANGQI_SITE_URL`). Moving a
site to another domain is covered step by step in
[CONTRIBUTING.md](../CONTRIBUTING.md#deploying-to-your-own-domain).

Each product deploys with `npm run deploy:<game>`, which applies that game's D1 migrations and then publishes
its Worker. In production this happens from CI, not from a laptop.
