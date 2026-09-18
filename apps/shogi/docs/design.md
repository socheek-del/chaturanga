# "Kaya" (榧) — the Shogi site's design identity

Proposed for owner approval (sg-004, decision D7). Until it is approved this is a proposal, and the live
site is styled on it at the owner's risk — the same gate Sittuyin's "Daung" and Xiangqi's "Mo" went through.

Screenshots: `apps/shogi/docs/evidence/design-{light,dark}-{390,1280}.png`, plus the English pair at 1280.
They come from the showcase page at `/design` (`npm run capture:design -w apps/shogi/web`).

## The idea

A Shogi set is wood and ink. The board is a slab of torreya (榧, *kaya*), the pieces are five-sided tablets
of the same family of wood, and everything written on them is brush-written sumi — except a promoted face,
which is written in vermilion. Nothing on a real set is coloured to tell the players apart: a piece belongs
to whoever it points at.

So the site is warm wood and paper, with **indigo** (藍) for the things you press and **vermilion** (朱) kept
for one job: a promoted piece. That keeps red meaningful. It borrows nothing from Duolingo — no rounded
cartoon buttons, no zig-zag path, no owl, no bright green — and nothing from the other games in the family:
Makruk is temple gold, Sittuyin is lacquer, Xiangqi is ink on xuan paper.

## Colour

Tokens live in `apps/shogi/web/src/index.css` and cover every name in `packages/ui/TOKENS.md`.

| Token | Light | Dark | Used for |
| --- | --- | --- | --- |
| `canvas` | `#f6efe1` | `#15130e` | Page |
| `surface` / `surface-2` | `#fffcf4` / `#eee3cb` | `#1e1b15` / `#2b271e` | Cards, trays |
| `line` | `#ddcfad` | `#3c352a` | Borders |
| `ink` | `#221d16` | `#f2ecdd` | Text |
| `primary` | `#1f3d5c` | `#9dc0e0` | Buttons, headers |
| `secondary` | `#a8231f` | `#e5775f` | A promoted piece, the seal |
| `warning` / `gold` | `#b07a12` / `#9c7a35` | `#e8b64f` / `#d6b56c` | Promotion prompt, XP |
| `danger` | `#a51d3c` | `#f07c96` | Resign, check |

Dark mode is not the light palette inverted: the wood stays warm and the indigo lifts to a pale blue so it
still reads as the thing you press.

## Type

System Japanese first, self-hosted Noto Sans for Latin and numbers (decision D9):

```
'Noto Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', 'Noto Sans JP', 'Meiryo', ui-sans-serif, system-ui
```

No Japanese font file is ever downloaded. The piece kanji are **SVG outlines**, generated once from Noto
Serif JP Black (OFL, `npm run glyphs -w apps/shogi/web`), so the board looks the same on every device and
costs nothing to load.

## The board

- 9×9 squares, thin dark lines on wood, and the four 星 dots where the promotion zones meet.
- Three board themes: **榧 Kaya** (the default, warm yellow), **新榧 Shinkaya** (paler) and **夜 Yoru** (dark).
- Coordinates as a player sees them: files 9…1 from the left, ranks 一…九 downwards (D12). The engine keeps
  its own square names; this is a display mapping only (plat-013).

## The pieces

- One five-sided tablet per piece, pointing at its owner; the far player's pieces are turned 180°.
- Sumi kanji: 王 飛 角 金 銀 桂 香 歩, with 玉 for Gote's king as on a real set.
- Promoted faces in vermilion: 龍 馬 全 圭 杏 と.
- Readable at 40px, which is about one square on a phone board (checked in the showcase).

## What is still open

- Owner approval of the identity as a whole (sg-004).
- A mascot or illustrations: Shogi has none yet, and may never need one.
- Sounds reuse the shared set for now.
