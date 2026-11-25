# Russian Four-Handed Fortress Chess — digital rules

This package implements the Petrov-described Russian fortress game named by the Wikipedia catalog. The sources establish the core rules but not a ranked popularity winner. These are an independent digital reconstruction, not a transcription. The historical scan was not available for direct inspection during planning. Source findings and rights notes are in `apps/fortress/docs/reports/Fortress Chess rules and rights.md`.

## Board

- Coordinates use files `a`–`p` and ranks `1`–`16`.
- The core rectangle is `c3`–`n14`; its central 8×8 is `e5`–`l12`. The four corner fortresses are 4×4 blocks: `a1`–`d4`, `m1`–`p4`, `a13`–`d16`, and `m13`–`p16`. Each fortress overlaps a 2×2 corner patch of the core. Overlap squares are one cell. The union contains 192 playable cells in a 16×16 envelope; the non-fortress part of the four-handed board has 128 cells.
- Each corner fort has two 2-edge walls meeting at a vertex. For the bottom-right fort, one wall lies between files `m|n` on ranks 3–4 and one lies between ranks `4|5` on files `m–n`; rotate this pattern for the other three forts. These walls match the published Ludii topology and Markov's forbidden diagonal examples: a diagonal touching a wall vertex is blocked, including a knight's diagonal leg. Sliding paths cannot cross a wall or cut diagonally around its end.
- The ordinary armies occupy the four 2×8 arms around the central 8×8. Each has eight back-rank pieces and eight pawns facing inward. The back rank is rook, knight, bishop, queen, king, bishop, knight, rook in each seat's local left-to-right order; the king is on that player's right of the queen.

## Players and setup

- Seats move clockwise: top Red (`r`), right Blue (`b`), bottom White (`w`), left Black (`k`). Red and White are partners; Blue and Black are partners. Red moves first.
- Each seat receives one extra rook, bishop, and knight. During setup, that seat places all three in distinct cells of its right-hand 4×4 fortress. The setup order follows the turn order; ordinary moves begin after the fourth seat has placed all three.
- The right-hand fortress for each seat is the corner in that seat's local right direction: top Red at top-left, right Blue at top-right, bottom White at bottom-right, left Black at bottom-left.

## Movement and capture

- Rook, bishop, queen, king, and pawn movement follows orthodox chess, constrained to playable cells and walls. A king and its partner may not capture one another. Allied pieces block paths and cannot be captured.
- A knight uses one orthogonal step and one diagonal step, in either order. It jumps intervening pieces, but neither route may cross a fortress wall or use a forbidden diagonal around a wall end.
- Pawns advance one cell inward and capture one cell diagonally forward. Their first move may advance two cells if both cells and the route are clear. En passant against an enemy pawn is allowed only on the immediately following seat's move after a two-cell advance.
- A pawn promotes to a queen, rook, bishop, or knight upon reaching any of the four ordinary home ranks. Promotion on fortress cells is deliberately not supported because the historical descriptions do not settle it.
- Orthodox castling applies along each seat's axis: the king moves two cells toward an unmoved rook and the rook passes over it. The path must be clear, may not cross a wall, and the king may not start in check or pass through or finish in check. A seat's own king is the only allied king whose safety constrains its move.
- A move may give check to an opposing king. A move must leave the moving seat's king safe. Checks to a partner do not constrain the move.

## Checkmate, elimination, and game end

- Each active seat gets its turn in clockwise order; eliminated seats are skipped. An active seat in check with no legal move is checkmated at the start of that seat's turn. Remove that seat's king and all its pieces immediately.
- The two teams each have two seats. A team wins only after both opposing seats have been checkmated and removed.
- Digital reconstruction choice: if an active seat has no legal move and is not in check, the game is immediately drawn. The historical stalemate rule is not established; this follows Markov's preferred interpretation.
- Fortress promotion, a bare-king result, automatic repetition, and move-count draws are not added. No source-backed rule for those cases was identified.

## References

- Georgi Markov, “Russian four-handed chess: myths and misconceptions,” *Board Game Studies Journal* 9 (2015), 41–49: https://bgsj.ludus-opuscula.org/PDF_Files/41_49_Markov_web.pdf
- Ludii Portal, “Russian Fortress Chess,” DLP.Games.1047: https://ludii.games/details.php?keyword=Russian+Fortress+Chess
- Petrov's first-hand accounts, identified by Markov: *Schachzeitung* 5 (November 1850), 377–384; *Шахматный листок* 44 (August 1862), 181–187.
- Contemporary cross-reference: *Lehrbuch des Schachspiels* (1853), https://www.textgridrep.org/browse/4bj4w.0
