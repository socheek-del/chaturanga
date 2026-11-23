# Three-player chess (Chaturanga Ring)

This product uses one clear house-rule variant from the wider family of three-player chess. It is built for
three people sharing one screen. The board is 8 files by 12 ranks: three four-rank sectors joined into a
continuous ring. Every sector has one full chess army (back rank and pawns), and White, Black and Red move
in that order. A pawn's forward direction is clockwise around the ring.

## Board and setup

- Files are `a`–`h`; ranks are `1`–`12`. Ranks 1–4, 5–8 and 9–12 are the White, Black and Red home sectors.
- Each army starts on the first two ranks of its sector, in the usual `RNBQKBNR` order with pawns in front.
- Rank 12 wraps to rank 1 for movement. Files do not wrap.
- The three sectors are tinted blue, charcoal and vermilion. Their colours identify seats and do not change ownership.

## Moves and endings

- Rooks, bishops, queens, knights and kings use their usual chess moves on the 8×12 ring. Sliding moves stop at
  the first occupied square. A knight wraps over the rank seam like any other piece.
- Pawns move one rank clockwise, may move two from their initial rank if both squares are clear, and capture
  one file to either side. En passant is available to the next seat after a two-square pawn move.
- A pawn that reaches the next player's home rank promotes automatically to a queen.
- Castling is available on each army's back rank under the familiar clear-path, unmoved-piece and unattacked-path
  conditions.
- A king is never captured. A player in check must resolve it on their turn. If they have no legal move then,
  they are checkmated and eliminated. Their remaining pieces stay as inert blockers and can be captured.
- A player with no legal move while not in check is stalemated and passes. If every remaining player is
  stalemated, the game is a draw. The last king standing wins.
- There is no repetition or move-count draw in this first release.

These rules deliberately specify one playable interpretation rather than imply there is a single standard.
Wikipedia describes multiple three-player boards and endings. The 96-square hexagon is a common choice; this
product keeps 96 cells but lays them out as a ring so the three equal four-rank sectors and clockwise pawn
direction are explicit.

## Engine notes

The engine implements the shared `Variant` interface with a three-seat turn list. No Fairy-Stockfish variant
models this custom three-seat ring, so it is verified by the shared conformance suite plus its own board,
move, check, elimination and promotion fixtures instead of a two-player lock-step run.

## Sources

- [Three-player chess variants](https://en.wikipedia.org/wiki/Three-player_chess)
- [A 96-square three-player layout and one set of rules](https://www.bigboard.games/games/chess/3-players)
