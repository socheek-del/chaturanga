# Shatranj rules

This is the classical Persian and Arabic game. It uses the historical bare-king rule described by H. J. R. Murray and the initial arrangement used by Fairy-Stockfish’s Shatranj variant.

- The game uses an 8×8 board. Both kings start on the d-file, both ferzes on the e-file, and pawns occupy the second and seventh ranks. White moves first.
- Kings, rooks and knights have their ordinary movement. The alfil jumps exactly two squares diagonally and can leap over the intervening piece. The ferz steps one square diagonally.
- A pawn moves one square forward, captures one square diagonally forward and promotes to a ferz on the last rank. Castling, double pawn moves and en passant are absent.
- A move must leave the mover’s king safe. Checkmate and stalemate win for the opponent of the side with no legal move. Baring the opponent’s king also wins. If that king can legally take the winner’s last remaining piece on its immediate reply, the engine adjudicates a draw.
- Threefold repetition and 70 moves by each side without a pawn move or capture are automatic draws. These digital draw conventions follow the reference variant.

FEN uses `b` for alfil and `q` for ferz for reference compatibility. A promotion in coordinate notation is suffixed with `q`. FEN stores the resulting type. Replay preserves the record that a pawn promoted.

Sources: [Murray, *A History of Chess* (1913), pp. 229–230](https://archive.org/details/AHistoryOfChess), [Shatranj overview](https://en.wikipedia.org/wiki/Shatranj), [Fairy-Stockfish Shatranj implementation](https://github.com/fairy-stockfish/Fairy-Stockfish/blob/master/src/variant.cpp).
