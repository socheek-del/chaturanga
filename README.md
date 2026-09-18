<div align="center">

# Chaturanga

**Traditional chess games from across Asia, free and open source, each in its own language.**

[![CI](https://github.com/socheek-del/chaturanga/actions/workflows/ci.yml/badge.svg)](https://github.com/socheek-del/chaturanga/actions/workflows/ci.yml)
[![License: GPL-3.0](https://img.shields.io/badge/license-GPL--3.0-1cb0f6)](LICENSE)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-ff9600)](CONTRIBUTING.md)

</div>

---

Chaturanga, the ancient Indian game, is the common ancestor of chess, Makruk, Sittuyin, Shogi and Xiangqi.
This repository builds its descendants as friendly web apps. Each game has its own site, look and
languages, so you can learn the rules from zero, practise against the computer and play friends online or
on one device.

## Games

| Game | | Status | Languages |
|---|---|---|---|
| [**หมากรุกไทย · Makruk**](apps/makruk/README.md) | Thai chess | ✅ Live: computer, online, pass-and-play, lessons | Thai, English |
| [**စစ်တုရင် · Sittuyin**](apps/sittuyin/README.md) | Burmese chess | ✅ Live: computer, online, pass-and-play, lessons | Burmese, English |
| [**象棋 · Xiangqi**](apps/xiangqi/README.md) | Chinese chess | ✅ Live: computer, online, pass-and-play, lessons | Chinese, English |

More games (Shogi…) may follow. See the [platform plan](docs/PLATFORM.md).

<img src="apps/makruk/docs/media/mobile.png" alt="Makruk on a phone: home, lessons and a game" width="100%" />

## How the repository is organised

The games share engineering but not identity. Everything a player sees (rules, art, lessons, words, site)
belongs to one game. The shared packages hold what every game needs.

| Path | What it is |
|---|---|
| [`packages/rules-core`](packages/rules-core) | The `Variant` interface every rules engine implements, the shared 8×8 board and attacks, and a conformance test suite |
| [`packages/makruk`](packages/makruk) | Makruk rules, verified move-for-move against [Fairy-Stockfish](https://github.com/fairy-stockfish/Fairy-Stockfish) |
| [`packages/sittuyin`](packages/sittuyin) | Sittuyin rules (setup phase, promotion, counting), verified the same way |
| [`packages/xiangqi`](packages/xiangqi) | Xiangqi rules (9×10 point board, palace and river, perpetual check and chase), verified the same way |
| [`packages/ai-core`](packages/ai-core) | Game-independent alpha-beta search and bot personas |
| [`packages/ai`](packages/ai), [`packages/sittuyin-ai`](packages/sittuyin-ai), [`packages/xiangqi-ai`](packages/xiangqi-ai) | Computer opponents for Makruk, Sittuyin and Xiangqi |
| [`packages/ui`](packages/ui), [`packages/board-ui`](packages/board-ui) | Palette-free component primitives; a board of any size with pieces in hand |
| [`packages/game-shell`](packages/game-shell) | Game screen, lesson player, online lobby and room, languages and search tags for every site |
| [`packages/server-kit`](packages/server-kit) | Online rooms, clocks and matchmaking as Durable Objects, driven by a rules `Variant` |
| [`packages/family`](packages/family) | The list of games, so each site can link to the others |
| [`packages/protocol`](packages/protocol) | Message schemas shared by browsers and servers |
| [`apps/makruk`](apps/makruk) | The Makruk product: React PWA (`web`) and Cloudflare Worker (`worker`) |
| [`apps/sittuyin`](apps/sittuyin) | The Sittuyin product: React PWA (`web`) and Cloudflare Worker (`worker`) |
| [`apps/xiangqi`](apps/xiangqi) | The Xiangqi product: React PWA (`web`) and Cloudflare Worker (`worker`) |

## Run it locally

```bash
git clone https://github.com/socheek-del/chaturanga.git
cd chaturanga
nvm use          # Node 22
./init.sh        # install dependencies and run all checks
npm run dev:makruk     # Makruk web on http://localhost:5173, API + online play on :8787
npm run dev:sittuyin   # Sittuyin web on http://localhost:5174, API + online play on :8788
npm run dev:xiangqi    # Xiangqi web on http://localhost:5176, API + online play on :8789
```

## Contributing

Contributions of every size are welcome: bug reports, rule corrections, lessons, translations, art and code.
Start with [**CONTRIBUTING.md**](CONTRIBUTING.md), or
[open an issue](https://github.com/socheek-del/chaturanga/issues/new).

## License

[GPL-3.0-or-later](LICENSE) © Chaturanga contributors. The piece art, mascots and illustrations were made for
this project and are covered by the same license.
