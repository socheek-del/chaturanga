# Chess (international chess) — implementation plan

Fifth product of the Chaturanga family (`docs/PLATFORM.md`): international chess — the FIDE game — as its
own PWA site, sharing engineering but not identity with Makruk, Sittuyin, Xiangqi or Shogi. Features:
`ch-001`..`ch-011` in `feature_list.json`, with the platform-prep feature `plat-014` before them.

Chess is the first game on the platform with **castling** (one move that moves two pieces), with **en
passant** (a capture onto an empty square), and with a **promotion that offers a choice of four pieces**.
The first two turn out to need no platform change; the third does, and that is what `plat-014` is for.

Chess is also the game every visitor already knows. Nothing here is exotic, so the quality bar is the
opposite of the other four products: any wrong rule, sluggish bot or clumsy promotion dialog is noticed
immediately, and there is no "this is how the traditional game works" defence.

Everything below about rules was probed against Fairy-Stockfish's `chess` variant through ffish 0.7.10, the
same reference the four other engines are verified against. Probe output quoted here is real. This plan and
`feature_list.json` are the system of record.

## Owner decisions (proposed defaults — confirm before `ch-001`)

| # | Topic | Proposed decision |
|---|---|---|
| D1 | Languages | **English only** at launch (`en` default, `en` sole language). Chess has no single home language, and every language a product declares becomes a `FamilyLanguage` that needs a name for *every* game in `packages/family`. A second language is `ch-011`, blocked until the owner names it. |
| D2 | Locale code | `en` (BCP 47); Open Graph locale `en_US`. |
| D3 | Rules authority | Fairy-Stockfish `chess`: the FIDE laws as engines implement them — castling, en passant, under-promotion, stalemate is a draw, insufficient material is a draw. Threefold and the fifty-move rule are D11. |
| D4 | Piece faces | An in-house SVG Staunton-style set (the 1849 Staunton *design* is not anyone's copyright; the drawings are ours, not Wikimedia's Cburnett set, which would carry CC BY-SA obligations like the Makruk traditional set in `art-003`). Solid silhouettes that stay readable at 32 px, one path per piece, no font text. |
| D5 | Side names | White and Black. White moves first and maps to the engine colour `w`. This is the one game where the platform's `w`/`b` needs no translation. |
| D6 | Move-list notation | Engine SAN (`Nf3`, `exd6`, `O-O`, `e8=Q`, `Qxf7#`), paired under move numbers, which the shared move list already does. Figurine notation is a later display-only option; moves stay coordinate strings end to end. |
| D7 | Design identity | Its own identity, proposed in `apps/chess/docs/design.md` with screenshots and approved by the owner before the site is styled — the same gate as Sittuyin's "Daung" (`sit-005`), Xiangqi's "Mo" (`xq-004`) and Shogi's (`sg-004`). It must not resemble lichess or chess.com any more than it resembles Duolingo. |
| D8 | Subdomain | Chosen by the owner at the deploy step (`ch-008`). It lives only in `apps/chess/web/site.config.ts` and the Worker's `routes`; never written anywhere else. |
| D9 | UI font | The self-hosted Noto Sans already used for Latin text. No new font: the pieces are SVG paths and the site is Latin-only. |
| D10 | Bot personas | Six bots named after the pieces: Pawn, Knight, Bishop, Rook, Queen, King — the same "named after the pieces" pattern as Xiangqi and Shogi. No Elo numbers on the labels, because a claimed rating invites comparison the search cannot honour. |
| D11 | Threefold repetition and the fifty-move rule | The probe shows Fairy-Stockfish reports these as *claimable*, not automatic (`isGameOver()` false, `result()` `*`; with `claimDraw=true` both become `1/2-1/2`). Proposal: **the engine ends the game automatically** on the third repetition and on the fiftieth move, i.e. the platform plays `claimDraw=true` semantics, with no claim button and no claim message in the online protocol. The divergence from the FIDE claim procedure (and the fact that fivefold and the 75-move rule can therefore never be reached) is written into `packages/chess/RULES.md`. The alternative — a claim button — costs a new protocol message, a new online UI state and a new way for a game to end; it can be added later without changing the engine. |
| D12 | Chess960 | Out of scope. Standard chess only, so castling stays `e1g1` / `e1c1` and the FEN castling field stays `KQkq`. |

