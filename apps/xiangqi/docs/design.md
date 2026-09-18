# Xiangqi design identity: "Mo" (墨, ink)

xq-004. The Xiangqi site must look like its own product. It must not be a recolour of Makruk ("Wat") or
Sittuyin ("Daung"), and it must not look like Duolingo (root `AGENTS.md`, "Design"; the Duolingo rule is an
owner decision made for legal reasons). It uses the same component primitives (`@chaturanga/ui`,
`@chaturanga/board-ui`). Those carry shape, state and accessibility but no palette, so the whole identity lives
in this app's tokens, board drawing and piece art.

**Status: approved by the owner on 2026-09-18 (xq-004).** The live site is built on it. Changing the identity
now means changing this document first, then `index.css` tokens, the board themes, `BoardLines` and `PieceSvg`,
and re-running the E2E and PWA suites.

The showcase page (`apps/xiangqi/web/src/DesignPage.tsx`, currently the whole site) renders everything below
in both colour schemes. Screenshots are in `evidence/`:

| | 390px (phone) | 1280px (desktop) |
| --- | --- | --- |
| Light | `evidence/design-light-390.png` | `evidence/design-light-1280.png` (English: `design-light-1280-en.png`) |
| Dark | `evidence/design-dark-390.png` | `evidence/design-dark-1280.png` (English: `design-dark-1280-en.png`) |

Regenerate them with:

```bash
npm run build -w apps/xiangqi/web && npm run preview -w apps/xiangqi/web   # then, in another shell:
npm run capture:design -w apps/xiangqi/web
```

## The idea

Two things from a Chinese scholar's desk carry the identity:

- **Ink and the seal.** The interface is pine-soot ink (墨) on xuan paper (宣纸), with one warm accent: the
  cinnabar red of a name seal (朱砂印). The primary colour is ink itself: nearly black on paper in light mode,
  paper-white on ink in dark mode.
- **A club set.** The board and pieces look like the maple board and carved wooden discs found in every park
  in China: pale wood, dark lines, characters cut into the face and filled with red or black.

The interface stays quiet and nearly monochrome. The board carries the colour, as in Makruk and Sittuyin, but
here it is warm wood and red characters rather than teak or lacquer.

## How this differs from the other two games

| | Makruk ("Wat") | Sittuyin ("Daung") | Xiangqi ("Mo") |
| --- | --- | --- | --- |
| Primary hue | Indigo (~235°) | Peacock teal (~193°) | Ink, near-neutral (~30°, very low chroma) |
| Secondary | Jade green (~165°) | Aubergine (~305°) | Seal vermilion (~10°) |
| Canvas | Warm cream paper | Cool pale ash | Xuan paper, warmer and greyer than Makruk's |
| Board | Teak, honey brown | Lacquer, cinnabar red | Maple, pale yellow wood |
| Board geometry | Squares | Squares + promotion diagonals | Points on lines, river, palace diagonals |
| Type | Prompt (Thai) | Noto Sans Myanmar + Noto Sans | System CJK font + Noto Sans (D9) |
| Piece art | Carved abstract silhouettes | Figurative lacquer forms | Round discs with traditional characters |
| Ornament | Gold lattice diamonds | Peacock-eye roundel | Square seal, ink-wash band |

## Colour tokens

The token names are the contract in `packages/ui/TOKENS.md`; these are Xiangqi's values. Body text on its
surface clears WCAG AA (4.5:1). Large text and chrome clear 3:1.

### Light

| Token | Value | Notes |
| --- | --- | --- |
| canvas | `#f5f0e6` | xuan paper |
| surface | `#fffdf8` | |
| surface-2 | `#ebe3d3` | |
| line | `#d9cdb7` | |
| ink | `#1e1a16` | pine-soot ink |
| muted | `#5e554a` | 7.2:1 on surface |
| subtle | `#9a8f80` | decoration only |
| primary / -shadow / -soft | `#2a2622` / `#171411` / `#e6dfd2` | ink |
| secondary / -shadow / -soft | `#b3412a` / `#8e3220` / `#f6e1da` | seal vermilion; paper-white text 5.6:1 |
| danger / -shadow / -soft | `#a51d3c` / `#7f162e` / `#f5dde3` | crimson, cooler than the seal so the two don't blur |
| warning / -shadow / -soft | `#b07a12` / `#87600f` / `#f5e9cf` | on-warning text 4.3:1: button labels only (large, 3:1) |
| gold / -shadow | `#9c7a35` / `#7a5f29` | |
| on-accent / on-warning / on-gold | `#fffdf8` / `#2a2006` / `#1e1a16` | |
| scrim | `#0e0c0a` | |

