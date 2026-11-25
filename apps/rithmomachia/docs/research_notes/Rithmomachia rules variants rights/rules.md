# Rithmomachia rules research

Research date: 2026-11-26. Rithmomachia has no single standard ruleset. Product rules follow the
common medieval/Renaissance family selected in
[`variants.md`](variants.md); product-specific choices are recorded in
[`apps/rithmomachia/docs/PLAN.md`](../../PLAN.md).

## Source-backed features

- Board: 8 files by 16 ranks; both sides occupy 24 cells at opposite ends.
- Equipment: circles, triangles, squares, and composite pyramids. White follows the even value
  table; Black follows the odd table. Each side has eight circles, eight triangles, seven squares,
  and a pyramid occupying one square.
- Selected movement: circles move one square diagonally; triangles move exactly two squares
  orthogonally; squares move exactly three squares orthogonally. Pyramids use the movement of any
  remaining component. No jumping over occupied squares.
- Wikipedia calls meeting, assault, ambuscade, and siege the capture methods for this rules family.
  It describes common capture-count victories and proper progression victories. `Victoria magna`
  is a three-piece arithmetic progression.

## Sources and limits

- [Wikipedia: Rithmomachia gameplay](https://en.wikipedia.org/wiki/Rithmomachia#Gameplay)
- [University of Cape Town: *Rhythmomachia and its Rules*](https://open.uct.ac.za/server/api/core/bitstreams/82db129d-89a2-4f1a-8a8a-de0f5df55724/content)
- [American Mathematical Society: *The Battle of Numbers*](https://mathvoices.ams.org/featurecolumn/2021/07/01/the-battle-of-numbers/)
- [Bayerische Staatsbibliothek: Selenus 1616/17 scan](https://www.digitale-sammlungen.de/en/details/bsb10328556), a historical comparison source

Historical summaries do not settle all digital details, such as reserve placement, partial pyramid
capture, assault distance, and choice of a single default victory condition. The PLAN and package
RULES documents define those v1 conventions so the engine and tutorial use the same rules.
