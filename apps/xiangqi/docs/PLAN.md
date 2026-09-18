# Xiangqi (象棋) — implementation plan

Third product of the Chaturanga family (`docs/PLATFORM.md`): Chinese chess as its own PWA site, Simplified
Chinese by default with English, sharing engineering but not identity with Makruk or Sittuyin. Xiangqi is the
first game that breaks two platform assumptions the first two games share: the 8x8 board and pieces standing
on squares (Xiangqi pieces stand on line intersections, on a 9x10 grid). The platform-prep features this plan
depends on (`plat-007`, `plat-008`, `plat-009`, `plat-010`) exist to remove those assumptions without touching
Makruk's or Sittuyin's files. Features: `xq-001`..`xq-011` in `feature_list.json`.

Working notes used to build this plan live in a local, untracked file (`docs/xiangqi-implementation-note.md`,
listed in `.git/info/exclude`) written against Fairy-Stockfish's `xiangqi` variant (ffish 0.7.10). Re-probe
anything the engine steps are unsure of; this plan and `feature_list.json` are the system of record, not that
file.

## Owner decisions (accepted 2026-09-15, all suggested defaults)

| # | Topic | Decision |
|---|---|---|
| D1 | Languages | `zh-Hans` (Simplified Chinese, default) and `en`. Every string in both; native review is `xq-011`. |
| D2 | Locale code | `zh-Hans` (BCP 47); Open Graph locale `zh_CN`. |
| D3 | Rules authority | Fairy-Stockfish `xiangqi`: stalemate loses, perpetual check loses, chasing rules apply, 50-move rule. |
| D4 | Piece faces | Traditional characters (帥仕相俥傌炮兵 Red, 將士象車馬砲卒 Black) drawn as SVG paths, not font text, so the board never needs a CJK font. |
| D5 | Colour names | Red and Black. Red moves first and maps to the engine colour `w`. |
| D6 | Move-list notation | Engine SAN first (e.g. `Che3`). Traditional/WXF notation can be a later display-only feature; moves stay UCI strings end to end. |
| D7 | Design identity | Its own identity with a proposal document and screenshots, approved before styling — same gate as Sittuyin's "Daung" (`xq-004`). |
| D8 | Subdomain | Chosen by the owner at the deploy step (`xq-008`) on 2026-09-18. It lives only in `apps/xiangqi/web/site.config.ts` and the Worker's `routes`; never written anywhere else. |
| D9 | UI font | System CJK stack (`"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif`) plus self-hosted Noto Sans for Latin text. Piece glyphs are SVG paths, not a loaded font, so the PWA never precaches multi-MB CJK font files. |
| D10 | Bot personas | Six bots named after the pieces: 兵 Soldier, 士 Advisor, 相 Elephant, 傌 Horse, 炮 Cannon, 俥 Chariot. |

## Architecture

```
packages/xiangqi          rules (xq-001, xq-002)        packages/xiangqi-ai   bots: ai-core search + eval (xq-003)
packages/rules-core       Variant interface + size-aware square helpers (plat-007, done for Makruk/Sittuyin)
packages/board-ui         point-grid Board + non-square fitting (plat-009)
packages/game-shell       GameScreen, lesson player, decisive stalemate/perpetual results (plat-008)
packages/server-kit       room logic on a Variant, GameRoom, Matchmaker (unchanged; already generic)
packages/family           sibling game list, count-independent tests (plat-010), Xiangqi joins it (xq-009)
apps/xiangqi/web          product.config (zh-Hans/en, system CJK font, storage prefix), theme, piece art, lessons
apps/xiangqi/worker       wrangler.jsonc (worker + D1 xiangqi), thin entry around server-kit
```

Shared code changes are platform features (`plat-007..010`) that must leave Makruk and Sittuyin behaviourally
identical, each guarded by both products' full E2E and PWA suites. Nothing Xiangqi-specific moves into a
shared package; adding Xiangqi must never edit another game's files (`plat-010` is the one time app test files
change, and only to become count-independent, not game-specific).

## Seams found in the platform (gap analysis; full detail in the local implementation note, section 4)

1. **8x8 assumptions in rules-core** — `describeVariantConformance`, `board8.ts` square helpers. Fixed
   generically by `plat-007` (size-aware helpers keyed by `variant.files`/`variant.ranks`).
2. **Game results can't express a decisive stalemate or perpetual** — `GameStatus`, two copies of
   `resultFromStatus`, protocol `ResultReason`. Fixed by `plat-008`.
