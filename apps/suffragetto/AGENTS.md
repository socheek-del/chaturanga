# AGENTS.md: Suffragetto

Suffragetto is a standalone English PWA for the historic two-player board game. The product must have a
bounded bot, local play, an interactive tutorial, offline installation, server-validated private rooms and
isolated Melon storage.

## Selected edition and rules

- Use the surviving WSPU / Sargeant Bros. second-edition rules as the best-documented playable edition. Do
  not call it the statistically most popular edition; available sources provide no sales or usage data.
- The board is a 17×17 square grid with a 9×17 central Arena, six-cell House of Commons and Albert Hall goal
  buildings, 21-cell Prison and Hospital areas, six-cell Prison Yard and Hospital Grounds, and marked S/P
  setup cells. Translate each cell from the archival diagram into a named coordinate mask before engine work.
- Each player has 16 rank-and-file pieces and five large pieces (Leader plus four assistants, or Inspector
  plus four constables). One large piece goes in the middle of the front row; the other four go on the
  outermost cells of the front and second rows. The original chooses the first player by coin toss; the
  product lets players choose.
- A piece steps one empty adjacent square in any of eight directions, or hops over one occupied adjacent
  square into an empty square beyond. One turn may chain any number of hops by the same piece. Hops may cross
  either side's pieces.
- Only opposing pieces in the Arena can be arrested/disabled by a hop. Rank-and-file can capture diagonally;
  Leaders and Inspectors capture in any direction. Captured Suffragettes go to Prison; captured police go to
  Hospital. Captured pieces remain in the game.
- When Prison and Hospital each hold at least 12 pieces, either player may demand an exchange of up to six
  equal-rank pairs. No opponent consent is required. Released pieces go to their staging yard/grounds. No
  further exchange is available while either staging area is occupied.
- A piece entering the opponent's six-cell goal building may move inside but cannot leave. Fill all six
  opposing goal cells to win. A piece inside the Arena, including a goal cell if the coordinate mask places
  it there, is capturable under the Arena capture rule.
- Repetition draw and loss for no legal move are digital conventions. There is no source-backed 50-move
  rule. Record every remaining engine convention in `packages/suffragetto/RULES.md`.
- The rules and rights report is `docs/reports/Suffragetto rules and rights.md`; researcher notes are beside
  it. Its rights review is scoped, not worldwide clearance. Write all product text, art, board styling and
  brand elements independently; do not reuse archive scans or photographs.

## Architecture and release

- `packages/suffragetto` is the pure serializable rules source for the app, bot, lessons, online Worker and
  replay. Use `@chaturanga/rules-core` `Variant` and shared conformance.
- Keep the board mask, piece artwork, lessons, locale, product PWA, service and D1 under Suffragetto folders.
- All UI text belongs in `apps/suffragetto/web/src/locales/en.json`. English is the only v1 language.
- Online play has no chat. The product-local Worker validates every game action through the Suffragetto
  engine and stores only Suffragetto finished games.
- Reserved local endpoints after the repo port inventory: web `127.0.0.1:5201`, PWA preview
  `127.0.0.1:4201`, Worker `127.0.0.1:8811`. Recheck local listeners before starting dev services.
- Deploy to Melon with `ssh melon`. Cloudflare is a fallback only for a documented Melon limitation. Do not
  change Caddy or add family/catalog links until public DNS/TLS, HTTPS/WSS, tutorial and play checks pass.

## Verification

- Rules tests cover the exact board mask, S/P setup, movement/hop chains, all capture types, restricted
  zones, prisoner transfers, exchange eligibility/selection, goal occupancy, draw conventions, replay/undo,
  serialization and shared `Variant` conformance.
- Bot tests cover both roles, exchanges, captures, legal fallback, seeded choice and bounded search.
- Web tests validate every locale key and lesson exercise. Browser tests cover tutorial, bot as both roles,
  pass-and-play, saving, online legality/reconnect and 390px layout. PWA tests cover offline reload.
- Worker tests cover server legality, prisoner/exchange state, reconnect, restart, D1 archive and no chat.
- Do not mark release passing until exact-SHA CI, Melon stage smoke, restart and copied-state restore pass.
