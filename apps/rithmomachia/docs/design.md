# Rithmomachia product design

**Status: proposal.** The local product implementation follows this direction and has passed a 390px mobile
and 1280px desktop browser review. Owner/design approval is still open. This is the product's own visual
direction, not a reproduction of a historical board, manuscript, or modern rules site. The public product
name still needs a separate name review.

## Direction: The Number Cabinet

Present the game as a modern instrument for arranging numbers. The board is a long, precise calculation field;
piece values are as prominent as piece shapes. A quiet cabinet-green frame and mineral-bright tokens make each
position feel like an arithmetic problem on a crafted table. Use geometric diagrams, value labels and original
vector piece art. Do not imitate a medieval manuscript or use historical scans as decoration.

The memorable signature is the **progression trace**: when three values can form a great victory, a fine brass
line links their equally spaced squares and the interface names the missing value. It teaches the game's central
idea through the live position, without adding a mascot or a generic lesson path.

## Visual system

### Palette

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| canvas | `#f5f1e7` | `#151e1b` | Main page background |
| surface | `#fffdf7` | `#202b26` | Panels and dialogs |
| surface-raised | `#e9e2d2` | `#2a3730` | Secondary panels and cells |
| ink | `#202b27` | `#f2ead8` | Main text |
| muted | `#53615a` | `#bac2b6` | Supporting copy |
| primary | `#205b4d` | `#9ac9a9` | Main actions and White-side marks |
| secondary | `#9a5d19` | `#edbd66` | Brass arithmetic highlights and focus rings |
| danger | `#a33f38` | `#ef8a79` | Captures and Black-side action marks |
| board-light | `#e8ddc4` | `#39483f` | Light board cell |
| board-dark | `#8ba08a` | `#28372f` | Dark board cell |

Use dark text on amber controls. Keep small text at WCAG AA contrast on its actual surface. State must never
depend on hue alone: use borders, symbols, underlines, and labels as well.

### Board and pieces

- Keep the rules' 8-file by 16-rank orientation. On phones the board takes the main column and scrolls with the
  page; at a 390px viewport preserve cells large enough for a 2-digit value. On wide screens place the board
  left and a narrow position notebook right.
- Give the board a deep-green outer rail, a single fine inner keyline, and restrained rank/file labels. Use a
  subtle geometric registration mark at the corners; no paper grain, map routes, woodgrain, or source diagrams.
- Every circle, triangle, and square is an original SVG silhouette with its number set in a large, legible
  serif numeral. White pieces use a pale mineral face, one inset rim, and a small centered dot. Black pieces use
  a forest face, a double rim, and a short cross-hatch. Shape and face pattern distinguish pieces even in
  grayscale.
- Draw each pyramid as a compact stack of its surviving component shapes, with the current total on its face.
  In the reserve tray, show captured components as ordinary, separate numbered pieces.
- Distinguish quiet movement targets with a thin brass ring, capture targets with a red cut-corner mark, and the
  last action with a double line. Provide an accessible text description for every square and piece.

### Type and motion

Use Literata for headings, piece values, and arithmetic examples; use IBM Plex Sans for controls, instructions,
and status. Both upstream font projects publish their fonts under the SIL Open Font License 1.1; keep the
corresponding notices with the self-hosted Latin subsets so the installed PWA makes no font request. See the
[Literata license](https://raw.githubusercontent.com/google/fonts/main/ofl/literata/OFL.txt) and
[IBM Plex license](https://raw.githubusercontent.com/IBM/plex/master/LICENSE.txt). Keep numerical values tabular and aligned. Use the serif only where it improves the game's mathematical
and editorial character; controls stay plain and quick to scan.

Animate a legal move with one short, direct slide. A capture briefly draws a line from the selected source to the
target before the target component joins the tray. A progression trace appears only when the win condition is
available. Respect `prefers-reduced-motion`; sound is optional and can be muted.

## Screen structure

- **Home:** a compact title, the line “Move the numbers. Make the sequence.”, a small original numeric-board
  vignette, and direct choices for `Play a bot`, `Pass and play`, `Learn the rules`, and `Play online`. Put the
  rules-family and digital-convention note one level down.
- **Setup:** choose a bot level and side, or pass-and-play. Explain that Black starts. Keep color names,
  difficulty, and the six bot descriptions in locale keys.
- **Play:** board first. Above and below it show both player names, color/side patterns, and captured-number
  reserves. On narrow screens put turn status before the board and move history after it; do not shrink the
  board to fit a side panel. Add an arithmetic notebook panel with the selected piece's value, movement shape,
  and any legal capture equation.
- **Capture choice:** normal captures resolve from the target. If a pyramid has multiple capturable components,
  open a compact choice sheet with the component's shape and number, the remaining pyramid total, and a distinct
  `Siege: take all` choice where legal. A choice must never appear as an unexplained promotion letter.
- **Tutorial:** a short sequence of interactive units for setup and number families; each shape's movement and
  blocked paths; meeting; assault; ambuscade; siege; pyramid components and reserves; great victory; and no-action,
  repetition, and the 200-ply draw. Every exercise runs through the real Variant, explains the arithmetic in
  original wording, and includes a “Why?” explanation after an answer.
- **Online:** invite code, player seats, connection state, clock, and game controls only. Do not add chat.
- **Finished game:** name the actual ending (Great victory, no legal action, repetition, or counting draw), show
  the decisive line/equation when applicable, and offer rematch, review, or new game.

## Interaction and product constraints

- Build on the shared board, game shell, and UI primitives. Supply Rithmomachia-specific piece rendering,
  capture-choice wording, arithmetic notebook, palette, and tutorial content in this product.
- Keep pass-and-play, bot play, saved games, and tutorial usable offline. Bot moves use the deterministic
  `@chaturanga/rithmomachia-ai` worker and its six bounded levels.
- Keep every visible string in the product's English locale and every move validated by
  `@chaturanga/rithmomachia`, including online moves.
- The game occupies its own PWA, site setting, manifest, locale, worker service, and isolated room storage.
  Public routing waits for the Melon HTTPS/WSS checks, DNS, and the separate name review.
- Capture screenshots at 390px and 1280px in light and dark themes. Check readable piece values, the full tall
  board, reserve trays, focus states, reduced motion, keyboard selection, and zero horizontal overflow.
