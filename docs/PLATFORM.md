# Chaturanga platform plan

Owner decisions, 2026-09-14:

- One monorepo for a family of traditional strategy games. It will be renamed from `Makruk` to **`chaturanga`**, after the common ancestor of Makruk, Sittuyin, Shogi and Xiangqi.
- Every game is a **separate product**: its own site, brand, PWA, languages, lessons, Worker and D1 database. Games never share one UI. The only link between them is a "more games" section and footer.
- Sites live on **subdomains** for now. Parent domains are temporary, so no code, image or doc hardcodes them. Each app reads its address from its own config, as Makruk does today with `apps/web/site.config.ts`.
- **Sittuyin (Burmese chess)** is the second game. Its languages are Burmese (default) and English. Makruk stays Thai (default) and English.
- **Xiangqi (Chinese chess)** is the third game, planned 2026-09-15. Its languages are Simplified Chinese (default) and English. Full plan: `apps/xiangqi/docs/PLAN.md`. It is the first game to break the 8x8-board and pieces-on-squares assumptions the platform code carried from Makruk and Sittuyin (9x10 board, pieces on intersections); the platform-prep features `plat-007..010` remove those assumptions generically before Xiangqi's own features (`xq-001..011`) build on them.
- **Shogi (Japanese chess)** is the fourth game, built and deployed 2026-09-18. Its languages are Japanese (default) and English. Full plan: `apps/shogi/docs/PLAN.md`. It is the first game where captured pieces come back (hands stay live for the whole game and a captured piece changes owner) and the first with an **optional** promotion, so the same from→to pair is two legal moves; the platform-prep features `plat-011..013` remove those assumptions — plus the board's fixed coordinate labels — before Shogi's own features (`sg-001..011`) build on them.
- **International chess** is the fifth game, planned 2026-09-18. Its language is English at launch (a second language is an open question, because each declared language becomes a family language that needs a name for every game). Full plan: `apps/chess/docs/PLAN.md`. It is the first game with castling, with en passant and with a promotion that offers a choice of four pieces; only the last of those needs a platform change (`plat-014`), before chess's own features (`ch-001..011`).
- Other games may come later.

## The one rule

**Nothing game-specific lives at the repository root or in a shared package. Everything game-specific lives in its game's folder.**

A game's identity lives in its app:

- rules and piece names
- piece art, board art and theme tokens
- lessons
- locale content: `pieces`, `about`, `seo`
- the list of languages, the default language and fonts
- PWA manifest, site address, README, `AGENTS.md`
- Worker name and D1 database

Adding a game must never edit another game's files.

## Target layout

```
packages/
  rules-core/     Variant interface + shared 8x8 helpers (squares, leaper tables)
  makruk/         Makruk rules, implements Variant
  sittuyin/       Sittuyin rules, implements Variant
  ai-core/        alpha-beta search over Variant; each game supplies evaluation + bot configs
  protocol/       REST/WebSocket schemas with a `variant` field and generic move strings
  ui/             component primitives; colours/fonts come from the app's theme tokens
  board-ui/       grid board of any size, pieces in hand, piece-set registry
  game-shell/     game screen, clocks, move list, online session, AI client, sound,
                  lesson player, shared locale namespaces (en/th/my)
  server-kit/     GameRoom + Matchmaker Durable Objects, Glicko-2, room logic that takes a Variant
  family/         sibling game list (id, names in every language, icon); URLs from app config
apps/
  makruk/web      makruk/worker      Wat theme · th, en
  sittuyin/web    sittuyin/worker    own theme · my, en
  xiangqi/web     xiangqi/worker     own theme · zh-Hans, en (planned)
  shogi/web       shogi/worker       own theme · ja, en
```

The root README describes the family. Each game has its own README and translated README (`README.th.md`, `README.my.md`). The root `AGENTS.md` holds platform rules; `apps/<game>/AGENTS.md` holds game facts. `feature_list.json` features carry a `product` field (`platform`, `makruk`, `sittuyin`).

## Variant interface (settled in plat-002)

`packages/rules-core/src/variant.ts` defines the interface. It is shaped by what the worker and web app
already call on Makruk's `Game`, so it is a **stateful game** rather than pure position functions:

