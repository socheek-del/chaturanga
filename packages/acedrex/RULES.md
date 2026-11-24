# Grande Acedrex

This edition uses the dice-free Cazaux and Musser reconstruction summarized in the [Grant Acedrex rules](https://en.wikipedia.org/wiki/Grant_Acedrex#Rules). Alfonso X's manuscript also documents an optional die, preserved in the [Digital Ludeme Project translation](https://ludii.games/data.php?gameId=292). The game has twelve files and twelve ranks. The armies start on ranks 1 and 12, with pawns on ranks 4 and 9. White moves first.

| Piece | Move |
| --- | --- |
| King | One square in any direction. On its first move it may also leap two squares straight or diagonally, provided its destination is safe. |
| Aanca | One diagonal step. From an empty bend square it may continue outward along either orthogonal direction of that diagonal. |
| Unicornio | A knight leap. From an empty bend square it may continue diagonally outward in the same quadrant. |
| Lion | A three-square orthogonal jump or a three-by-one leap. |
| Giraffe | A three-by-two leap. |
| Crocodile | A diagonal slide, like a modern bishop. |
| Rook | An orthogonal slide. |
| Pawn | One square straight ahead when empty, or one square diagonally ahead to capture. |

The bent pieces can stop on their bend square. Any piece on that square stops the continuation, and subsequent sliding stops at the first occupied square. The king leap passes over intervening squares and uses normal capture and landing-square safety. There is no castling, double pawn step or en passant.

When a pawn reaches the last rank, it immediately becomes that file's original piece. A pawn on the king's file becomes an Aanca. Checkmate, stalemating the opponent and capturing their last non-king piece are wins. Threefold repetition and 100 halfmoves without a capture or pawn move are digital draw conventions.

The third FEN field tracks the king leap rights using `K` and `k`. The fourth field is always a hyphen. UCI uses algebraic coordinates through l12 with a lowercase piece suffix for promotion. FEN stores promoted pieces as their resulting type.

The installed Fairy-Stockfish WASM does not accept this 12×12 setup. The test suite uses independent move fixtures and seeded replay and undo checks on the full board.
