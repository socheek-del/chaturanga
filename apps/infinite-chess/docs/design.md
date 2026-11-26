# Open Plane visual direction

## Design goal

Treat the unbounded board as a navigable map. Coordinates, long routes and the current view center should feel like
field instruments for exploring a plane, while the pieces remain recognizable as classical chess. The visual system
uses quiet cartographic notation and editorial typography instead of a lesson-path or toy-game motif.

## Identity

- Product name: **Open Plane**; game name: **Infinite Chess**.
- Palette: mineral night `#182222`, raised pine panels, warm paper, muted sage, and restrained brass `#cda96b` for
  active tools and navigation.
- Typography: self-hosted Literata for editorial headings and IBM Plex Sans for controls and reading; both font files
  include their SIL Open Font License notices.
- Original map mark: a rotated four-cell tile. The home illustration uses coordinate labels, axes, a compass point and
  route lines drawn in CSS. Chess glyphs are typeset text, not copied artwork.
- The public-facing source label links directly to the product README, which maps the complete corresponding source.

## Product surfaces

- Home introduces the infinite plane with one focused call to action, three short rules, a coordinate map and the
  family navigation.
- Play setup keeps bot strength, color and pass-and-play choices in one compact card.
- The board shows a finite viewport of the unbounded coordinate space. A player can pan, zoom, recenter, select a legal
  destination, and enter exact coordinates for distant moves. Coordinates and the last move stay visible without
  adding a second algebraic-notation layer.
- Tutorials pair a live board with one short instruction and immediate rule-based feedback. The guide covers all ten
  selected practices and does not use streaks, points or a progress path.
- Online rooms show seats and game actions only. There is no chat.

## Responsive and accessible behavior

Keep the board square and full-width on phones, put the move record beneath it, and stack the tutorial instructions
under the board. Controls retain visible keyboard focus, icon-only controls receive translated accessible names, and
the board reports exact piece/square coordinates to screen readers. Reduced-motion settings disable movement effects.
