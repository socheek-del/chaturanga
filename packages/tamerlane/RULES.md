# Tamerlane Chess

This edition follows the common 11×10 array and the rules collected in [Great chess](https://en.wikipedia.org/wiki/Tamerlane_chess#Tamerlane_chess). White starts. There are 28 pieces per side, with eleven distinct pawns and two citadels. The playable main board uses files b through l in the app. The citadels are a9 for Black and m2 for White.

| Piece | Move |
| --- | --- |
| Shah, prince, adventitious king | One square in any direction. |
| Rook | Any distance orthogonally. |
| Knight | A two-by-one leap. |
| Picket | Two or more squares diagonally. A piece on the first square blocks it. |
| Giraffe | One diagonal step followed by at least three straight steps outward in either direction of that diagonal. Any intervening piece blocks the move. |
| Ferz | One square diagonally. |
| Vizier | One square orthogonally. |
| Elephant | Two squares diagonally in a single leap. |
| Camel | A three-by-one leap. |
| War engine | Two squares orthogonally in a single leap. |
| Pawns | One square straight forward when empty, or one diagonal step forward to capture. |

There is no castling, en passant or double pawn step. An army with several royals can move into attack and lose all but its last royal by capture. With just one royal, king safety applies. A checked shah may spend its one-time privilege to trade places with a friendly non-royal piece if that leaves it safe. Checkmate and stalemating the opponent win. Baring a king does not end the game. This edition has no repetition or halfmove draw.

Only the highest surviving royal (shah, prince, adventitious king) may step into an empty opposing citadel and thereby draw. A shah with a lower royal can instead spend a separate one-time exchange to send that royal into the citadel and take its former square. Select the lower royal and then the citadel to make this exchange. Only an adventitious king can enter its own citadel. It is immune there and blocks the opposing royal.

A normal pawn reaching the last rank becomes the piece it represents. The king's pawn becomes a prince. On its first arrival, the pawn of pawns waits on the last rank and is immune to capture. When there is a legal redeployment that forks two opposing pieces or attacks a single piece with no legal escape and no immediate capture of the pawn, redeployment is mandatory. A non-royal, non-immune occupant of the chosen square is removed. On the next arrival at the last rank, the pawn returns to the king's pawn's home square. If occupied, it uses the nearest vacant square on that rank, with ties resolved toward the pawn of pawns' original file. If the rank is full, the promotion move must wait. On its third arrival it becomes an adventitious king.

The sources disagree or are silent on some unusual positions. The occupied home-square fallback and the precise redeployment test are implementation choices. The [Zurafa rules](https://zurafa.app/en/rules/) describe similar tactical and placement choices, with a broader shah exchange and optional redeployment. [Falkener's historical account](https://www.rarebooksocietyofindia.org/book_archive/196174216674_10152096483196675.pdf) shows a different interpretation of the pawn of pawns and some movements.

FEN uses a padded 13×10 rectangle, where only a9 and m2 are playable on the edge files. The third field carries the two shah-exchange rights (`Kk`), the two citadel-exchange rights (`Qq`) and a draw-on-entry mark (`D`). Piece codes preserve the identity and promotion stage of each pawn. UCI uses ordinary algebraic squares through m10, with a lowercase suffix for forced promotions. A citadel exchange uses the lower royal's source square.
