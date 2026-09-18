# "Marble" — the chess site's design identity (ch-004)

The fifth product needs a look of its own. Makruk is a Thai temple, Sittuyin is "Daung", Xiangqi is "Mo"
(ink), Shogi is "Kaya" (torreya wood). Chess is the game everyone already knows, and the two sites everyone
already knows are green. So this one is **stone**: a cool marble board, brass for what is worth noticing,
and a Staunton set drawn for this repository.

Screenshots (both colour schemes, phone and desktop): `apps/chess/docs/evidence/design-*.png`, taken from
the site's own `/design` page with `npm run capture:design -w apps/chess/web`.

## What it is not

- Not lichess's or chess.com's green board, and not their piece sets. Their SVG sets are licensed work; ours
  are drawn here (see **The pieces**).
- Not Duolingo's fonts, colours, chunky buttons or zig-zag path — the platform rule for every game
  (`docs/PLATFORM.md`).
- Not a sibling's wood or ink: nothing here is warm brown or black-on-paper.

## Colour

Tokens live in `apps/chess/web/src/index.css` and are the ones `packages/ui/TOKENS.md` requires.

| Token | Light | Dark | What it is |
| --- | --- | --- | --- |
| `canvas` | `#f2f0ec` | `#12171b` | Page behind everything: pale stone, or slate at night |
| `surface` | `#fffefb` | `#1a2026` | Cards |
| `ink` | `#1c2126` | `#eef1f4` | Text |
| `primary` | `#33505f` | `#9ec2d6` | Slate blue: the main action |
| `secondary` | `#8a5a1c` | `#d9a65c` | Brass: the second action |
| `gold` | `#bf892f` | `#d6a44a` | The highlight on the board, and the site's seal |
| `danger` | `#a32a3a` | `#ef7d8e` | Resign, check |

The board is separate (`src/features/board/themes.ts`) because a board is not an interface:

| Board | Light squares | Dark squares | For |
| --- | --- | --- | --- |
| **Marble** (default) | `#eeeae2` | `#8c9aa6` | Cool stone, the site's own |
| **Olive** | `#f3ecd9` | `#9aa273` | A warmer, quieter board |
| **Night** | `#4a555f` | `#28313a` | Dark mode |

The selected square, the last move and the legal-move dots are all **brass** at different strengths, so the
board has one accent rather than three.

## The board

The squares themselves are transparent and the chequer is drawn underneath as one SVG (`Chequer.tsx`). That
keeps the shared board component (`@chaturanga/board-ui`) free of a chess-only idea, and it means a 180°
flip needs no second drawing: on 8x8 the pattern maps onto itself.

Coordinates are on by default here, unlike the siblings — chess notation is part of learning the game, and
the move list speaks in it (`Nf3`, `O-O`, `exd6`, `e8=Q`).

## The pieces

Staunton shapes, drawn as SVG paths in `src/features/board/PieceSvg.tsx`:

- The 1849 Staunton *design* is not anyone's copyright, but the well-known SVG sets on the web are licensed
  work. These are our own drawings, as the Makruk traditional set's credits (`art-003`) show how carefully
  the repository treats borrowed art.
- Every piece stands on the same plinth and collar, so the set reads as one set.
- A solid body with a drawn edge: on the Night board a dark piece still has a visible outline, and on light
  squares a white piece still has a shape. Checked at 32 px, which is about a square on a phone.
- Details are single marks, not decoration: the bishop's mitre cut, the rook's belt, the queen's and king's
  bands, the knight's eye.
- The king is also the site's mark: the favicon, the PWA icons and the Open Graph image all draw the same
  paths (`src/features/board/logo.ts`).

## Type

Self-hosted **Noto Sans** — already in this repository, Latin-only, nothing new downloaded (D9). Headings
are bold and tight; the move list is the same face at a smaller size, because chess notation next to a
different font reads as a foreign object.

## Motif

`.motif-marble` draws two soft veins across a hero panel. It is quiet on purpose: the board is the picture,
and every other decoration competes with it.

## Owner approval

Owner decision D7 (`apps/chess/docs/PLAN.md`) is "propose, then ship on it": the site is styled on this
document and the owner approves or changes it afterwards, from the screenshots above. **Still awaiting that
approval.**