3. **Lessons slice UCI strings and use 8x8 square helpers** — `LessonPlayer.tsx`,
   `game-shell/src/testing/lessons.ts`. Fixed by `plat-007` (`parseUci`/`squareNameOf` take `files`).
4. **Board draws squares with markings over the pieces** — `board-ui/src/Board.tsx`. Fixed by `plat-009`
   (`grid: 'points'` + `underlay` drawn under the pieces).
5. **Board fitting assumes a square board** — `game-shell/src/ui/fittedBoard.ts`. Fixed by `plat-009`
   (`useFittedBoard` takes an aspect ratio).
6. **Family links and their tests are hard-wired to two games** — `packages/family/src/games.ts`
   (`GameId`), and both apps' `family.spec.ts` assert an exact sibling count. Fixed by `plat-010` before
   Xiangqi joins in `xq-009`, so joining never requires editing Makruk's or Sittuyin's test files again.
7. **Bots and repetition** — `ai-core`'s search scores every repetition as a draw; in Xiangqi a repetition can
   be a loss (perpetual check/chase). Handled inside `xq-003` via an optional `SearchAdapter.repetitionScore`
   hook, default unchanged so Sittuyin's ladder is unaffected.

Things that already work with no change: `board-ui`'s `parseUci`/`squareOf` (already take `files`), the
protocol UCI regex (already accepts `b3b10`), `useMoveInput`, `server-kit`'s setup-phase detection (Xiangqi
has no hands, so clocks start immediately), `GameRoomBase`'s generic replay and D1 schema, `ai-core`'s
game-independent search loop.

## Work breakdown (in order)

Each step ends with its feature's verification recorded; Makruk and Sittuyin `verify` + full E2E stay green
throughout every platform (`plat-*`) step.

### Step 1 — Size-aware rules-core helpers and lessons (`plat-007`)
Move `squareNameOf`/`squareOf` into `packages/rules-core`, generalise `describeVariantConformance` and the
lesson player to any board size. Makruk and Sittuyin unaffected.

### Step 2 — Xiangqi board, FEN and move generation (`xq-001`)
`packages/xiangqi`: `Uint8Array(90)` board, precomputed move tables per piece (general/advisor palace limits,
elephant eye, horse leg, soldier river crossing, four orthogonal rays), FEN, SAN matching `ffish.sanMove`, a
`VariantGame` implementation. Verified against Fairy-Stockfish with perft and lock-step games. Game status is
ongoing/checkmate only at this step.

### Step 3 — Decisive stalemate and perpetual results (`plat-008`)
`GameStatus` gains a winner-bearing stalemate and `perpetual-check`/`perpetual-chase` kinds. Both
`resultFromStatus` copies and the protocol `ResultReason` updated together. Makruk and Sittuyin keep a draw
for stalemate.

### Step 4 — Xiangqi game end (`xq-002`)
Stalemate loss, idle-repetition draw, perpetual-check loss, perpetual-chase loss (ported from the
Fairy-Stockfish chasing algorithm, not invented), 50-move rule, insufficient material — matching
`ref.isGameOver(true)`/`ref.result(true)` on every ply, including a repetition-biased move picker in the
lock-step tests so chases and perpetuals actually get exercised. `packages/xiangqi/RULES.md` documents every
ruling with its probe. Highest-risk step in the whole plan.

### Step 5 — Computer opponent and bot ladder (`xq-003`)
`packages/xiangqi-ai`: adapter, material+PST evaluation, repetition-loss awareness, six bots (D10). Ladder run
on GitHub Actions; every level must beat the level below in a majority of 20 games.

### Step 6 — Intersection boards and non-square fitting (`plat-009`)
`board-ui` gains a `points` grid and an `underlay`; `useFittedBoard` takes an aspect ratio. Makruk and Sittuyin
must be pixel-identical before/after (screenshot comparison).

### Step 7 — Design identity and piece art (`xq-004`, owner approval gate)
`apps/xiangqi/docs/design.md`: palette (light+dark, every token in `packages/ui/TOKENS.md`), typography, board
look (river, palace diagonals, point marks), SVG-path piece set for all 7 types x 2 colours, readable at 40px.
Showcase page + screenshots; stays `in_progress` until the owner approves, like `sit-005`.

