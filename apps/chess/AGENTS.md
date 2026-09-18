# AGENTS.md: Chess

International chess — the FIDE game — as a web PWA. It offers:

- single player against six computer opponents named after the pieces
- pass-and-play
- online play by room code or quick match
- 16 interactive lessons
- its own "Marble" design identity, **proposed and awaiting owner approval** (`apps/chess/docs/design.md`)

The product plan is `apps/chess/docs/PLAN.md`. The platform rules in the root `AGENTS.md` apply here too.

## Chess facts

- **Code:**
  - rules: `packages/chess` (`@chaturanga/chess`), documented in `packages/chess/RULES.md`; `/core` is the
    raw API for search code
  - AI: `packages/chess-ai` (`@chaturanga/chess-ai`)
  - web app: `apps/chess/web` (`@chaturanga/chess-web`), dev on :5178, preview on :4178
  - Cloudflare Worker: `apps/chess/worker` (`@chaturanga/chess-worker`), dev on :8791. It serves static
    assets, `/api/*`, `/ws/*`, the Durable Objects `GameRoom` and `Matchmaker`, and D1 `chess` (finished
    games).
- **Language:** English only (`en`). Chess has no single home language, and every language a product
  declares becomes a family language that needs a name for every game in `packages/family`. A second
  language is `ch-011`, blocked until the owner names one.
- **Sides:** White is the engine colour `w` and moves first; Black is `b`. This is the one game in the
  family where the engine's colours need no translation.
- **Rules reference:** start `rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1`. Rule questions are
  settled against Fairy-Stockfish's `chess` variant through ffish, **with one documented divergence**
  (`packages/chess/RULES.md`): threefold repetition and the fifty-move rule end the game here instead of
  being claimed (owner decision D11).
  - Castling is written as a king move of two squares (`e1g1`, `e1c1`), SAN `O-O` / `O-O-O`.
  - A capture in passing is an ordinary-looking pawn move onto an empty square (`e5d6`, SAN `exd6`).
  - A promotion names its piece (`e7e8q`, `e7e8r`, `e7e8b`, `e7e8n`); the site asks which one
    (`plat-014`), so under-promotion is reachable.
  - The en passant square goes into a FEN whenever an enemy pawn attacks it, even when the capture itself
    would be illegal — that is what Fairy-Stockfish writes.
- **Art:** two piece sets (ch-012). The default is **traditional** — Cburnett's Staunton set from Wikimedia
  Commons, stored verbatim in `src/features/board/pieces/traditional/` with `CREDITS.md`, re-downloaded by
  `npm run pieces -w apps/chess/web`, triple-licensed GPLv2+/BSD/CC BY-SA 3.0 and shipped under the GPL, with
  the author credited on the About page. The other is **marble**, drawn in this repository as SVG paths
  (`src/features/board/PieceSvg.tsx`); the king of that set is the site's mark (`logo.ts`). Never edit a file
  in `pieces/traditional/` by hand.
- **Board:** the squares are transparent and the chequer is one SVG underlay (`Chequer.tsx`), so no
  chess-only idea leaked into `@chaturanga/board-ui`.

## Commands

```bash
npm run dev:chess                          # web + worker
npm run build:chess                        # both
npm run deploy:chess                       # D1 migrations, then deploy
npm test -w packages/chess                 # rules engine
npm run test:deep -w packages/chess        # full perft + 400 ffish games
npm run test:strength -w packages/chess-ai # bot ladder
npm run e2e -w apps/chess/web              # Playwright (starts vite + wrangler)
npm run smoke:prod -w apps/chess/web       # drives the live site
npm run icons -w apps/chess/web            # PWA icons from the king mark
npm run og -w apps/chess/web               # Open Graph image
npm run capture:design -w apps/chess/web   # design review screenshots
BASE_URL=<live site> npm run capture:readme -w apps/chess/web
```

## Conventions

- The site address lives only in `apps/chess/web/site.config.ts` and the Worker's `routes`. Never hardcode
  it, and never let it appear in a screenshot, a GIF or a doc.
- Every user-visible string goes through an i18n key; `describeLocales` checks the locale file is complete.
- Lesson text lives with the lesson data (`src/features/learn/lessons.ts`), not in the locale file, and
  `describeLessons` checks every position and answer against the real engine.
- No chat, anywhere, in online play.
