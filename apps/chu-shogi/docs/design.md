# Chu Shogi product design

**Status: proposal.** Build against this direction and keep it available for owner review. This is an original
product identity; it does not represent or imitate a Chu Shogi association, rules site, historical board, or
commercial manual. The descriptive product name remains “Chu Shogi”; public brand review is a separate gate.

## Direction: The Meridian Table

Treat the 12×12 board as a precise field instrument. The interface should make a complicated position feel
legible: a clean measured grid, coordinate bands, small registration marks, and a clear trace for each compound
Lion turn. Its memorable signature is the **route trace**: when a Lion, Horned Falcon, or Soaring Eagle has
multiple complete turns to the same destination, the chosen path is drawn as numbered landings, with each
capture called out in order. The board teaches the rules while remaining calm enough for long games.

Use a contemporary surveying notebook as the reference point. Avoid woodgrain, faux parchment, crests, borrowed
Japanese glyphs, copied diagrams, association logos, and historical trade dress. Every piece mark, board
registration sign, diagram, and lesson illustration must be drawn for this product.

## Visual system

### Palette

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| canvas | `#f4f0e7` | `#131c20` | Page background |
| surface | `#fffdf8` | `#1c282b` | Cards, navigation and dialogs |
| raised | `#e9e1d2` | `#263538` | Controls and secondary panels |
| ink | `#202d31` | `#edf0e8` | Main text |
| muted | `#5a6969` | `#bac5bf` | Supporting text and coordinates |
| primary | `#24565a` | `#8fc3ba` | Turn, selection and primary actions |
| accent | `#b34c39` | `#f08a69` | Captures, urgent result and route step |
| brass | `#aa7934` | `#e4b96d` | Promotion, focus and route number |
| board | `#e5ddcd` | `#354648` | Playing field |
| board-line | `#778780` | `#738883` | Grid and coordinate rails |

Use contrast that meets WCAG AA on each actual surface. A state must also have a shape, label, border, or icon;
never rely on color by itself. Give focus rings a strong outside keyline so they remain visible on the board.

### Board and original piece marks

- On phones keep the complete 12×12 board in the main column. At 390px it should use nearly the full content
  width, with coordinates in narrow outside rails. Put turn status above the board, then route choices, move
  history, and learning help below it. Do not compress a second panel beside the board.
- On wide screens use an asymmetric composition: a compact setup/turn rail, the square board as the visual
  anchor, and a narrow “field notes” panel for the selected rank, legal routes, captures and move history.
- Use a single low-contrast field with a fine 12×12 grid, not alternating chessboard squares. Mark ranks 4 and
  9 with a delicate baseline so the central approach is easy to read. Keep coordinate labels outside the piece
  area and show a small calibration mark in each corner.
- Draw an original geometric seal for each starting rank. Pair it with a short Latin abbreviation in a compact
  high-contrast face so pieces remain distinct at 26–30px. Promoted ranks keep the same silhouette with a
  brass inset mark; their accessible label names the full rank. Do not use copied kanji or licensed association
  piece art.
- Use a solid fine ring for the selected piece, small centered marks for quiet destinations, and an open
  vermilion corner bracket for captures. The last move uses a double line. Route traces number each landing;
  Igui marks both the first landing and return to the origin. A two-capture route labels capture order.
- Show the board orientation control and whose side is at the bottom. Keyboard selection and square names must
  remain available in both orientations.

### Typography and motion

Use a high-contrast book serif for the wordmark and major headings, paired with a restrained humanist sans for
controls, coordinates, route labels and explanations. Use tabular numerals in move counts and timers. Keep
piece abbreviations letterspaced and legible rather than ornamental. Self-host any selected open fonts with
their license notices so installed offline play makes no font request.

Animate a single move with a short direct slide. A compound route draws one line segment at a time and marks
captures in order; promotion adds a brief brass inset highlight. Keep transitions under 180ms and honor
`prefers-reduced-motion`. Sound is optional and can be muted.

## Screen structure

- **Home:** title, one sentence explaining the 12×12 game, a small original route vignette, and direct choices
  for `Play a bot`, `Pass and play`, `Learn the rules`, and `Play online`. Explain the selected 2019 Renmei
  competition profile and 2004 Lion clarifications in a short “Rules used” note, without claiming popularity.
- **Setup:** choose one of six bot levels and the human color, or local pass-and-play. Show each level's short
  English description. The default bot must not be chosen by randomness.
- **Play:** board first; clear turn state; visible player sides; route-aware tap/drag input; undo/takeback for
  local games; move list; save/resume; and a field-notes panel. If same-destination moves differ by route, show
  the full path, each capture, and promotion choice before applying one atomic move.
- **Tutorial:** interactive lessons for setup and turns; ordinary step/slide/jump families; all promoted ranks;
  entry/leave/capture promotion and deferral; King and Prince; Lion double moves, direct jump, Igui and Jitto;
  Lion protection and first-Lion counterstrike; capture of all royals; barren material; repetition duty; and
  the digital no-move loss. Every exercise is validated by the selected engine.
- **Online:** private room code, two seats, connection/reconnect state, clocks and game controls. No chat.
- **Finished game:** state the actual engine result and decisive capture/repetition reason; offer rematch, local
  review and a new game.

## Interaction and product constraints

- Use the shared 12×12 `board-ui` grid, route parser, UI primitives and game shell where their APIs preserve
  full-route identity. The board-input chooser must select a complete path before a route-specific promotion.
- Draw each rank through Chu-local original SVG geometry. Keep the movement table and complete prose in the
  product locale; all visible strings use `i18n` keys.
- Pass-and-play, bots, local saves and lessons must work offline. Run bot search in a Web Worker and pass a
  per-game seeded RNG. Save the full FEN and UCI route strings so declines, counterstrike and two-leg moves
  survive reload.
- Use the independent product locale, PWA manifest, site setting, service, Worker, and storage namespace.
  Never hardcode a public domain. No family/catalog listing until the public Melon DNS/TLS/HTTPS/WSS gate passes.

## Review checklist

Capture 390px and 1280px views in light and dark. Inspect every piece rank at actual board size; route choice
with two distinct paths, two captures, Igui and promotion; both board orientations; focus/keyboard behavior;
reduced motion; zero horizontal overflow; local save/reload; bot opening as both colors; and offline app-shell
reload. Screenshots must not show the temporary site address.
