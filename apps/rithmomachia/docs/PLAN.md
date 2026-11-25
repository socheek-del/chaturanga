# Rithmomachia

## Rules selection

Use the **common medieval and Renaissance rules** summarized in the linked Wikipedia article. That
article explicitly distinguishes them from Fulke's later 16th-century variant and calls this family
the most common version. Surviving sources do not give comparable player counts, so this is the best
documented popularity choice available, not a claim of measured adoption. We are not shipping the
Selenus-only movement pattern previously considered.

The rules share a family resemblance rather than one standardized edition. Use the published
16×8 setup and number table, the Wikipedia movement and capture families, and the following
explicit digital conventions where the summaries leave choices open:

- Black moves first. The board is 8 files (`a`–`h`) by 16 ranks (`1`–`16`). Each side starts with
  24 occupied squares: 8 circles, 8 triangles, 7 squares, and one composite pyramid.
- White's ranks 1–4 and Black's ranks 13–16 use the exact value layout in
  `packages/rithmomachia/src/layout.ts`. The setup is symmetrical in shape but the black values
  are odd-sequence counterparts. The fixture and focused tests are checked against the cited setup diagram.
- Circles move one diagonal step; triangles move exactly two orthogonal steps; squares move exactly
  three orthogonal steps. A pyramid can move by any of its surviving component shapes. All paths
  must be empty; pieces never jump. Movement endpoints must be empty.
- A turn is either one ordinary move, one capture, or one reserve placement. A capture leaves the
  attacker in place. A captured piece changes sides and enters that player's reserve. On a later
  turn it may be placed on an empty square of that player's home rank. This makes the historical
  color change playable while keeping each action explicit.
- Meeting captures an equal-valued enemy piece in the attacker's ordinary movement reach. Assault
  captures along an unobstructed straight line when the attacker's value times the number of empty
  intervening cells equals the target value. Ambuscade captures when two friendly pieces can each
  reach the target square by ordinary movement and their values sum to its value. Siege captures a
  piece surrounded by opposing pieces in all four orthogonal neighboring squares. The selected
  summary does not include subtraction or division captures; v1 does not add them.
- A pyramid is a stack of components, not a single valued king. Components retain their own shape
  and number. Capturing a component removes it from the stack and adds it to the captor's reserve as
  a separate piece. A siege takes all remaining components. The pyramid's available movements
  shrink as components leave; its displayed total is the sum of surviving values.
- The default win is the **great victory**: three same-side pieces in the opponent's half, in a
  straight line at equal spacing, whose values form an arithmetic progression. Captured pieces may
  participate after being placed from reserve. This is the simplest proper victory stated in the
  selected summary; capture-count victory modes remain out of v1.
- A player with no legal action loses. Threefold repetition and a 200-ply non-capture limit are
  digital draw adjudications, and the tutorial identifies them as such.

The primary sources and modern comparisons, selection rationale, and rights notes are in
[`docs/reports/Rithmomachia rules variants rights.md`](reports/Rithmomachia%20rules%20variants%20rights.md).
All gameplay text, diagrams, art, code, and tests must be independently authored. Do not ship
modern-source text, tables, illustrations, or library scans.

## Product contract

- Independent English PWA with its own design identity, art, site setting, manifest, and service.
- Local pass-and-play, saved games, takeback, and six bounded bot levels for either side.
- A guided interactive tutorial teaches the setup, number families, all movement and capture
  rules, reserve play, pyramid components, the progression win, and digital endings.
- Private online rooms with server-authoritative move validation, isolated persistent storage, and
  no chat. Every visible string goes through the English locale.
- Melon is the deployment target. Do not add a public route or app-directory entry until DNS, TLS,
  HTTPS/WSS, production smoke, and the name review pass.

## Sequence

1. [x] Compare variants/adoption and rights; select the most common documented rules family.
2. [x] Check in the exact 8×16 setup fixture and source-backed value tests.
3. [x] Implement the pure Variant, including captures, reserve pieces, composite pyramids, victory,
   deterministic serialization, replay, undo, and conformance.
4. [x] Add bounded bots for both colors and position-level tests.
5. [x] Write the product design brief before UI implementation (`docs/design.md`, proposal).
6. [x] Build the interactive tutorial and independent offline-capable PWA. Thirteen lessons across three
   units cover every selected rule; `RULE_LESSONS` maps each convention to a lesson and lesson exercises
   run through the authoritative engine. Web checks passed 55/55, including lesson coverage and complete
   English locale checks. Production build precaches the app and local font/license assets. Headless Chromium
   verified bot play and reply, a correct tutorial move, service-worker control and offline reload; at 390px
   there is no horizontal overflow and the 8×16 lesson board fits below its prompt. Full workspace
   verification passed with loopback access.
7. [ ] Add isolated private rooms and the server-side rules engine.
8. [ ] Pass workspace verification, exact-SHA CI, Melon stage, offline, room/restart/restore, and
   mobile browser checks; then recheck DNS/TLS and branding before promotion.

## Verified engine increment (2026-11-26)

- `@chaturanga/rithmomachia` implements Black-first 8×16 play, component movement, meeting/assault/
  ambuscade/siege captures, capture-to-reserve and home-rank drops, partial/full pyramid capture,
  great victory, no-action loss, threefold repetition, 200-ply counting, replay and undo.
- The custom canonical `r1` FEN packs sorted board records and exact-value reserves into a short,
  deterministic string (the start position is below the protocol's 200-character start-FEN limit).
- Shared Variant conformance and focused engine checks passed. Full `npm run verify` passed under
  Node 25.9 with `NODE_OPTIONS=--no-experimental-webstorage` and loopback permission.
- `@chaturanga/rithmomachia-ai` supplies six fixed-node-budget personas. Its 16 checks cover all bots
  as both colors, progression wins, captures, deterministic choices, action-string preservation, and
  position restoration after search.
- Next: build the interactive tutorial and PWA from the design brief; add the private Worker service after local play is complete.

## Product design proposal (2026-11-26)

- `docs/design.md` sets the “Number Cabinet” direction: a modern arithmetic instrument with a tall 8×16 field,
  high-visibility values, patterned original tokens, and a progression trace. It includes responsive layouts,
  explicit pyramid capture choices, tutorial coverage, accessibility, and offline/service constraints.
- The proposal is written before UI implementation. Keep the product name provisional until the separate name
  review; no public domain or catalog entry is authorized by this design brief.
- Next: implement the interactive tutorial and PWA from this brief, then verify 390px/1280px light/dark layouts
  before proceeding to rooms.

## Sources

- [Wikipedia: Rithmomachia gameplay and its most common version](https://en.wikipedia.org/wiki/Rithmomachia#Gameplay)
- [University of Cape Town: *Rhythmomachia and its Rules*](https://open.uct.ac.za/server/api/core/bitstreams/82db129d-89a2-4f1a-8a8a-de0f5df55724/content)
- [American Mathematical Society: *The Battle of Numbers*](https://mathvoices.ams.org/featurecolumn/2021/07/01/the-battle-of-numbers/)
- [Mebben: Selenus reconstruction, used for comparison only](https://www.jducoeur.org/game-hist/mebben.ryth.html)
- [Bayerische Staatsbibliothek: Selenus 1616/17 scan and catalog](https://www.digitale-sammlungen.de/en/details/bsb10328556)
- [U.S. Copyright Office: Games](https://www.copyright.gov/register/tx-games.html)
