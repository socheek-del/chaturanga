# Traditional piece art — credits and licence

The "Traditional" piece set is the Staunton set used across Wikipedia's chess articles.

- **Author:** Cburnett (User:Cburnett on Wikimedia Commons)
- **Source:** [Category:SVG chess pieces](https://commons.wikimedia.org/wiki/Category:SVG_chess_pieces),
  files `Chess_klt45.svg` … `Chess_pdt45.svg`
- **Licence:** triple-licensed **GPLv2 or later**, **BSD** and **CC BY-SA 3.0**. This project ships it under
  the GPL, which is what `LICENSE` at the repository root already is.

## Rules for this folder

- The files are stored **verbatim**. Do not edit them, optimise them or re-colour them in place.
  Re-download with `node scripts/import-traditional-pieces.mjs` instead.
- The app renders each file as it is — the set already carries its own two colours, so nothing is recoloured
  at render time and the drawings are untouched.
- The attribution above must travel with the art: the app credits the author on its About page, and any
  modified version of a drawing stays under the same licence.
- The other set, "Marble", is drawn in this repository (`../../PieceSvg.tsx`) and is not affected by any of
  this.