### Dark

| Token | Value | Notes |
| --- | --- | --- |
| canvas | `#14120f` | ink stone |
| surface | `#1d1a16` | |
| surface-2 | `#2a2620` | |
| line | `#3a342c` | |
| ink | `#f1ebdf` | |
| muted | `#b8ad9c` | |
| subtle | `#7d7366` | decoration only |
| primary / -shadow / -soft | `#efe6d4` / `#d3c7b0` / `#3a342b` | paper on ink |
| secondary / -shadow / -soft | `#e5775f` / `#c95e47` / `#3e211a` | |
| danger / -shadow / -soft | `#f07c96` / `#d25f79` / `#3f1d26` | |
| warning / -shadow / -soft | `#e8b64f` / `#c99a36` / `#372b13` | |
| gold / -shadow | `#d6b56c` / `#b89650` | |
| on-accent / on-warning / on-gold | `#14120f` / `#2a2006` / `#14120f` | |
| scrim | `#050403` | |

## Typography

Owner decision D9: Chinese text uses the system CJK font (`PingFang SC`, `Hiragino Sans GB`,
`Microsoft YaHei`, `Noto Sans CJK SC`), so the PWA never precaches megabytes of CJK font. Latin text and
digits use self-hosted Noto Sans 400/600 (SIL OFL), the latin subset only. Noto Sans comes first in the stack,
because it holds no CJK glyphs, so Chinese falls through to the system font and Latin text looks the same on
every device.

## Board

`board-ui` draws the board with `grid="points"` (plat-009): pieces stand on intersections.
`src/features/board/BoardLines.tsx` draws the lines in the underlay:

- a heavier outer frame and 10 rank lines;
- file lines broken at the river, except the two edge files;
- both palaces' diagonals;
- corner brackets on the cannon and soldier starting points, halved at the edges;
- 楚河 漢界 in the river, drawn from glyph paths like the pieces.

The drawing is symmetric, so it needs no change when the board is flipped for Black.

| Theme | Board | Lines | Use |
| --- | --- | --- | --- |
| Maple (枫木), default | `#e7c58a` | `#5a3a1c` | the club-set look |
| Xuan paper (宣纸) | `#f2e9d5` | `#2a2622` | ink on paper, lowest contrast noise |
| Ink night (墨夜) | `#2b2520` | `#c9b48d` | dark mode |

Selection, last move and hints use `board-ui`'s point-mode discs, in the seal and ink colours.

## Pieces

Owner decision D4: traditional characters, 帥仕相傌俥炮兵 for Red and 將士象馬車砲卒 for Black, drawn as SVG
paths, not font text. `scripts/generate-glyphs.mjs` fetches a subset of exactly these characters (plus 楚河漢界)
of **Noto Serif TC Black** from Google Fonts. It writes their outlines, centred in a 100×100 box, to
`src/features/board/glyphs.ts`, which is committed.

- **License:** the outlines are under the SIL Open Font License 1.1, © 2017-2024 Adobe. The license text is
  in `src/features/board/OFL.txt`, next to the generated file.
- **Why this font:** the black serif weight stays legible at 28–40px, the size of a point's cell on a phone.
  A lighter calligraphic face (LXGW WenKai TC, also OFL) was tried: it has more character, but its thin strokes
  read weakly at 40px.

Each piece is a disc with a darker edge offset downward (a carved thickness) and an inner ring in the piece
colour. The character is cinnabar `#b3261e` for Red and ink `#1f1a17` for Black. Red and Black differ in two
ways, colour and the character itself, so colour-blind players can still tell them apart.

## Owner decisions (2026-09-18)

The owner approved the Mo direction after seeing the live site, so the shipped defaults stand:

1. **Direction:** ink and seal on paper, with a maple board. Approved.
2. **Default board:** maple (xuan paper and ink night stay as the other two themes).
3. **Piece characters:** Noto Serif TC Black outlines, chosen for legibility at 28px.
