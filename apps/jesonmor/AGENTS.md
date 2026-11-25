# AGENTS.md: Jeson Mor

Jeson Mor is a standalone two-player PWA for the documented Mongolian knight game. The product must ship
with an interactive tutorial, bounded bots, pass-and-play, private server-authoritative online rooms, local
game saving, PWA install/offline behavior, and its own Melon service and storage.

## Selected rules

- Use the source-backed 9×9-square board, nine chess-knight movers per side, and center square `e5`.
- Either player may move first. The standard start FEN has White first; expose a first-player choice in each
  suitable mode.
- Win by capturing every opposing horse or by moving the same horse onto `e5`, allowing one opponent
  reply, then moving it off `e5` on the claimant's next turn. Merely surviving the reply does not win.
- Center attempts are cancellable by capturing the horse on `e5`.
- Threefold repetition and loss by no legal moves are labeled digital conventions. There is no 50-move
  rule. No kings, check, promotion, or other piece types exist.
- The full rules and FEN state are documented in `packages/jesonmor/RULES.md`; source and rights research is
  in `apps/jesonmor/docs/reports/Jeson Mor rules selection.md`.

## Architecture

- Pure serializable rules: `packages/jesonmor` (`@chaturanga/jesonmor`), implementing `Variant` from
  `@chaturanga/rules-core`; `/core` is the raw search API.
- Deterministic bounded opponents: `packages/jesonmor-ai` (`@chaturanga/jesonmor-ai`) on `ai-core`.
- Independent English product: `apps/jesonmor/web`, with product-specific site and product config, PWA,
  tutorial content, original horse art, and no shared game identity outside common primitives.
- Authoritative online rooms and isolated persistence: `apps/jesonmor/worker`, its own Durable Objects and
  D1 database. The server validates every move with `@chaturanga/jesonmor`. No chat.
- Deploy to Melon through `ssh melon`. Cloudflare is fallback only for a documented Melon limitation.
- Do not add this product to the family catalog until its public route, HTTPS/WSS, tutorial and play smoke
  pass. Never hardcode its hostname outside `apps/jesonmor/web/site.config.ts` and its Worker route config.

## Content and quality

- Independently author prose, rules explanations, tutorials, art, and identity. Do not copy sources or
  third-party Jeson Mor implementations. The rights report is not worldwide clearance.
- All user-visible text uses i18n keys. English is the only declared language for v1; lesson keys and product
  keys must be complete.
- Keep game-specific files inside `apps/jesonmor/` and `packages/jesonmor{,-ai}/`. Supporting shared
  platform changes must be narrow and generic.
- The user requires an interactive tutorial for every game, a bot, multiplayer when applicable, direct main
  commits, incremental Melon staging, and durable state updates.