### Step 8 — Xiangqi web app (`xq-005`)
`apps/xiangqi/web` copied from `apps/sittuyin/web` and adapted file by file (package.json, product.config.ts,
site.config.ts, vite.config.ts, index.html, locales, board underlay, GameScreen with `grid="points"`, no
hand-tray/counting UI, stores, pages, SEO, capture scripts). E2E: moves incl. illegal-target refusal
(horse-leg, elephant-river, flying general), computer play both colours, i18n default/persist, mobile fit,
refresh restore, offline PWA, decisive-stalemate game-over dialog.

### Step 9 — Lessons (`xq-006`)
Units: the board (points not squares, river, palaces), one lesson per piece, special rules (flying general,
check, checkmate, stalemate loses), repetition (idle draw, perpetual check/chase lose), basic mates (chariot,
horse+chariot, cannon-behind-screen). Every lesson validated by the engine; text in both languages.

### Step 10 — Online play (`xq-007`)
`apps/xiangqi/worker` copied from `apps/sittuyin/worker`: `GameRoom` on the `xiangqi` variant, D1 `xiangqi`, no
setup phase so clocks start on the first move. workerd tests for illegal/out-of-turn moves, broadcast, clock,
decisive-result storage, resign, no chat, quick match, health. Two-browser online E2E.

### Step 11 — Deploy (`xq-008`)
Owner confirms the subdomain (D8); D1 `xiangqi` created; `AUTH_SECRET` set; CI `changes` filter and
`deploy-xiangqi` job added; production smoke in Chinese.

### Step 12 — Family tests independent of game count (`plat-010`)
Rewrite `family.test.ts` and both existing apps' `family.spec.ts` to loop over `familyLinks(id)`. The last
time those two apps' test files change for a new game joining.

### Step 13 — Xiangqi joins the family (`xq-009`)
`packages/family` gains `'xiangqi'`, the new `FamilyLanguage`, and every game's name in it (including Makruk's
and Sittuyin's Chinese names, marked for native review). Xiangqi's own `family.spec.ts` written generically
from the start.

### Step 14 — SEO, About page and README (`xq-010`)
Per-language SEO tags, About page, `apps/xiangqi/README.md` + `README.zh-Hans.md` with media captured from
production (no domain visible), `apps/xiangqi/AGENTS.md` completed, root docs updated to list Xiangqi as live.

### Step 15 — Native Chinese review (`xq-011`, expected to stay blocked)
`apps/xiangqi/docs/i18n-review.md` written like the Sittuyin sheet (UI, lessons, bots, SEO, manifest, OG
image text, family names, terminology table incl. 長將/長捉). Set to `blocked` on a native reviewer, like
`sit-011` and `polish-002`.

## Xiangqi terminology (to confirm in `xq-011`)

| Piece | Red | Black | English |
|---|---|---|---|
| General (king) | 帥 | 將 | General |
| Advisor | 仕 | 士 | Advisor |
| Elephant | 相 | 象 | Elephant |
| Horse | 傌 | 馬 | Horse |
| Chariot | 俥 | 車 | Chariot |
| Cannon | 炮 | 砲 | Cannon |
| Soldier | 兵 | 卒 | Soldier |
| River | 楚河 漢界 | | River (Chu River, Han Border) |
| Perpetual check | 長將 | | — |
| Perpetual chase | 長捉 | | — |
| Xiangqi | 象棋 | | Chinese chess |

## Risks

- **Chasing rules** — the riskiest engine task. Must be ported from the Fairy-Stockfish source, not
  approximated; contained by a repetition-biased lock-step run (400 games) and a unit test per ruling found.
- **Platform changes regress Makruk or Sittuyin** — each `plat-*` step runs both products' full E2E, PWA
  tests and screenshot captures before and after.
- **Board aspect / intersection drawing breaks existing layouts** — `plat-009` defaults preserve today's
  behaviour (ratio 1, `grid: 'squares'` default); mobile specs guard all three apps.
- **Bots lose by perpetual check** — `ai-core` repetition hook (see seam 7) plus a dedicated unit test.
- **CJK font size breaks PWA precache** — avoided by SVG-path pieces and a system CJK UI font (D9); checked by
  `e2e:pwa` and build output size.
- **Translation quality** — all Chinese text is drafted by the team and flagged until `xq-011`.
- **CI time** — a third product adds E2E time; kept in check by path-filtered deploys and per-product E2E.
- **Domain leaks into code or media** — guarded by `family.test.ts`'s "never hardcodes an address" check and a
  README-capture review, the same guard Sittuyin uses.
