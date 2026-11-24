# Three-player chess product plan

Built on 2026-11-24 at the owner's request, starting from the Wikipedia overview of three-player chess.
That page describes a family of board and endgame variants, so this release names and explains the exact
house rules it implements in `packages/threechess/RULES.md`.

## Decisions made for v1 (open for the owner to change)

- **D1 Board:** 8 files × 12 ranks, with three four-rank home sectors in a ring. This preserves 96 cells while
  keeping the three equal armies easy to render and address on phones.
- **D2 Turns:** White, Black, Red. All pawns move clockwise, across the 12-to-1 seam.
- **D3 Endings:** checkmate eliminates a player; their pieces remain inert blockers; the last king wins.
  Stalemate passes, and a full cycle with no legal move is a draw.
- **D4 Play:** pass-and-play for three people on one device; position is saved in that browser. No AI or online
  play in v1.
- **D5 Product:** English-only; independent PWA and Worker on `three-player-chess.beanroti.com`.
- **D6 Identity:** “Midnight Ring”, a dark boardroom palette with parchment, vermilion and ring motifs.

The game engine is covered by the shared `Variant` conformance suite and named fixtures for ring movement,
three-sided check, promotion, castling, en passant and elimination. There is no matching Fairy-Stockfish
three-player variant for lock-step comparison.

## Not built

- Computer opponents, lessons, rooms, quick match, clocks, saved PGN and review.
- Alternative three-player board shapes and ending rules.

The owner approved publishing v1 on Cloudflare Workers Free with browser storage.