## Architecture

Same shape as the four live products, nothing game-specific outside its own folders:

- `packages/chess` (`@chaturanga/chess`): pure rules, `RULES.md`, implements `Variant` from
  `@chaturanga/rules-core`, runs `describeVariantConformance`. `/core` raw API for search code.
- `packages/chess-ai` (`@chaturanga/chess-ai`): bots on `@chaturanga/ai-core`, bundled-Node strength ladder
  (`npm run test:strength -w packages/chess-ai`), run in a Web Worker in the app.
- `apps/chess/web`: React + Vite PWA, its own `product.config.ts`, `site.config.ts`, locales, board art,
  lessons, on `@chaturanga/game-shell` and `@chaturanga/board-ui` (`grid="squares"`, 8x8, files `a`..`h`).
- `apps/chess/worker`: Cloudflare Worker on `@chaturanga/server-kit`, its own D1 and subdomain, dev port
  **:8791** (Makruk :8787, Sittuyin :8788, Xiangqi :8789, Shogi :8790).

## What the engine has to do (probed against ffish 0.7.10)

Probe output, verbatim:

```
startfen: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
castle moves from e1: e1d1,e1f1,e1g1,e1c1
san of castle: O-O / O-O-O
promo moves: e7e8q,e7e8r,e7e8b,e7e8n
san promo: e8=Q e8=N
ep moves: e5e6,e5d6 san: exd6
KB vs K gameover: true result: 1/2-1/2
stalemate gameover: true result: 1/2-1/2
fifty gameover: false * claim: true 1/2-1/2
threefold gameover: false * claim: true 1/2-1/2
```

What that settles:

- **Castling is a king move of two squares** in coordinate notation (`e1g1`, `e1c1`), not king-takes-rook.
  `parseUci` in board-ui already parses it as an ordinary move, so tap-tap and drag both work unchanged.
  The rook is moved by the engine and appears in the next FEN; the board renders from the position, so it
  lands correctly. The last-move highlight will show the king's squares only, which is what most chess sites
  do.
- **Promotion is four moves with the same from→to pair** (`e7e8q|r|b|n`) and no plain move among them. This
  is the one real platform gap: see `plat-014`.
- **En passant is a normal-looking move** (`e5d6`) whose destination is empty. board-ui's target markers do
  not branch on occupancy, so nothing is needed there; `ch-005` confirms it with an E2E case.
- **Stalemate and insufficient material end the game by themselves**; `GameStatus` already has
  `stalemate` (no `winner` = draw) and `insufficient-material`, so no new status kind is needed.
- **Threefold and fifty-move are claimable, not automatic** — the reason D11 exists.
- FEN carries a castling field and an en-passant square. Shogi's FEN reader explicitly rejects a castling
  field; each engine owns its own FEN, so this is `packages/chess`'s business alone.

## Seams found in the platform (gap analysis)

1. **Promotion with more than two outcomes** (`plat-014`, required). `useMoveInput.play()` splits the
   candidates into one `plain` and one `promoting` move. With four promotions and no plain move it silently
   plays the first, i.e. it auto-queens and under-promotion is unreachable. It needs a pending state that
   carries the *list* of choices, and the shared prompt in `GameScreen` needs to render N faces instead of
   yes/no. Makruk (automatic), Sittuyin (in place) and Shogi (binary) must stay untouched.
2. **Diagonal sliding in rules-core.** The shared 8x8 tables grew from the Makruk family, which has no
   bishop and no queen, so there is no diagonal-slider attack table. Add one under a neutral name next to
   the existing rook slider (`packages/rules-core`, no game identity involved); castling rights, the
   en-passant square and the halfmove clock stay inside `packages/chess`.
3. **Nothing needed for online play.** `packages/protocol` and `packages/server-kit` already carry `resign`,
   `offerDraw`, `acceptDraw`, `declineDraw` and rematch, and the room validates every move through the
   product's `Variant`. Chess needs no new message (and gets no chat, per the platform rule).
