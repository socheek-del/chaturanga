# Chu Shogi (中将棋) — implementation plan

The next Wave 2 product in `docs/CHESS-LIKE-ROADMAP.md`. It is a separate classical 12×12 Shogi-family game, not a mode in the existing 9×9 Shogi site. Its selected profile is **Chu Shogi Renmei competition rules (2019), with the association's 2004 lion clarifications**. The sources support this as the best-documented current tournament standard, not as a statistically proven most-popular edition.

## Rules profile and source boundary

- 12×12 squares; 46 pieces per side; 21 starting ranks and 29 total ranks after promotion; captures are removed; no drops.
- Each player moves one piece per turn. Lion, Horned Falcon, and Soaring Eagle can make a complete turn with up to two constrained legs. A route is one atomic move and may capture on both legs.
- No royal-safety restriction: a King may be left under attack, and players need not announce check. The official 2019 rules state that victory is by checkmating or capturing the opposing King; if a Prince exists, that must also be defeated. The digital engine will implement this literally: capture any royal as an ordinary legal move; end by capture when no opposing King/Prince remains; recognize a forced royal mate only when the defender has no legal reply that prevents the immediate capture of each remaining royal. A King or Prince may otherwise be exposed to capture.
- Promotions follow the association's entry/capture/leave-and-reenter eligibility. Declining promotion must be serialized as piece state. A Pawn that remains unpromoted receives another chance on the last rank. Apply the association's expressly stated correspondence extension to Lance; this is relevant to online and saved digital games. Unpromoted Pawn/Lance on the last rank are immobile.
- Lion restrictions follow the official adjacent/non-adjacent protection rules, hidden line protection, tsukegui priority, the non-Lion first-Lion one-turn rule, and the 2004 whole-turn reading when a Pawn or Go-Between is the only protector captured during a Lion route. Protection is evaluated after the complete contemplated route, not halfway through it. Where compound multi-Lion cases lack a complete formal algorithm, use the documented non-recursive post-capture interpretation and pin the limitation with fixtures.
- Repetition follows the Renmei duty-to-vary rule: continuous royal attack, one-sided attacks on opposing pieces, the ordinary same-sequence case, and repeated jitto each assign the responsibility specified in the 2019 text. Digital adjudication: if the responsible player allows a fourth identical position instead of varying, that player loses; this makes the official vary-before-four rule deterministic in software. Do not use generic fourfold-draw or Xiangqi perpetual-chase behavior.
- Apply the Renmei's narrow barren-material rule: with both Kings and exactly one other eligible piece remaining, the side with two pieces wins; unpromoted dead Pawn/Lance do not count. No broader English-language bare-King extension. Mutual agreement remains available as a draw action.
- If a side has no legal move and the official capture/mate/barren rules did not decide the game, adjudicate the no-move side as losing; identify this as the product's digital stalemate convention.

