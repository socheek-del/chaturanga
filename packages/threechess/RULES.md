# Three-player chess on hexagonal cells

This is an original interpretation of the hex-cell board category described in the
[three-player chess overview](https://en.wikipedia.org/wiki/Three-player_chess#Boards_with_hexagonal_cells).

## Board and moves

- There are 91 playable cells on a regular hexagon, with six cells along each edge. White, Black and Red
  take turns in that order. Their starting positions are rotations of the same six-piece back row and
  six-pawn front row, on alternating edges.
- Rooks slide along any of the six edge directions. Bishops slide along the six corner directions. A
  queen combines both. Sliding pieces stop at the first occupied cell on their path.
- Kings can take one rook or bishop step. Knights jump two edge steps in one direction and then one
  step in either neighboring direction, for twelve possible jumps before board boundaries.
- Pawns take one forward edge step and capture on either immediately neighboring edge direction.
  Each army has its own forward direction. When a pawn lands where it cannot step farther forward
  because of the board boundary, it promotes to a queen, rook, bishop or knight.
- The rules have no double pawn step, en passant or castling.

## Endings

A move must leave the mover's king safe. A player who begins their turn in check and cannot escape
is eliminated. Their remaining pieces block movement, can be captured and have no attacks.
A stalemated player passes. If all active players are stalemated the game is drawn. The last active
king wins. The game has no automatic repetition or move-count draw.

## Engine

The shared Variant uses an 11×11 coordinate envelope (a–k, 1–11), with 30 unused positions outside
the hexagon. The engine rejects moves to those positions. FEN uses dots outside the board and hyphens
for empty playable cells. Hex saves use a separate browser storage key from the original ring.
