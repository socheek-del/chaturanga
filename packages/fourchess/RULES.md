# Four-handed chess: selected FFA rules

This contract is a clean-room digital ruleset for the generic four-handed chess family. It selects a modern Free-for-All profile documented for current play, without claiming it is the most popular form across all eras. Source provenance and adoption limits are recorded in `apps/fourchess/docs/reports/Four-handed chess rules and adoption.md`.

## Board and setup

- The board is a 14×14 coordinate envelope, files `a`–`n` and ranks `1`–`14`. A square is playable when its file is `d`–`k` or its rank is `4`–`11`; this removes the four 3×3 corners and leaves 160 squares.
- Red sits south and moves first. Blue sits west, Yellow north and Green east. Turns advance Red → Blue → Yellow → Green, skipping eliminated seats.
- Each seat has a King, Queen, two Rooks, two Bishops, two Knights and eight Pawns. The armies occupy the outer two ranks/files of their wings; the third wing rank/file is empty.
- The Red and Yellow back rows read `R N B Q K B N R` when viewed while facing the center. Blue and Green read `R N B K Q B N R`; this rotates the King and Queen positions so all four Queens begin on the same square color. Each Pawn line is immediately ahead of its back row.

## Movement and king safety

- Rooks, Bishops, Queens, Knights and Kings use their ordinary chess movement, clipped to playable cells. They capture any opponent's active piece but never a King.
- Pawns advance one cell toward the center, may advance two cells on their first move if both cells are empty, and capture one cell diagonally forward. En passant is available only on the immediately following seat turn after a two-cell Pawn advance, when the moving Pawn could capture onto the crossed cell.
- A Pawn promotes automatically to a Queen upon reaching its own eighth rank, counted from its starting line. A promoted piece is worth one point if captured.
- Castling uses the ordinary two-cell King move toward a home-line Rook. The King and chosen Rook must be unmoved, all cells between them empty, and the King may not castle out of, through, or into attack by any active opponent. The Queen blocks one of Blue and Green's two castling paths in the selected start position, as it occupies that home-line cell.
- A move is illegal if it leaves the moving seat's King attacked by an active opponent. Eliminated pieces are inert: they neither move nor attack.

## Turns, elimination and points

- A seat is checked when its King is attacked. Checkmate or stalemate is resolved when that seat's turn begins, after all earlier seats have had their turns. A checkmated or stalemated seat is eliminated; its remaining pieces stay on their cells as inert blockers and can be captured for no points.
- Capturing an active Pawn earns 1 point, Knight 3, Bishop 5, Rook 5 and Queen 9. Any promoted piece is worth 1. A move that newly checks two Kings earns 1 point if the checking piece is a Queen, otherwise 5; a move that newly checks three Kings earns 5 for a Queen, otherwise 20. Checkmate earns 20 points for the seat whose move most recently placed an attack on that King. Stalemate elimination awards 10 points to each other active seat.
- A player may resign. Resignation eliminates that seat immediately, marks its remaining pieces inert and gives no score. V1 has no clocks or timeout behavior.
- The game ends when three seats have been eliminated. The seat with the highest total score wins even if it was eliminated earlier. A tie for the highest score is resolved by later survival; seats eliminated in the same round remain tied and share the result.

## Draws and digital conventions

- Three occurrences of the same position with the same active seats, turn, castling rights and en-passant availability end the game. Each active seat receives 10 points; the top-scoring active seat or tied seats receive the result.
- A bare-kings ending (all active seats have only their King) is an automatic draw, with the same 10-point award.
- A 50-round draw occurs after 50 complete cycles through the current active seats without a Pawn move or capture. It is automatic, with the same 10-point award.
- The `rules-core` terminal result must preserve the winning seat or tied seats and every seat's score. A result that only stores a conventional two-player winner is insufficient for this game.
- Online rooms have four private seats and no chat. Every move and resignation is validated by the server-side Variant. Bots use an injected seed and a fixed node budget; rules evaluation itself is deterministic and has no ambient randomness, clock or network dependency.
