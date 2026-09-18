# Contributing to Chaturanga

Thanks for helping make traditional chess games easier to learn and play! Bug reports, rule corrections,
lessons, translations, art and code are all welcome, for any of the games.

## Ways to help

- **Report a bug or suggest an idea.** [Open an issue](https://github.com/socheek-del/chaturanga/issues/new)
  and say which game it is about. Include the page, your device and browser, and the steps to reproduce.
- **Check a translation.** Native speakers can review wording and terminology:
  - Thai (Makruk): [`apps/makruk/docs/i18n-review.md`](apps/makruk/docs/i18n-review.md)
- **Rules questions.** Each engine follows the matching Fairy-Stockfish variant:
  [`packages/makruk/RULES.md`](packages/makruk/RULES.md) and
  [`packages/sittuyin/RULES.md`](packages/sittuyin/RULES.md). If you think a rule is wrong, open an issue
  with a position (FEN).
- **Code, lessons and art.** Pick an issue or propose a change, then open a pull request.

## Development setup

```bash
nvm use            # Node version from .nvmrc
./init.sh          # installs dependencies (npm 11) and runs the full verification
npm run dev        # Makruk web on http://localhost:5173, worker on :8787
```

Project layout. Each game keeps everything players see in its own folders:

| Path | What lives there |
|---|---|
| `packages/rules-core` | The `Variant` interface, shared 8×8 board and attacks, rules conformance tests |
| `packages/makruk` | Pure Makruk rules (moves, check, counting rules, FEN) |
| `packages/sittuyin` | Pure Sittuyin rules (setup phase, promotion, counting, FEN) |
| `packages/ai` | Makruk computer opponents (search + evaluation, runs in a Web Worker) |
| `packages/protocol` | Shared request and WebSocket message schemas |
| `apps/makruk/web` | Makruk React PWA (board, lessons, pass-and-play, online client) |
| `apps/makruk/worker` | Makruk Cloudflare Worker: API, online game rooms (Durable Objects), matchmaking |

## Before you open a pull request

- `npm run verify` passes (lint, type checks, unit tests in every workspace).
- `npm run e2e` passes for Makruk UI changes (Playwright starts the web app and a local worker).
- Every user-visible string exists in every language its game supports. Makruk: Thai (`th.json`, the
  default) and English (`en.json`).
- Game-specific content (rules, art, lessons, words) stays in that game's folders.
- Rules changes come with engine tests against Fairy-Stockfish. Changes to the Makruk computer opponents
  should re-run the strength ladder (Actions → "Bot strength ladder").
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`,
  `docs:` …).

Product rules: no chat of any kind in online play, and the server validates every online move.

## Deploying to your own domain

No site address is hardcoded in the apps. To move the Makruk site, or run your own copy:

1. In `apps/makruk/web/site.config.ts`, change the default `SITE_URL` (or build with
   `MAKRUK_SITE_URL=https://example.com`). Canonical links, language alternates, Open Graph tags, structured
   data, `robots.txt`, `sitemap.xml` and the other family sites' "more games" links are all generated from it.
2. In `apps/makruk/worker/wrangler.jsonc`, set `routes` (custom domain) and `PUBLIC_ORIGIN`.
3. In `apps/makruk/README.md` and `README.th.md`, update the `[play]` link definition at the bottom of each
   file, and in the root [`README.md`](README.md) the matching definition in the block at the bottom.
4. Deploy, then submit `https://<your-domain>/sitemap.xml` in Google Search Console.

## License

By contributing you agree that your contributions are licensed under the project's
[GPL-3.0-or-later](LICENSE) license.
