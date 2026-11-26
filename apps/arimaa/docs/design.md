# Arimaa product design

**Status: proposal.** This is an original product interface for the standard Arimaa ruleset. It does not reproduce the official site, rulebook, artwork, or lesson wording. Product name review and visual approval remain open.

## Direction: The Field Manual

Treat each match as a compact field exercise. The board is a clean survey grid, and the interface reads like a contemporary field manual: precise coordinates, restrained annotations, and a four-position action rail that makes a long turn feel manageable. The signature is the **step rail**: every confirmed action occupies one or two numbered marks, so a push or pull visibly consumes two of the player's four steps.

The interface should feel tactical and calm, with the visual energy concentrated on a moving piece, a vulnerable trap, or a rabbit approaching a goal edge. Avoid animal mascots, faux parchment, historical maps, official Arimaa piece drawings, and a generic lesson-path metaphor. All piece art and explanatory copy are drawn and written for this product.

## Visual system

### Palette

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| canvas | `#f1ede3` | `#171e20` | Page background |
| surface | `#fbf9f3` | `#20292b` | Cards, dialogs and trays |
| raised | `#e4dfd1` | `#2a3536` | Secondary controls |
| ink | `#222a29` | `#f1ede3` | Main text |
| muted | `#56615f` | `#b5bfbb` | Supporting copy |
| gold | `#a9472f` | `#e27b5d` | Gold pieces and active player |
| silver | `#3b7182` | `#86bdc6` | Silver pieces and active player |
| signal | `#c19c43` | `#e2c66e` | Focus, step count and turn markers |
| trap | `#773d39` | `#d07b68` | Trap wells and captures |
| board-light | `#e8dfcd` | `#394342` | Light squares |
| board-dark | `#bdc6b8` | `#2a3433` | Dark squares |

Gold and Silver are distinguished by color, letter, shape, and border pattern. Never communicate a legal or terminal state through color alone. Keep text and focus contrast at WCAG AA.

### Board and pieces

- Use an 8×8 board with explicit coordinates. On phones, the board fills the available width and keeps each cell large enough to tap; controls stack below it rather than shrinking the board into a side panel.
- The four traps at c3, f3, c6, and f6 read as inset circular wells crossing the square grid. A ring around a trap shows friendly support; a broken ring marks a capture risk.
- Use original geometric SVG marks with a large single-letter label: a broad shield for Elephant, a split diamond for Camel, an angled arch for Horse, a square knot for Dog, a clipped hexagon for Cat, and a small chevron for Rabbit. Gold uses a solid face and double edge; Silver uses a pale face and dotted edge.
- Mark legal destinations with a small signal ring. Show the draft route with numbered dots joined by a thin line. For push and pull, group the two action steps under one bracket and show the displaced opposing piece with a second label.
- Captured pieces move to a quiet reserve row with their type and remaining rabbit count. Every square and piece has an accessible name including color, type, coordinate and trap support where relevant.

### Type and motion

Use Georgia for editorial headings and piece labels. Use self-hosted IBM Plex Sans for controls, coordinates, moves and body copy; use tabular numerals for step counts. Copy the IBM Plex Sans webfont and its SIL Open Font License notice into this product's own public assets before implementation. Do not load fonts from a network at runtime.

Move animation is a short direct slide. Trap captures use a brief inward ring, not a shake or explosion. The step rail fills from left to right; a push/pull pair shares a bracket. Respect `prefers-reduced-motion`, keep sound off by default, and provide keyboard movement and focus states.

## Screen structure

- **Home:** “Four steps. Hold the ground.” with an original 8×8 board vignette and direct actions for `Play a bot`, `Pass and play`, `Learn Arimaa`, and `Play online`. Keep ruleset identity and digital-convention information one level down.
- **New game:** select side, one of six bot levels, or pass-and-play. Explain that Gold places first and moves first. Offer a suggested legal setup while preserving free placement. Starting the game must not skip or constrain the selected rules.
- **Setup:** piece tray with remaining inventory, a 16-piece progress counter, own two-rank placement area, and a clear `Finish setup` state. The bot creates its own legal formation. No clock runs during setup.
- **Play:** board first. Player bars show Gold/Silver, rabbit counts, and whose turn it is. The action rail shows 0–4 spent steps and labels paired pushes or pulls as one atomic action. A player may finish after any non-pass turn prefix from one to four steps. The board previews trap captures after each atomic action. Put move history, undo/new-game controls, and the captured reserve below the board on small screens.
- **Tutorial:** short interactive chapters that exercise setup, movement, Rabbit direction, strength, freezing/support, traps, atomic push and pull, rabbit goals, rabbit elimination, immobilization, repetition, result priority, and turn completion. Every board state is accepted by the actual Arimaa Variant; original explanation follows each answer.
- **Online:** private room code, two player seats, connection state, clock and game controls. No chat. Complete turns are submitted and replay-validated by the Arimaa Worker.
- **Finished game:** state the actual ending and winner, show the decisive move or goal, and offer rematch, review or a new game.

## Interaction and product constraints

- Build the board and screen for Arimaa's specific turn model. Use a step-draft API that returns only currently available atomic actions; never send the 20,652 opening turns to a route chooser.
- Use `@chaturanga/arimaa-ai` from a Web Worker. Reconstruct its game from the initial FEN and recorded complete moves so third-repetition history is preserved; keep seeds explicit.
- Every visible string goes through the English locale. Tutorial positions and bot actions use the real Variant. Local play and lessons work offline.
- Give Arimaa its own English-only PWA, product-local address setting, manifest, icon, saves and Worker/storage namespace. Add it to the family directory only after the product is live.
- Keep private staging on Melon. Public promotion remains gated by Arimaa Public License v2025.02 Section 3: confirmation of no user/ad revenue and explicit owner authorization for the required community announcement. No external message has been sent.
- Review screenshots at 390px and 1280px in light and dark modes. Check tap targets, setup progress, trap support marks, push/pull grouping, focus, reduced motion, offline lesson access and zero horizontal overflow.
