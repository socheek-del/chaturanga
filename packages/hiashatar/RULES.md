# Hiashatar

This product implements the documented modern 10×10 Mongolian game described by Mats Winther, cross-checked with the Wikipedia Hiashatar overview. The initial armies are mirrored, with White's king and queen exchanged from the ordinary back-rank order. Each side has two hia (bodyguards) between its bishops and central pieces. A hia moves at most two squares in any queen direction. It cannot capture the opposing noyon (king) or give check.

An opposing hia protects the eight surrounding squares and its own square. Other pieces, including hia, that begin in that zone can move only one square in a direction their piece permits. A rook, bishop, queen or hia that enters the opposing zone along a sliding move must stop on the first zone square. Horses (knights) ignore both restrictions and may jump into or out of a zone. Zones are hostile only: a player's own hia never slows that player's pieces.

Pawns move and capture as in international chess. From their starting rank they may advance one, two or three empty squares, stopping when blocked or on the first opposing-zone square. They promote to bers (queen) on the last rank. A pawn that advances two or three squares can be captured en passant on each square it passed, immediately on the next turn. In a triple advance the two targets are both available, and either capture removes the pawn from its final square.

There is no castling. Checkmate wins and stalemate draws. Threefold repetition and 100 halfmoves without pawn movement or capture are digital draw conventions. FEN uses `h` for hia and `q` for bers; the en-passant field is a comma-separated list when two squares are available. UCI promotion suffix is `q`.

This is a documented reconstruction rather than a claim about measured popularity. The source describes optional slower bodyguards and alternative capture limits; this product follows its stated default. [Mats Winther's reconstruction](https://mats-winther.github.io/bg/hiashatar.htm) · [Wikipedia overview](https://en.wikipedia.org/wiki/Shatar#Hiashatar).
