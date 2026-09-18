# Shogi (将棋) — implementation plan

Fourth product of the Chaturanga family (`docs/PLATFORM.md`): Japanese chess as its own PWA site, Japanese by
default with English, sharing engineering but not identity with Makruk, Sittuyin or Xiangqi. Features:
`sg-001`..`sg-011` in `feature_list.json`, with the platform-prep features `plat-011`, `plat-012`, `plat-013`
before them.

Shogi is the first game where **captured pieces come back**. Sittuyin already puts pieces in hand, but only
during a setup phase before play; Shogi's hands fill and empty for the whole game, a captured piece changes
owner, and a drop is a normal move. It is also the first game with an **optional promotion**: on many moves a
player may promote or decline, so the same from→to pair is two different legal moves. The platform-prep
features exist to remove those two assumptions, plus board coordinate labels, without touching any other
game's files.

Everything below about the rules engine was probed against Fairy-Stockfish's `shogi` variant through ffish
0.7.10, the same reference the three live engines are verified against. Probe output quoted here is real; the
open items are marked "probe". This plan and `feature_list.json` are the system of record.

## Owner decisions (proposed defaults — confirm before `sg-001`)

| # | Topic | Proposed decision |
|---|---|---|
| D1 | Languages | `ja` (Japanese, default) and `en`. Every string in both; native review is `sg-011`. |
| D2 | Locale code | `ja` (BCP 47); Open Graph locale `ja_JP`. |
| D3 | Rules authority | Fairy-Stockfish `shogi`: standard modern rules, drops, optional promotion, nifu, uchifuzume, stalemate loses, fourfold repetition draws, perpetual check loses. Impasse (jishogi) is D11. |
| D4 | Piece faces | Kanji on a five-sided wedge tile, drawn as **SVG paths, not font text**, so the board never needs a Japanese font. Promoted faces in the traditional red ink. |
| D5 | Side names | 先手 Sente and 後手 Gote, with ☗/☖. Sente moves first and maps to the engine colour `w`. The UI never says "black" or "white": in Shogi "Black" is the *first* player, which would contradict every other game on the platform. |
| D6 | Move-list notation | Engine SAN first (e.g. `Pxg9=G`, `S@a2`). Japanese (`▲７六歩`) and Western (`P-7f`) notation are display-only features for later; moves stay coordinate strings end to end. |
| D7 | Design identity | Its own identity, proposed in `apps/shogi/docs/design.md` with screenshots and approved by the owner before the site is styled — the same gate as Sittuyin's "Daung" (`sit-005`) and Xiangqi's "Mo" (`xq-004`). |
| D8 | Subdomain | Chosen by the owner at the deploy step (`sg-008`). It lives only in `apps/shogi/web/site.config.ts` and the Worker's `routes`; never written anywhere else. |
| D9 | UI font | System Japanese stack (`"Hiragino Kaku Gothic ProN", "Yu Gothic", "Noto Sans JP", sans-serif`) plus the self-hosted Noto Sans already used for Latin text. Piece kanji are SVG paths (D4), so the PWA never precaches a multi-MB CJK font. |
| D10 | Bot personas | Six bots named after the pieces: 歩 Fu (Pawn), 桂 Keima (Knight), 銀 Gin (Silver), 金 Kin (Gold), 角 Kaku (Bishop), 飛 Hisha (Rook). |
| D11 | Impasse (jishogi) | Implement the 27-point declaration rule, but **only if the probe in `sg-002` shows Fairy-Stockfish scores it the same way**. If it does not, Shogi ships without a declaration button, impasse positions end by the fourfold-repetition or 50-move-style path the engine already has, and the divergence is written into `packages/shogi/RULES.md`. Never diverge silently. |
| D12 | Board coordinates | Files labelled 9→1 right to left and ranks 一→九 top to bottom, as on a real board, while the engine keeps `a`..`i` × `1`..`9`. The mapping is display-only (`plat-013`). |

## Architecture

Same shape as the other three products; nothing Shogi-specific leaves its own folders.

```
packages/shogi/        @chaturanga/shogi      pure rules, implements Variant; /core is the raw API for search
packages/shogi-ai/     @chaturanga/shogi-ai   bots on ai-core, in a Web Worker
apps/shogi/web/        the site: React + Vite + Tailwind, ja/en, PWA
apps/shogi/worker/     Cloudflare Worker on server-kit: GameRoom + Matchmaker + its own D1
```

Reused unchanged: `rules-core` (Variant, coords, errors, conformance, ffish loader), `ai-core` (search,
personas), `protocol`, `ui`, `board-ui` (board, hand trays, move input), `game-shell` (game screen, lessons,
online client), `server-kit` (rooms, clocks, seat tokens), `family` (sibling links).