4. **Family list** (`ch-009`). `GameId` gains `chess` and `GAMES` gains its names in every family language
   (`th`, `my`, `zh-Hans`, `ja`, `en`). If D1 later adds a language, every game needs a name in it — which is
   the reason D1 proposes English only.
5. **Bot strength is the real risk, not the rules.** Chess is where a weak search is obvious. `ai-core`'s
   alpha-beta plus the `repetitionScore` hook (already used by Xiangqi) is the right base, but the evaluation
   has to be a genuine one — material, piece-square tables, pawn structure, king safety — and the ladder has
   to show a clean win rate up the six personas.

## Work breakdown (in order)

### Step 1 — Promotion with a choice of pieces (`plat-014`)
`useMoveInput` gains `pendingPromotion: { from, to, choices: Array<{ uci, piece }> } | null` and
`choosePromotion(uci)`, keeping today's binary behaviour for Shogi (two choices) and playing straight through
when there is only one. `GameScreen` renders one button per choice with the product's own `renderPiece`,
keyboard reachable, dismissable. New shared keys in `packages/game-shell/KEYS.md`.
**Verification:** board-ui unit tests (four choices raise a prompt and each one plays; a single promotion
plays straight through; Shogi's two-choice case unchanged); game-shell unit test for the N-face prompt;
Makruk, Sittuyin and Shogi E2E unchanged.
**Sequencing note:** this touches `packages/board-ui/src/useMoveInput.ts` and
`packages/game-shell/src/ui/GameScreen.tsx`. A parallel Shogi session has `GameScreen.tsx` open (`sg-003`,
`sg-004`). Do not start `plat-014` until that work is committed.

### Step 2 — Chess board, FEN and move generation (`ch-001`)
`packages/chess` on the Xiangqi/Shogi package pattern: 8x8 board over rules-core's tables plus the new
diagonal slider, castling rights and en-passant state in the position, legal move generation including
castling (with the "not out of, through or into check" rule), en passant and all four promotions.
**Verification:** `fen.test.ts` round-trips 10+ ffish positions and rejects 10+ invalid FENs (bad castling
field, impossible en-passant square, two kings, side not to move in check, …); `movegen.test.ts` one test per
piece plus castling, castling blocked and illegal cases, en passant including the pin case, and
under-promotion; `perft.test.ts` against the standard perft suite (start position, Kiwipete, positions 3-6)
to shallow depths in `verify` and full depths under `PERFT_DEEP=1`; `reference.test.ts` lock-step random
games against ffish comparing sorted legal moves, SAN and FEN every ply; `describeVariantConformance` passes.

### Step 3 — Chess game end (`ch-002`)
Checkmate, stalemate (draw), insufficient material, threefold repetition and the fifty-move rule, per D11,
with the decision and its divergence written into `packages/chess/RULES.md`.
**Verification:** `status.test.ts` — a mate, a stalemate, each insufficient-material combination
Fairy-Stockfish recognises, a threefold line, a fifty-move line; each one compared with ffish's
`result(claimDraw)`; the RULES.md statement matches the code.

### Step 4 — Computer opponents (`ch-003`)
`packages/chess-ai` on ai-core: evaluation (material, piece-square tables, pawn structure, king safety,
mobility), quiescence, repetition through `SearchAdapter.repetitionScore`, six personas (D10), Web Worker
client in the app.
**Verification:** bundled-Node ladder `npm run test:strength -w packages/chess-ai` showing each persona
beating the one below over a fixed match; a mate-in-N test set; a fixed-seed game that never plays an illegal
move; node timing showing the top persona's move inside the app's budget on a mid-range phone.

### Step 5 — Design identity and piece art (`ch-004`, owner approval gate)
`apps/chess/docs/design.md`: palette, board colours (light and dark themes), typography from the existing
Noto Sans, and the piece set (D4) with screenshots. **Owner approves before the site is styled.**

### Step 6 — Chess web app (`ch-005`)
`apps/chess/web` on game-shell: pass-and-play, play the computer, move list, clocks, result dialog, settings,
PWA, `en`. Uses `plat-014`'s promotion prompt.
**Verification:** `describeLocales` (every key present), unit tests for the stores, Playwright E2E: a full
pass-and-play game to mate, a castling move, an en-passant capture, an under-promotion to a knight, a
stalemate, and a game against the weakest bot.

### Step 7 — Chess lessons (`ch-006`)
Around 15 lessons: how each piece moves, check and mate, castling, en passant, promotion and
under-promotion, stalemate, the value of the pieces, fork, pin and skewer, back-rank mate, K+Q vs K, K+R vs K,
opening principles.
**Verification:** `describeLessons` (every lesson's moves are legal from its FEN and its goal is reachable);
unit tests for progress storage.

### Step 8 — Chess online play (`ch-007`)
`apps/chess/worker` on server-kit: `GameRoomBase` subclass naming the chess variant, its own D1 for finished
games, rooms, room codes and quick match; lobby and room screens from game-shell; resign and draw offers as
they already exist; no chat.
**Verification:** worker unit tests for the room state machine with the chess variant (including a rejected
illegal move and a rejected move from the wrong seat); an E2E with two browser contexts playing a short game,
one resigning and one draw offer accepted.

### Step 9 — Deploy on its own subdomain (`ch-008`)
Owner picks the subdomain (D8). It lives only in `apps/chess/web/site.config.ts` and the Worker's `routes`.
D1 database created, migrations applied, `npm run deploy:chess` wired at the repo root next to its siblings.
**Verification:** `npm run smoke:prod -w apps/chess/web` against the live site; no domain in any committed
screenshot or doc.

### Step 10 — Chess joins the family links (`ch-009`)
`GameId` gains `chess`; `GAMES` gains its name in every family language; `SITES` reads its
`site.config.ts` / `product.config.ts`; each sibling's `MoreGames` picks it up through `__FAMILY__`.
**Verification:** family unit test that every game has a name in every declared language; each of the five
sites builds and shows four siblings.

### Step 11 — SEO, About page and READMEs (`ch-010`)
Meta and Open Graph tags, sitemap, About page (rules summary, licence, credits), `apps/chess/README.md`,
`apps/chess/AGENTS.md`, `packages/chess/RULES.md` finished, README media captured without the domain.
**Verification:** `seo.test.ts`; the README media script runs; link check.

### Step 12 — A second site language (`ch-011`, blocked on D1)
Blocked until the owner names a second language. Adding one means a new `FamilyLanguage` and a name for every
game in `packages/family`, plus a complete locale file and a native review.

## Terminology

Standard English chess terms throughout: White, Black, check, checkmate, stalemate, castling (kingside,
queenside), en passant, promotion, under-promotion, draw by repetition, the fifty-move rule, insufficient
material. SAN as the engine produces it (D6).

## Risks

- **Familiarity.** Every visitor can spot a rules bug in chess. The perft suite (Kiwipete and friends) plus
  lock-step ffish games are not optional polish here; they are the feature.
- **Bot quality.** A chess bot that hangs pieces reads as broken, not as "easy". If the ladder cannot show a
  convincing top persona inside the phone move budget, `ch-003` stays open rather than shipping a weak bot
  with a strong-sounding name.
- **Search performance in JS.** The Makruk-family move generator is mailbox-style and was never pushed to
  chess depths. If profiling in `ch-003` shows the generator is the bottleneck, the fix belongs in
  `packages/chess` (move ordering, incremental attack state), not in a rewrite of rules-core.
- **Look-alike risk.** Chess sites converge on the same visuals. D7's approval gate exists so the site is not
  a lichess or chess.com clone, the same way `docs/PLATFORM.md` forbids copying Duolingo.
- **Art provenance.** The piece set must be drawn in-house. Wikimedia's chess sets are CC BY-SA and would
  drag attribution obligations into the app, as the Makruk traditional set already does (`art-003`).
- **Parallel sessions.** `plat-014` touches two shared files that a live Shogi session is editing. Sequence,
  do not merge by hand.