```ts
interface Variant<G extends VariantGame> {
  id; files; ranks; startFen; pieceTypes; hasHands;
  createGame(fen?): G;                          // throws FenError
}

interface VariantGame {
  turn; fen(); pieceAt(sq); pieces(); hand(color);
  legalUci(): string[];                         // 'e3e4', 'a5a6m', 'h5g4f', 'K@h3'
  move(uci): VariantMoveRecord;                 // throws IllegalMoveError
  undo(); moves(); lastMove();
  status(): GameStatus;                         // union of every variant's end kinds
  isGameOver(); inCheck(); checkedKingSquare(); counting();
}
```

- Each engine exports a variant object (`makruk`, `sittuyin`) declared with `satisfies Variant<Game>`, so the
  compiler proves its `Game` class conforms. No adapter layer.
- `@chaturanga/rules-core/testing` has `describeVariantConformance`. Every engine runs it; it covers FEN
  round-trips, typed errors, random playouts that replay from the move list and undo to the start, and mate.
- rules-core also owns what the Makruk-family engines share:
  - the numeric 8x8 board and move tables (neutral names: `FERZ` = Met/Sit-ke, `SILVER` = Khon/Sin)
  - attack detection
  - `FenError` / `IllegalMoveError`
  - the ffish test loader

  Makruk re-exports these under its old names, so `packages/ai`, the web app and the worker are unchanged.

Moves stay strings end to end (protocol, worker, stores, URLs) so no layer except the rules package parses them.

## Languages per product

```ts
// apps/sittuyin/web/product.config.ts
export default { id: 'sittuyin', locales: ['my', 'en'], defaultLocale: 'my', fonts: ['Noto Sans Myanmar'] };
```

- `game-shell` ships shared namespaces (`nav`, `play`, `online`, `settings`, …) in every language any product uses (`en`, `th`, `my`).
- Each app loads only its declared locales, so Thai never ships to the Sittuyin site.
- Test rule: **every locale an app declares is complete** for shared and app namespaces. This replaces "th and en both required".
- Burmese text is Unicode only (no Zawgyi encoding), uses an OFL Myanmar font and gets taller line-height tokens.

## Order of work

Every step leaves Makruk green: `npm run verify`, `npm run e2e`, CI deploy.

1. **Sittuyin rules engine (M9: sit-001..003).** A new pure package checked against Fairy-Stockfish's `sittuyin` variant, the way Makruk was. Nothing else changes. A second real engine is what the shared interface gets designed from.
2. **Platform extraction (M10: plat-002..006).**
   - Variant interface.
   - Rename and restructure.
   - Per-app locale config.
   - Shared UI/game/server packages with a `variant` column in protocol and D1.
   - Family links.
3. **Sittuyin product (M11: sit-004..011).**
   - AI.
   - Design identity and web app with setup-phase UI.
   - Lessons.
   - Online play.
   - Deploy on its subdomain.
   - SEO and README.
   - Native Burmese review.
4. **Xiangqi product (M12-M13: plat-007..010, xq-001..011).** Size-aware helpers, decisive stalemate and perpetual results, intersection boards, then the Xiangqi engine, AI, design, app, lessons, online play, deploy and family links.
5. **Shogi product (M14-M15: plat-011..013, sg-001..011).**
   - Platform prep: optional promotion in the shared move input, hands during play, product coordinate labels.
   - Engine (9x9, hands, drops, promotion) and game end (nifu, uchifuzume, sennichite, perpetual check, impasse).
   - AI and bot ladder.
   - Design identity, web app, lessons, online play.
   - Deploy on its subdomain, family links, SEO and README.
   - Native Japanese review.
6. **Chess product (M16-M17: plat-014, ch-001..011).**
   - Platform prep: promotion with a choice of pieces in the shared move input.
   - Engine (castling, en passant, under-promotion) and game end (stalemate, insufficient material, threefold, fifty-move).
   - AI and bot ladder.
   - Design identity, web app, lessons, online play.
   - Deploy on its subdomain, family links, SEO and README.
   - A second site language, once the owner names one.

## Sittuyin product plan

Implementation details, product defaults (setup UX, clocks after setup, promotion UX, font, bots) and the
step-by-step work breakdown: `apps/sittuyin/docs/PLAN.md`.

## Xiangqi product plan

