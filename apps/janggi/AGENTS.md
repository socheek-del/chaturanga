# AGENTS.md: Janggi

Janggi (장기, Korean chess) is a web PWA: six computer opponents, pass-and-play, online rooms and quick match,
14 lessons, in Korean (default) and English. The platform rules in the root `AGENTS.md` apply here too. Live on
its own subdomain (jg-008). Plan and the decisions made for the owner to confirm: `apps/janggi/docs/PLAN.md`.
Its design, "Dancheong" (`docs/design.md`), awaits owner approval; the Korean text awaits native review (jg-011).

## Janggi Facts

- **Code:** rules `packages/janggi` (`RULES.md`; `/core` is the raw API for search), bots `packages/janggi-ai`,
  web `apps/janggi/web`, Worker `apps/janggi/worker` (Durable Objects `GameRoom` and `Matchmaker`, D1 `janggi`).
- **Rules authority:** Fairy-Stockfish's `janggi` variant. Cho is `w`. Points settle almost every undecided game.
- **Passing** is the move `e2e2`. The board never plays it by touch (`useMoveInput` drops it): `PassButton` does,
  and asks first when the pass would end the game.
- **Arrangements:** `setupFen(cho, han)`. An online room takes the FEN from its creator; the server accepts only
  the variant's `startFens`, and a rematch keeps it. Quick match always uses the default arrangement.
- **Board:** board-ui's `grid="points"` with `BoardLines`. Piece faces are outlines of Noto Serif KR
  (`npm run glyphs`), so no Korean font is loaded. Four piece sets: hanja, Hangul, moves, letters.
- **Site address:** `apps/janggi/web/site.config.ts` and `routes` in the Worker's `wrangler.jsonc`, nowhere else.
- **Dev and tests:** `npm run dev:janggi` (Worker :8792, web :5190) · `npm run e2e -w apps/janggi/web` (:5191) ·
  `e2e:pwa` · `smoke:prod` (live site) · `icons`, `og`, `glyphs`, `capture:design` ·
  `npm run test:strength -w packages/janggi-ai`.
- **Fixtures:** a FEN is invalid when a general is outside its palace, or when the side not to move is in check
  while the generals do not face. Generals and advisors alone end the game at once.
