# Medieval Courier Chess

The board has twelve files (a–l) and eight ranks. White moves first. Both players begin after the obligatory joyleaps. The rook pawns and the ferz pawn are two ranks ahead of their ordinary starting squares, and the ferz is two ranks ahead of its back-rank square. Both kings start on file f. Both sides use the same piece files.

| Piece | Move |
| --- | --- |
| King | One square in any direction. It must stay out of check. |
| Sage | One square in any direction. It can be captured like any other non-royal piece. |
| Ferz | One square diagonally. |
| Schleich | One square orthogonally. |
| Courier | Any number of squares diagonally, stopping at the first occupied square. |
| Alfil | Exactly two squares diagonally, leaping the intervening square. |
| Knight | A standard knight leap. |
| Rook | Any number of squares orthogonally, stopping at the first occupied square. |
| Pawn | One square forward when empty, or one square diagonally forward to capture. |

A pawn reaching the last rank immediately becomes a ferz. There is no castling, en passant, or double pawn advance in free play. Win by checkmate. Stalemate, threefold repetition and 100 halfmoves without a capture or pawn move are draws.

Sources differ on the details of medieval promotion, and the stalemate outcome is unknown. This implementation chooses immediate promotion from the alternatives in the [medieval rules](https://en.wikipedia.org/wiki/Courier_chess#Medieval_rules). The draw rules are digital conventions. [Byway’s reconstruction](https://www.mayhematics.com/s/couri.htm) corroborates the piece moves and compulsory opening, with a different central file in its setup. The [museum reconstruction](https://www.schachmuseum-loeberitz.de/images/stories/Dateien/Kurier-Schach.pdf) documents return leaps for promotion.

FEN uses letters `p r n a c m k f s` for the pieces and up to twelve consecutive empty squares per rank. UCI moves use four-character coordinates with `f` appended for promotion. The rules suite compares legal moves and FENs with Fairy-Stockfish configured for this setup.
