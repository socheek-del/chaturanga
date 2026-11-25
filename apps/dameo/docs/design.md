# Dameo product design

## Direction

**Route atlas**: a calm, tactile study of paths across a gridded field. Dameo's signature line shifts and
multi-jump routes shape the visual language. The board is the main artifact; controls read like a compact
field notebook beside it. This is an original product direction, not an adaptation of MindSports, Wikipedia,
or another Chaturanga game's interface.

## Visual system

- **Palette:** paper `#F2E8D2`, chalk `#FBF7ED`, ink `#23363A`, slate `#496064`, copper `#B85E3D`, and
  restrained sage `#6C8170`. White pieces use chalk porcelain; Black pieces use ink-green glaze. Copper marks
  the last move and route choices; sage marks hints and learning feedback.
- **Board:** a precise 8×8 tile field framed by a thin double rule. Light squares use chalk; dark squares use
  muted reed-green. A barely visible grain and registration ticks give it the feel of a printed map. Keep
  legal targets high-contrast and distinguish selected, last-move, capture and tutorial-hint states by shape
  as well as color.
- **Pieces:** create original vector tokens locally. A man is a shallow carved disc with one short axial
  incision; a king has a raised eight-ray compass mark. Both sides share those silhouettes, distinguished by
  fill, rim and engraved highlight. Do not use photographs, imported board diagrams, or source-site art.
- **Type:** self-host Noto Sans for controls, move text and body copy; use an installed editorial serif stack
  (`Iowan Old Style`, `Palatino Linotype`, `Palatino`, `Georgia`) for game titles and lesson headings. No
  remote font request, so the installed product keeps its typography offline.
- **Surface and composition:** pale paper background, deep ink panels, copper hairlines, generous margins and
  a slightly asymmetric desktop layout. Avoid oversized rounded cards and oversized toy-like buttons. Motion
  is reserved for a piece sliding, a capture route resolving, or a completed lesson; honor reduced-motion.

## Screen structure

- **Home:** short title and one-line promise, an original four-piece board vignette, and three clear paths:
  play a bot, pass and play, or learn the rules. Explain the distinctive line move with one diagrammatic row.
- **Play:** the board occupies the largest region. On wide screens, the player/status strip and route-aware
  move list sit in a narrow side column. On phones, player bars sit above and below the board; controls and
  history follow it without horizontal scrolling. Capture routes remain complete turns in history.
- **Tutorial:** use the shared interactive lesson player in focus mode. Every exercise must be solved through
  the Dameo Variant. Show the whole legal capture route and state why shorter options are unavailable.
- **Online:** retain the same paper/ink system with a compact invite code, seat status, connection state and
  no chat surface.

## Accessibility and content

- Keep square coordinates and descriptive piece names available to assistive technology.
- Do not communicate side, selection, capture obligation or lesson correctness by color alone.
- Keep keyboard focus visible and controls usable at touch size. Support `prefers-reduced-motion`.
- All user-visible strings go through the product's English locale. Rules explanations and tutorial prose
  are written independently from the cited sources.
- The Dameo name's public trademark status is still under review. Keep public promotion gated as described in
  the product plan.
