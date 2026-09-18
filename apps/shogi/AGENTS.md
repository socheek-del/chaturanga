# AGENTS.md: Shogi

Shogi (将棋, Japanese chess) is a web PWA. It offers:

- single player against six computer opponents named after the pieces
- pass-and-play
- online play by room code or quick match
- 15 interactive lessons
- its own "Kaya" (榧) design identity, **proposed and awaiting owner approval** (`apps/shogi/docs/design.md`)

The product plan is `apps/shogi/docs/PLAN.md`. The platform rules in the root `AGENTS.md` apply here too.

## Shogi Facts

- **Code:**
  - rules: `packages/shogi` (`@chaturanga/shogi`), documented in `packages/shogi/RULES.md`; `/core` is the
    raw API for search code
  - AI: `packages/shogi-ai` (`@chaturanga/shogi-ai`)
  - web app: `apps/shogi/web` (`@chaturanga/shogi-web`)
  - Cloudflare Worker: `apps/shogi/worker` (`@chaturanga/shogi-worker`). It serves static assets, `/api/*`,
    `/ws/*`, the Durable Objects `GameRoom` and `Matchmaker`, and D1 `shogi` (finished games).
- **Language:** Japanese (`ja`) is the default; English is the alternative. Every user-visible string needs
  both (`describeLocales` checks it). Native review is sg-011.
- **Sides:** 先手 Sente is the engine colour `w` and moves first; 後手 Gote is `b`. Shogi calls the first
  player "Black", the opposite of every other game here, so the UI never says black or white.
- **Rules reference:** start `lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL[] w - - 0 1`. Rule
  questions are settled against Fairy-Stockfish's `shogi` variant, **with two documented exceptions**
  (`packages/shogi/RULES.md`): this engine forbids uchifuzume, which Fairy-Stockfish does not implement, and
  neither engine adjudicates impasse.
  - A captured piece changes owner and can be dropped back; a drop is a move.
  - Promotion is optional on a move into, out of or inside the last three ranks, and forced when the piece
    would otherwise have no move.
  - Stalemate loses. Sennichite (the fourth occurrence of a position) is a draw, unless one side checked
    throughout, which loses.
  - There is no n-move rule; the halfmove counter resets on a capture, a drop or a promotion.
- **Board:** board-ui's default `grid="squares"`, 9x9, with the `StarPoints` underlay. Squares are named
  `a1`..`i9` in the engine, while the UI writes files 9…1 and ranks 一…九 (`FILE_LABELS`, `RANK_LABELS` in
  `src/features/game/GameScreen.tsx`, plat-013). Piece kanji are SVG outlines generated from Noto Serif JP
  (`npm run glyphs`, OFL in `src/features/board/OFL.txt`), so no Japanese font is ever loaded.
- **Site address:** read it from `apps/shogi/web/site.config.ts` (`SITE_URL`), never write it anywhere else;
  override it per build with `SHOGI_SITE_URL`. Moving domains means that default and `routes` in
  `apps/shogi/worker/wrangler.jsonc`, nothing else.
- **Dev and tests:**
  - `npm run dev:shogi` runs the Worker on :8790 and the web app on :5177 (it proxies `/api` and `/ws`).
  - `npm run e2e -w apps/shogi/web` starts vite (:5177) and wrangler dev with a local D1.
  - `npm run e2e:pwa -w apps/shogi/web` checks installability and offline play on a production build.
  - `npm run capture:design -w apps/shogi/web` re-takes the design screenshots against `vite preview`.
  - `npm run icons -w apps/shogi/web` re-renders the PWA icons from the 王 glyph.
  - `npm run test:strength -w packages/shogi-ai` runs the bot ladder as a bundled Node script (STRENGTH_PAIR,
    STRENGTH_GAMES, STRENGTH_SHARD).
- **Fixtures:**
  - A hand-written FEN is invalid when the side not to move is already in check, or when a king is missing.
    Check it with `new Game(fen)` first — a rook or lance on the same file as the enemy king is the usual
    mistake.
  - A square can be two characters (`+P`), and pieces in hand go in `[...]` in Fairy-Stockfish's order
    `G N L P S R B`, Sente first.
  - The bishop on b2 has no move at all from the start position: its own pawns block every diagonal.
