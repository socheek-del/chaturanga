# Four-handed chess source notes

Reviewed 2026-11-26. Source excerpts below are paraphrased; no source artwork or prose is reused in the product.

## Modern rules

- Chess.com, [4 Player Chess rules overview](https://www.chess.com/terms/4-player-chess): 160-square cross, four colors, Red first and clockwise order, point-scored Free-for-All, capture/check scoring, eighth-rank automatic Queen promotion, eliminated inactive pieces, and common draw cases.
- Chess.com, [4PC help](https://support.chess.com/en/articles/8614233-4-player-chess-4pc): published 2025-10-10; current help summary for FFA scoring, 8th-rank promotion, dead pieces, three-player elimination and draw handling.
- Chess.com, [2026 event rulebooks](https://www.chess.com/official-event-rules): current championship uses four-player FFA and random player-to-color assignment. Its placement points describe Arena event ranking, not the underlying game score.
- 4 Player Chess +, [rules page](https://4playerchess.plus/rules): a separate current implementation explicitly describes 14×14 with four 3×3 corners omitted, ordinary chess movement, castling, en passant, two-step Pawns and the eighth-rank promotion line. Used as a cross-check on geometry and movement only; no text/art is reused.

## Historical context

- George Hope Verney, [Four-handed Chess (1881)](https://play.google.com/store/books/details/George_Hope_Verney_Four_handed_Chess?id=ZEMCAAAAQAAJ): an earlier documented partnership edition. The modern product chooses FFA instead, and does not claim historical or cross-platform popularity superiority.

## Rights boundary

- U.S. Copyright Office, [Games](https://www.copyright.gov/register/tx-games.html): the idea/method of play is not protected by copyright; original rules text and art can be. This is used as project research, not as a global legal opinion.

## Adoption caveats

- Four-handed chess has multiple board, team, elimination and scoring conventions, and no universal federation rules were identified.
- A current tournament being documented does not prove it is the most played form.
- Current Chess.com help and its rules overview differ in some score/end details. The exact local convention is therefore stated in `packages/fourchess/RULES.md` and must be tested as written.
