# Traditional piece art — credits and licence

The SVG files in this folder are the traditional Makruk piece drawings used by the "Traditional wood"
piece set (`ไม้แกะแบบดั้งเดิม`). They are **not** original to this project.

- **Author:** Yevrowl
- **Source:** Wikimedia Commons, [Category:Makruk pieces](https://commons.wikimedia.org/wiki/Category:Makruk_pieces)
- **Licence:** [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)

| File | Commons file | Piece |
|---|---|---|
| `khun-white.svg` / `khun-black.svg` | Khun white.svg / Khun black.svg | Khun (king) |
| `met-white.svg` / `met-black.svg` | Met white.svg / Met black.svg | Met (queen) |
| `khon-white.svg` / `khon-black.svg` | Khon white.svg / Khon black.svg | Khon (bishop) |
| `ma-white.svg` / `ma-black.svg` | Ma white.svg / Ma black.svg | Ma (knight) |
| `ruea-white.svg` / `ruea-black.svg` | Ruea white.svg / Ruea black.svg | Ruea (rook) |
| `bia-white.svg` / `bia-black.svg` | Bia white.svg / Bia black.svg | Bia (pawn) |
| `biangai-white.svg` / `biangai-black.svg` | Biangai white.svg / Biangai black.svg | Bia Ngai (promoted Bia) |

## Rules for this folder

- The files are stored **verbatim**. Do not edit them, optimise them or re-colour them in place.
  Re-download with `node scripts/import-traditional-pieces.mjs` instead.
- `traditional.tsx` renders each piece as two of these files stacked — the "black" file is the filled
  silhouette, the "white" file is the carved line art — and supplies the colours at render time so the set
  works on every board theme. That is a rendering choice; the drawings themselves are untouched.
- CC BY-SA 4.0 is one-way compatible with GPL-3.0, so the art can ship inside this GPL-3.0 project, but the
  attribution above must travel with it and any modified version of the art must stay under CC BY-SA 4.0.
  The app credits the author on its About page.