## What the engine has to do (probed against ffish 0.7.10)

Start position, exactly as Fairy-Stockfish writes it:

```
lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL[] w - - 0 1
```

- 30 legal moves at the start (ffish agrees exactly).
- Sente is the engine colour `w` and sits on ranks 1–3; its promotion zone is ranks 7–9.
- Hands live in `[...]` after the board field, as Sittuyin's FEN already does.
- A promoted piece is written `+P`, `+R`, … — a **two-character square**. Our other engines write one letter
  per square, so `packages/shogi`'s FEN reader and writer are its own, and `normalizeFen` (which strips our
  `~` marker) must not be relied on: Shogi emits `+` exactly like Fairy-Stockfish.
- Promotion is a `+` suffix on the move: `g8g9+`, SAN `Pxg9=G`. When promotion is forced (a pawn to the last
  rank) ffish offers **only** the promoting move, so forced promotion falls out of move generation.
- A drop is `S@a2`, SAN `S@a2` — the notation `rules-core` already documents for `VariantMoveRecord.uci`.
- Nifu is real in the reference: from a position with a pawn in hand and a pawn on every file, ffish lists
  **0** pawn drops.

Piece set: K, R, B, G, S, N, L, P and the six promoted forms (+R dragon = rook+king, +B horse = bishop+king,
+S +N +L +P all move as Gold). 14 move tables in all, on a 9x9 square board (`grid="squares"`, not points).

Rules the engine owns, each with its own tests:

1. Movement of all 8 base and 6 promoted types, including the lance's and knight's forward-only reach.
2. Optional promotion on any move that starts in, ends in, or passes into the zone; forced promotion when the
   piece would otherwise have no legal move (P and L on the last rank, N on the last two).
3. Capture puts the piece in the capturer's hand, **unpromoted**.
4. Drops: empty square only; nifu; no drop that leaves the piece with no future move; **uchifuzume** — a pawn
   drop that delivers immediate checkmate is illegal (any other piece may).
5. Check, checkmate, stalemate (a loss for the side to move, as in Xiangqi — `plat-008` already gives the
   platform a decisive stalemate result).
6. Sennichite: the same position, **including both hands and the side to move**, for the fourth time is a
   draw; if every one of those repetitions was a check by one side, that side loses. `plat-008`'s perpetual
   result and `ai-core`'s `repetitionScore` hook already carry this shape from Xiangqi.
7. Impasse, per D11.

## Seams found in the platform (gap analysis)

| Seam | Where | Feature |
|---|---|---|
| The move input silently drops an optional promotion. `useMoveInput.play()` picks the non-promoting move when both exist, with the comment "no supported game has both today". Shogi has both on most moves. | `packages/board-ui/src/useMoveInput.ts` | `plat-011` |
| There is no promotion prompt anywhere. Sittuyin's promotion is in place (`promoteInPlace`), Makruk's is automatic. | `packages/board-ui`, `packages/game-shell/src/ui/GameScreen.tsx` | `plat-011` |
| Hands are modelled as a **setup phase**: `KEYS.md` requires `play.placing` "when the variant has a setup phase (`hasHands`)", and the game screen shows trays for placement. Shogi's trays are live for the whole game and fill from captures. | `packages/game-shell/src/ui/GameScreen.tsx`, `packages/rules-core/src/variant.ts` | `plat-012` |
| The board's coordinates are a boolean (`showCoordinates`); the labels are generated inside board-ui. Shogi needs 9→1 and 一→九. | `packages/board-ui/src/Board.tsx` | `plat-013` |
| `FamilyLanguage` is a closed union (`th`, `my`, `zh-Hans`, `en`) and every game carries a name in each. Adding `ja` means a Japanese name for Makruk, Sittuyin and Xiangqi too. | `packages/family/src/games.ts` | `sg-009` |

Already generic, no work needed (checked, not assumed):

- `VariantGame.hand(color)` returns repeated types (`['p','p','s']`), and `HandTray` groups them with a count
  badge — Shogi hands render as they are.
- `VariantMoveRecord.uci` already documents drop notation; the protocol, Worker and stores pass moves as
  opaque strings, so drops and `+` promotions travel end to end untouched.
- `ai-core`'s `SearchAdapter` takes moves as integers it never interprets, and its optional `repetitionScore`
  hook was added for Xiangqi's perpetuals — it covers perpetual check in Shogi as well.
- `server-kit` is driven by a `Variant`; `plat-008`'s decisive results and `plat-010`'s count-independent
  family tests need nothing further.