Owner decisions (D1-D10, accepted 2026-09-15), architecture, gap analysis against the platform's Makruk/Sittuyin
assumptions, and the step-by-step work breakdown: `apps/xiangqi/docs/PLAN.md`. Xiangqi's rules authority is
Fairy-Stockfish's `xiangqi` variant, the same "follow the Fairy-Stockfish variant" rule as Makruk and Sittuyin.

## Shogi product plan

Proposed owner decisions (D1-D12, awaiting confirmation), architecture, the gap analysis for hands in play and
optional promotion, and the step-by-step work breakdown: `apps/shogi/docs/PLAN.md`. Shogi's rules authority is
Fairy-Stockfish's `shogi` variant, the same rule as the other three games; its start position, promotion (`g8g9+`),
drop (`S@a2`) and nifu behaviour were probed with ffish 0.7.10 on 2026-09-18.

## Chess product plan

Proposed owner decisions (D1-D12, awaiting confirmation), architecture, the gap analysis for promotion with a
choice of pieces, and the step-by-step work breakdown: `apps/chess/docs/PLAN.md`. Chess's rules authority is
Fairy-Stockfish's `chess` variant, the same rule as the other four games; castling (`e1g1`, `e1c1`), promotion
(`e7e8q|r|b|n`), en passant (`e5d6`) and the claimable threefold and fifty-move draws were probed with ffish
0.7.10 on 2026-09-18.

## Sittuyin rules reference (from Fairy-Stockfish `sittuyin`, probed with ffish 0.7.10)

- Start: `8/8/4pppp/pppp4/4PPPP/PPPP4/8/8[KFRRSSNNkfrrssnn] w - - 0 1`. Pawns are on the board; the other 16 pieces start in hand.
- **Setup phase:** 16 alternating plies, White first, dropping pieces behind one's own pawns (`K@h3`, `N@a1`).
  - White's drop squares are ranks 1–2 plus e3–h3.
  - Rooks may only be dropped on the back rank.
- Pieces:
  - K (Min-gyi) = king
  - F (Sit-ke) = one step diagonally
  - S (Sin) = one step diagonally or straight forward
  - N (Myin) = knight
  - R (Yahhta) = rook
  - P (Ne) = one step forward, captures diagonally forward
- **Promotion is a separate move** (`h5g4f` diagonal step, `e5e5f` in place). The pawn becomes a Sit-ke (F).
- **Game end:** differs from Makruk: 50-move rule, ASEAN counting with no board's honour, limits 32/88/128 plies by strongest piece. Full rules as implemented and verified: `docs/sittuyin-rules.md`.

## Open questions

- Sittuyin brand identity: its own design document with shared component primitives. Decided in sit-005.
- Subdomain names (e.g. one per game under the current parent domain). Chosen at deploy time in sit-009, never hardcoded.
- Xiangqi brand identity: "Mo" (墨, ink), `apps/xiangqi/docs/design.md`. Approved by the owner on 2026-09-18
  (xq-004).
- Xiangqi subdomain: chosen by the owner in xq-008 (2026-09-18). It lives only in
  `apps/xiangqi/web/site.config.ts` and the Xiangqi Worker's `routes`; never hardcoded elsewhere.
- Shogi owner decisions D1-D12 (`apps/shogi/docs/PLAN.md`): implemented as proposed. **D8** the subdomain
  follows the family's pattern (jp-chess); **D11** was settled by probe — Fairy-Stockfish does not adjudicate
  impasse, so neither does this engine, and it does not implement uchifuzume either, which this engine does.
  Both divergences are written into `packages/shogi/RULES.md`. **D7**, the design identity, still needs the owner.
- Shogi brand identity: "Kaya" (榧), `apps/shogi/docs/design.md`. **Still awaiting owner approval** (sg-004);
  the live site is already styled on it.
- Chess owner decisions D1-D12 (`apps/chess/docs/PLAN.md`): proposed defaults, to confirm before `ch-001`.
  Three need the owner specifically: **D1** the site languages (English only at launch is the proposal),
  **D7** the design identity, approved before styling, and **D8** the subdomain, chosen at `ch-008`. **D11**
  (threefold and the fifty-move rule are claimable in Fairy-Stockfish, not automatic) is a product choice, and
  whichever way it goes is written into `packages/chess/RULES.md`.
- Chess brand identity: its own design document, approved before styling. Decided in ch-004.
