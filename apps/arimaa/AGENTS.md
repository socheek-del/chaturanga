# Arimaa product notes

Read `docs/PLAN.md` and `packages/arimaa/RULES.md` before changing this product. The target is the official standard two-player rules; Fast Rules and football/rugby theme rules are not the product.

- Setup is a player-chosen placement of the full army on that player's two home ranks. Gold places first; Silver places second; Gold takes the first turn.
- A turn contains up to four orthogonal steps. Push and pull sequences are multi-step actions inside that same turn. The server validates the complete turn through the Arimaa Variant.
- Protocol turns concatenate two to four four-character coordinate pairs; setup placements use uppercase type drops such as `E@a1`. Keep the UI's step draft separate from the committed complete turn.
- `@chaturanga/arimaa-ai` provides six seeded bot levels. Midgame candidates are sampled and bounded; do not replace this with an exhaustive turn list in the UI or bot.
- For live turn input, use `Game.turnDraft(actions)` to get the next atomic actions, step budget, end-turn eligibility and preview FEN. Keep each push/pull paired and preserve full-turn UCI only at commit/replay boundaries.
- Trap captures resolve after each step. A unit on a trap survives only while it has an adjacent friendly unit.
- The English PWA lives in `web/`; its 15 interactive lessons and all visible copy use `web/src/locales/en.json`. Store sessions in the product-prefixed local storage namespace and keep the web turn editor on `Game.turnDraft()`.
- Keep board art, piece art, tutorial prose and product identity original. Do not copy official assets or text.
- Launch is planned as free and without user or advertising revenue under Arimaa Public License v2025.02, Section 3. Confirm that condition before public release. The license also requires specific visible notices, an external Arimaa link, derivative terms, and a community announcement; do not post or contact anyone without explicit owner authorization.
- No chat. Use isolated Melon storage for online play. Do not expose online room state or tokens between products.