- Piece art rotation for Gote is the app's business: `renderPiece(piece, className)` is the app's own
  function, and the app owns the board orientation it must rotate with. No board-ui change.

## Work breakdown (in order)

Each step is one feature in `feature_list.json`; one active feature at a time.

### Step 1 — Optional promotion in the shared move input (`plat-011`)
`useMoveInput` stops choosing for the player: when a from→to pair has both a promoting and a non-promoting
legal move, it exposes a pending choice instead of playing. `GameScreen` renders a two-option prompt drawn
with the product's own piece art (promoted face vs plain face), dismissible, keyboard reachable, and readable
at phone width. New shared keys (`play.promoteAsk`, `play.promoteYes`, `play.promoteNo`) documented in
`packages/game-shell/KEYS.md` and marked "required only when the variant has an optional promotion".
**Verification:** board-ui unit tests for the three cases (forced promotion plays straight through, optional
promotion asks, no promotion never asks); Makruk and Sittuyin E2E unchanged.

### Step 2 — Hands during play (`plat-012`)
Split "has hands" from "has a setup phase": `Variant` gains `hasSetupPhase` (Sittuyin `true`, Shogi `false`);
`hasHands` keeps its meaning. The game screen shows both trays whenever the variant has hands, labels them by
side, and only calls a square a placement target during a setup phase. Captured pieces appear in the mover's
tray on the next render.
**Verification:** game-shell unit tests for a hands-in-play variant and for Sittuyin's setup phase; Sittuyin
E2E unchanged.

### Step 3 — Product coordinate labels (`plat-013`)
`BoardProps` accepts optional `fileLabels` and `rankLabels` (arrays in engine order); `showCoordinates` keeps
working and the current a1-style labels stay the default. `describeSquare` keeps receiving the engine square
name so accessibility text is the product's choice.
**Verification:** board-ui unit test rendering custom labels in both orientations; the other three apps
unchanged.

### Step 4 — Shogi board, FEN, hands and move generation (`sg-001`)
`packages/shogi` (`@chaturanga/shogi`) with its own 9x9 board module, its own FEN reader/writer (`+` prefixes,
`[...]` hands), 14 precomputed move tables, drops, promotion, and `/core` for the search.
**Verification:** `fen.test.ts` (round-trip on 10+ ffish positions, 10+ invalid FENs rejected);
`movegen.test.ts` one test per piece type plus promotion, forced promotion and drop restrictions;
`perft.test.ts` against a ffish-generated reference (fast depths in verify, every depth under `PERFT_DEEP=1`);
`reference.test.ts` lock-step random games vs ffish comparing sorted legal moves, SAN and FEN every ply (60
games in verify, 400 deep); `describeVariantConformance` passes.

### Step 5 — Shogi game end (`sg-002`)
Checkmate, stalemate loss, uchifuzume, sennichite (fourfold draw, perpetual-check loss), impasse per D11, and
the result/reason mapping the game screen and Worker read.
**Verification:** a fixture per rule, each one probed against ffish first; a recorded perpetual-check line that
ffish scores the same way; an explicit test for the impasse decision taken in D11 (either parity with ffish or
a documented divergence in `RULES.md`).