Research and citations: `docs/reports/Chu Shogi rules edition rights.md` and `docs/research_notes/Chu Shogi rules edition rights/`. The primary profile sources are [Renmei 2019 rules](https://www.chushogi-renmei.com/kouza/rule2007.htm) and [Renmei 2004 lion supplement](https://www.chushogi-renmei.com/kouza/rule_hosoku2004.htm). They state the board and inventory, win condition, promotion rights, repetition responsibilities, Lion protection, and the exceptional communication rule. See also the 1703 source transcription and National Diet Library scan linked in the research record.

Rights/content boundary: write all explanations, translations, diagrams, piece art, and UI wording independently. Do not copy contemporary rule prose, association images/logos, commercial manuals, or curated problem sets. HaChu's CC0 declaration covers its source code only; this product's engine is independently implemented. Use “Chu Shogi” as a descriptive game name and make no association affiliation claim. Trademark search results were not established by this research, so public branding review stays open.

## Product shape

```
packages/chu-shogi/       @chaturanga/chu-shogi — pure Variant and serializable full-turn routes
packages/chu-shogi-ai/    @chaturanga/chu-shogi-ai — six bounded bots on ai-core
apps/chu-shogi/web/       English PWA, original piece art, local saves, pass-and-play, bots, lessons
apps/chu-shogi/worker/    isolated server-kit Worker and its own persistent game archive
```

## Current implementation — 2026-11-26

The pure rules package and six bounded bots are implemented. The product design brief, English PWA,
original geometric piece marks, bot/pass-and-play setup, per-seat local saves, twelve engine-checked lessons,
and a 29-rank/18-promotion atlas are in `apps/chu-shogi/web/`. The PWA uses the product-local
`CHU_SHOGI_SITE_URL` setting and its own offline precache. The private Worker in `apps/chu-shogi/worker/`
has product-specific Durable Objects and a D1 archive. Its local Durable Object tests cover legality,
quick match, reconnect, chat rejection, archived draws, and full two-leg Lion-route replay. Two Chromium
clients created and joined an invite room, synchronized moves, reconnected after reload, and selected the
exact Lion route. Chromium also loaded all 29 atlas entries from the built PWA with network access disabled.
Melon staging, restart/copy recovery, exact-SHA CI for this Worker increment, remaining bot ladder pairs,
and public DNS/TLS/name gates are still ahead. The route chooser and shared game shell support Chu's
full-path-before-promotion input and no-check-attention rule.

The 12×12 `Variant` dimensions and `board-ui` grid are generic. Opaque move strings already carry multi-square routes in the protocol. The integration seam is input: the product must present every legal complete Lion route and its capture/promotion consequences without assuming only one from/to move. `VariantMoveRecord.captures` carries both captured pieces. Promotion eligibility, the first-Lion one-turn event, repetition responsibility, and result history belong in serializable game state. No Shogi files should be changed for Chu behavior.

### Initial bot line-up

The first six ai-core personas are Pawn, Go-Between, Copper General, Silver General, Dragon Horse and Free King. Their deterministic node ceilings are 3k, 8k, 20k, 55k, 120k and 250k; browser time caps are 400ms through 2.5s. The bot adapter represents each complete route, including promotion, as one search action. Evaluation covers material, promotion and advancement; King/Prince captures, the narrow barren-material ending and no-legal-move loss receive terminal scores. Repetition uses the product's duty-to-vary adjudication when a root game history is available. When the caller does not inject an RNG, selection uses a fixed seeded source for reproducible runs; the web worker should pass a per-game seeded generator.

The first L2-versus-L1 sample completed two seeded games to a 100-ply cap: L2 checkmated once at ply 82 and drew once (1.5/2). This is a smoke and early relative-strength signal only. Run the remaining adjacent-level pairs and larger samples before claiming a stable strength ordering.

## Work sequence and completion evidence

1. **Rules and rights record** — done for research. Pin the literal Renmei win clause and the documented digital conventions above. Keep the popularity caveat and branding gate visible.
2. **Setup fixture and pure Variant** — implement exact 12×12 start coordinates, 46-piece inventories, canonical FEN, coordinate helpers, complete-turn UCI, move generation for all base/promoted pieces, stateful promotion, Lion restrictions, endings, replay/undo and `Variant` conformance. Each movement class and controversial rule gets a fixture. Use a legally compatible reference only where its profile matches; do not use an incompatible engine as a false oracle.
3. **Bots** — six strengths for both colors using ai-core; score material, royal safety, promotion potential and Lion tactics. Record deterministic node limits and a bot ladder.
4. **Original product identity** — implemented as The Meridian Table with original geometric rank glyphs. Keep the public name/branding review open until checked.
5. **English web PWA** — the responsive 12×12 board, local saves, pass-and-play, bot worker, full-route chooser, PWA manifest/service worker and game-local address setting are implemented. Verify installed offline use on the built Melon stage. No family/catalog entry until public hosting is verified.
6. **Interactive tutorial** — twelve lessons teach setup/turns/captures/no drops, movement families, all ranks, promotions and deferrals, Prince, Lion routes/igui/jitto/protection/tsukegui/first-Lion, endings and repetition. Move and square exercises use the engine; locale and lesson suites pass.
7. **Private online play** — two seats, invite codes and applicable quick match, no chat, server-side move validation by the Chu Variant, own Worker and isolated storage. Verify restart, reconnect, finished game archive, and copied-state recovery.
8. **Exact-SHA CI and Melon stage** — add the game build to CI, push the verified increment to `main`, deploy pinned code with `ssh melon`, migrate its own data and test the built PWA/Worker/recovery. Current next free staging port is 19919.
9. **Public release gate** — only after a distinctive public-facing brand is reviewed, Melon DNS and TLS exist, and public HTTPS/WSS smoke passes; then update the app directory. No Cloudflare route unless Melon has a documented limitation.

