# AGENTS.md: Xiangqi

Xiangqi (象棋, Chinese chess) is a web PWA. It offers:

- single player against six computer opponents named after the pieces
- pass-and-play
- online play by room code or quick match
- 13 interactive lessons
- its own "Mo" (墨, ink) design identity, **proposed and awaiting owner approval** (`apps/xiangqi/docs/design.md`)

The product plan is `apps/xiangqi/docs/PLAN.md`. The platform rules in the root `AGENTS.md` apply here too.
**Not deployed yet:** there is no site address, family link, SEO or README (xq-008, xq-009, xq-010).

## Xiangqi Facts

- **Code:**
  - rules: `packages/xiangqi` (`@chaturanga/xiangqi`), documented in `packages/xiangqi/RULES.md`; `/core` is the
    raw API for search code
  - AI: `packages/xiangqi-ai` (`@chaturanga/xiangqi-ai`)
  - web app: `apps/xiangqi/web` (`@chaturanga/xiangqi-web`)
  - Cloudflare Worker: `apps/xiangqi/worker` (`@chaturanga/xiangqi-worker`). It serves static assets,
    `/api/*`, `/ws/*`, the Durable Objects `GameRoom` and `Matchmaker`, and D1 `xiangqi` (finished games).
    Its `database_id` is a placeholder until xq-008 creates the real database.
- **Language:** Simplified Chinese (`zh-Hans`) is the default; English is the alternative. Every user-visible
  string needs both (`describeLocales` checks it). Native review is xq-011.
- **Rules reference:** start `rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1`. Red is
  `w`. Rule questions are settled against Fairy-Stockfish's `xiangqi` variant.
  - Stalemate loses.
  - Perpetual check and perpetual chase lose at the third occurrence.
  - The 50-move rule has an AXF check offset.
- **Board:** board-ui's `grid="points"` with the `BoardLines` underlay. Points are named like squares (`e1`,
  `a10`). Piece characters are SVG outlines generated from Noto Serif TC (`npm run glyphs`, OFL in
  `src/features/board/OFL.txt`), so no CJK font is ever loaded.
- **Site address:** not chosen yet (owner decision D8). Never write one into code or docs before the owner
  decides in xq-008.
- **Dev and tests:**
  - `npm run dev:xiangqi` runs the Worker on :8789 and the web app on :5176 (it proxies `/api` and `/ws`).
  - `npm run e2e -w apps/xiangqi/web` starts vite (:5177) and wrangler dev with a local D1.
  - `npm run e2e:pwa -w apps/xiangqi/web` checks installability and offline play on a production build.
  - `npm run capture:design -w apps/xiangqi/web` re-takes the design screenshots against `vite preview`.
  - `npm run icons -w apps/xiangqi/web` re-renders the PWA icons from the 帥 glyph.
  - `npm run test:strength -w packages/xiangqi-ai` runs the bot ladder as a bundled Node script (STRENGTH_PAIR,
    STRENGTH_GAMES, STRENGTH_SHARD).
- **Fixtures:**
  - A hand-written FEN is invalid when the two generals face each other on an open file, or when the side not
    to move is in check. Check it with `new Game(fen)` first.
  - Only generals, advisors and elephants is insufficient material and ends the game at once; keep a chariot,
    horse, cannon or soldier on the board when a test needs play to go on.