### Step 6 — Shogi computer opponent and bot ladder (`sg-003`)
`packages/shogi-ai` on `ai-core`: material (including hands), king safety, promotion and drop ordering.
Drops are **not** tactical for quiescence unless they capture or check, or the search explodes.
**Verification:** the bundled Node ladder script (as Xiangqi's), each bot beating the one below it over a
recorded match set; a fixed-depth node-count budget recorded so a later regression is visible.

### Step 7 — Shogi design identity and piece art (`sg-004`, owner approval gate)
`apps/shogi/docs/design.md`: palette (light and dark, every token in `packages/ui/TOKENS.md`), typography,
board look (kaya-wood grain, star points), and the wedge tiles for all 14 faces × 2 sides as SVG paths,
readable at 40px, promoted faces in red. Showcase page plus screenshots. Stays `in_progress` until the owner
approves. Never Duolingo's look.

### Step 8 — Shogi web app (`sg-005`)
`apps/shogi/web`: pass-and-play, the six bots in a Web Worker, hands, promotion prompt, move list, clocks,
settings, PWA, `ja`/`en`, board coordinates per D12, Gote pieces rotated 180°.
**Verification:** Playwright E2E (a full game, a drop, an accepted and a declined promotion, nifu refused in
the UI, language switch, install); `e2e:pwa`; `describeLocales` complete in both languages.

### Step 9 — Shogi lessons (`sg-006`)
About 14 lessons: the board and notation, pawn/lance/knight, silver, gold, king, rook, bishop, promotion,
drops, nifu and uchifuzume, check and mate, sennichite and impasse, a guided first game. Every claim checked
against the engine.
**Verification:** `describeLessons`; an E2E completing one lesson in each language.

### Step 10 — Shogi online play (`sg-007`)
`apps/shogi/worker`: `GameRoomBase`/`MatchmakerBase` on the Shogi variant, its own D1 and migration, seat
tokens, clocks. The server validates every move with the engine — including drops.
**Verification:** workerd tests including a stored finished game and a server-scored perpetual; a two-browser
E2E playing a game with a drop and a promotion.

### Step 11 — Deploy Shogi on its own subdomain (`sg-008`)
Owner confirms the subdomain (D8); D1 `shogi` created; `AUTH_SECRET` set; root `dev:shogi`/`build:shogi`/
`deploy:shogi` scripts; CI `changes` filter and `deploy-shogi` job; a production smoke suite in Japanese.

### Step 12 — Shogi joins the family links (`sg-009`)
`ja` added to `FamilyLanguage`, a Japanese name for every game, Shogi added to `GAMES` and `SITES`, and each
sibling app's `vite.config` picks it up through `__FAMILY__`. Only `packages/family` and each app's own
`MoreGames` data change — no other game's product files.
**Verification:** `packages/family` tests (every game has a name in every site language); a MoreGames test per
app; the four sites each link to the other three.

### Step 13 — Shogi SEO, About page and README (`sg-010`)
About page in both languages, sitemap, robots, Open Graph image, `README.md` and `README.ja.md`, and the root
README's family list. Needs the site address from `sg-008`; no screenshot or GIF shows the domain.

### Step 14 — Native Japanese review (`sg-011`, expected to stay blocked)
A review sheet (`apps/shogi/docs/i18n-review.md`) listing every Japanese string with its English source, for a
native reviewer. Blocked until a reviewer is found, exactly like `polish-002`, `sit-011` and `xq-011`.

## Shogi terminology (to confirm in `sg-011`)

| English | Japanese | Romaji |
|---|---|---|
| Shogi | 将棋 | shōgi |
| King | 王将 / 玉将 | ōshō / gyokushō |
| Rook / Dragon | 飛車 / 龍王 | hisha / ryūō |
| Bishop / Horse | 角行 / 龍馬 | kakugyō / ryūma |
| Gold general | 金将 | kinshō |
| Silver general | 銀将 | ginshō |
| Knight | 桂馬 | keima |
| Lance | 香車 | kyōsha |
| Pawn | 歩兵 | fuhyō |
| Drop | 打つ | utsu |
| Promotion | 成り | nari |
| Two pawns (illegal) | 二歩 | nifu |
| Pawn-drop mate (illegal) | 打ち歩詰め | uchifuzume |
| Fourfold repetition | 千日手 | sennichite |
| Impasse | 持将棋 | jishōgi |

## Risks

- **Search cost.** Shogi's branching factor (roughly 80–120 moves, far more with a full hand) is several times
  Xiangqi's. The TypeScript search will reach a shallower depth at the same time budget. Mitigation: measure
  first in `sg-003`, set the ladder's targets from the measurement, order drops last, and keep drops out of
  quiescence unless they capture or check. If the strongest bot is too weak to be interesting, say so in the
  feature's evidence rather than quietly loosening the ladder.
- **Perft cost.** Shogi perft grows fast (depth 4 is already ~7×10⁵ nodes). Keep depths ≤3 in `verify` and put
  the rest behind `PERFT_DEEP=1`, with the reference generated once by a script, as Xiangqi does.
- **Two-character squares in FEN.** `+P` breaks any code that assumes one letter per square. The Shogi package
  writes its own FEN reader and writer; check `describeVariantConformance` and the ffish comparison helpers
  for that assumption before trusting a green test.
- **Impasse.** The 27-point rule is the one place the reference engine may not agree with the human rules.
  D11 decides it in the open, with the answer written into `RULES.md` either way.
- **Hand-made Shogi positions are easy to get wrong** (nifu, a pawn with no move, the side to move already
  mated). Parse every fixture with `new Game(fen)` before using it, as the Xiangqi session learned to.
- **Sente is not "White".** The engine colour is `w`; the UI is 先手/後手. Mixing the two is the likeliest
  source of an inverted board or an inverted result.
- **Concurrent sessions.** This plan was written while another session was finishing Xiangqi (`xq-008`..
  `xq-011`). Shared files that both touch — `feature_list.json`, `docs/PLATFORM.md`, `AGENTS.md`,
  `claude-progress.md`, `.github/workflows/ci.yml`, `packages/family` — are append-only here. Re-read them
  before editing.
