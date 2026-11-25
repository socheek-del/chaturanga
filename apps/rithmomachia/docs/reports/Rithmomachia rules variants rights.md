# Rithmomachia rules, variants, and rights research

Research date: 2026-11-26. This note selects a source-backed historical rules family for the
product. The game was not standardized, and this selection does not imply that every historical
school followed the same rules.

## Selection

Use the **common medieval/Renaissance rules** described in the linked Wikipedia article's Gameplay
section. The article labels this version the most common, and distinguishes it from Fulke's
16th-century variant. Historical scholarship also documents substantial variation between
teachers and editions; surviving sources do not provide comparable player counts for competing
rulesets. This is therefore the strongest available popularity signal, not a quantified ranking.

The product previously considered a Selenus 1616-only reconstruction because the roadmap linked
to the Selenus-based Mebben summary. That choice was replaced: its movement rules (orthogonal
circles, diagonal triangles, and squares moving in eight directions) differ from the article's
most-common rules. It remains a useful comparison source, not the product's rules baseline.

## Rules evidence

- The board is 8 by 16. Each side has 24 occupied squares with circles, triangles, squares, and a
  composite pyramid. The primary-era setup and value table are independently transcribed in the
  University of Cape Town's *Rhythmomachia and its Rules*; the AMS account gives the even/odd
  number tables and pyramid components. Use the game's exact independently recorded fixture in
  `packages/rithmomachia/src/layout.ts`.
- The selected article describes circles moving one diagonal step, triangles exactly two
  orthogonal squares, and squares exactly three orthogonal squares. Pyramids use the movement of
  their remaining components.
- The article describes meeting, assault, ambuscade, and siege. It describes common victory goals
  based on captured pieces and proper victory progressions; `victoria magna` is a three-piece
  arithmetic progression. It also notes that historical capture rules and victory conditions
  varied.
- Historical summaries do not settle every interactive detail needed by a digital engine. The
  product records its choices explicitly: captures and reserve placements consume a turn; captured
  pieces change sides and return to the captor's home rank only via a later reserve placement;
  assault counts empty cells between; ambuscade uses addition only; siege checks four orthogonal
  neighbors; and the default win is a three-piece arithmetic progression in the opponent's half.
  Threefold repetition and a 200-ply non-capture draw are software adjudications.

## Source and adaptation boundary

The Bayerische Staatsbibliothek catalogs and scans Gustavus Selenus's 1616/17 book, a related
historical witness. Its digital object is marked “No Copyright—Non-Commercial Use Only.” Do not
ship the scan, the library's modern translation, or its image files. Copyright guidance distinguishes
game methods from original explanatory writing and artwork. The selected rules will be implemented
and explained in original code and prose; no modern source's tables, translations, diagrams, or art
will be copied. This supports independent implementation of historic mechanics, not a worldwide
legal opinion. The product name receives a separate brand review before public promotion.

## Sources

- [Wikipedia: Rithmomachia, Gameplay](https://en.wikipedia.org/wiki/Rithmomachia#Gameplay)
- [University of Cape Town: *Rhythmomachia and its Rules*](https://open.uct.ac.za/server/api/core/bitstreams/82db129d-89a2-4f1a-8a8a-de0f5df55724/content)
- [American Mathematical Society: *The Battle of Numbers*](https://mathvoices.ams.org/featurecolumn/2021/07/01/the-battle-of-numbers/)
- [Mebben: Selenus reconstruction](https://www.jducoeur.org/game-hist/mebben.ryth.html)
- [Bayerische Staatsbibliothek: 1616/17 catalog and scan](https://www.digitale-sammlungen.de/en/details/bsb10328556)
- [RightsStatements.org: NoC-NC](https://rightsstatements.org/page/NoC-NC/1.0/?language=en)
- [U.S. Copyright Office: Games](https://www.copyright.gov/register/tx-games.html)
