# Rollerball Chess Variant Rules

## What is the board and initial arrangement?

### Takeaway

The listed game is Jean-Louis Cazaux's Rollerball chess, not other games called Rollerball. It uses a 7×7 grid with the central 3×3 squares removed, creating a 40-square board with outer and inner rings. The complete starting array is transcribed from the creator's Chess Variant Pages (CVP) rules diagram by a later rules reference; the CVP page itself did not load in this research session.

### Cited Findings

- The board is files a–g and ranks 1–7, with c3–e5 removed: 24 perimeter squares on the outer ring and 16 squares on the inner ring. The board has south, north, west and east zones. — [Rules transcription citing Cazaux's CVP page](https://rules.moddable.games/chess/variants/rollerball/); [French full-rules PDF](https://www.zpag.net/Jeux/Echec/Rollerball_Fr.pdf)
- White moves first. Each side has one King, one Bishop, two Rooks and two Pawns. — [Cazaux rules transcription](https://rules.moddable.games/chess/variants/rollerball/); [French full-rules PDF](https://www.zpag.net/Jeux/Echec/Rollerball_Fr.pdf)
- The CVP diagram transcription gives White: c1 Pawn, d1 Bishop, e1 Rook, c2 Pawn, d2 King, e2 Rook; Black: c7 Rook, d7 Bishop, e7 Pawn, c6 Rook, d6 King, e6 Pawn. The arrays are 180° rotationally symmetric. — [Starting-position transcription](https://rules.moddable.games/chess/variants/rollerball/)
- Both initial Bishops are on light squares; dark-square Bishops can enter only by promotion. — [French full-rules PDF](https://www.zpag.net/Jeux/Echec/Rollerball_Fr.pdf)
- The game's date is inconsistent across references: the French rules and Wikipedia's cited summary say 1998, while the Moddable transcription says 1999. The exact creation date is not needed to identify the ruleset. — [French full-rules PDF](https://www.zpag.net/Jeux/Echec/Rollerball_Fr.pdf); [Wikipedia article citing Pritchard (2007)](https://en.wikipedia.org/wiki/Rollerball_(chess_variant)); [Moddable transcription](https://rules.moddable.games/chess/variants/rollerball/)

### Inferences

- The coordinate list is reliable enough to create a candidate fixture, but should be visually checked against the original CVP diagram before encoding because the original page was inaccessible and the transcription is derivative.

### Gaps

- The creator's primary page is [CVP's Rollerball rules page](https://www.chessvariants.com/40.dir/rollerball/index.html), but it could not be fetched with the available web tool. The diagram should be independently verified before coding.

## How do pieces move and capture on the two rings?

### Takeaway

Play is mostly clockwise, with each ring determining the orthogonal forward direction for Rooks and Pawns. Rooks and Bishops can make one 90° rebound along specified edges; the King moves conventionally, while the Pawn has no initial double-step. Captures use ordinary displacement.

### Cited Findings

- In general, forward is clockwise and backward is counter-clockwise. The ring a Rook or Pawn occupies determines its orthogonal forward direction; for a Rook it also determines orthogonal backward. A Rook's orthogonal move immediately off its ring is called a sideways move. — [French full-rules PDF](https://www.zpag.net/Jeux/Echec/Rollerball_Fr.pdf)
- The King moves one square in any direction, may not move into check, and has no castling move. — [French full-rules PDF](https://www.zpag.net/Jeux/Echec/Rollerball_Fr.pdf)
- A Rook slides any distance orthogonally forward on its ring or sideways; it can move one orthogonal step backward on its ring. On the external ring only, it may rebound once at a corner and continue its forward route 90°. — [French full-rules PDF](https://www.zpag.net/Jeux/Echec/Rollerball_Fr.pdf); [Cazaux rules transcription](https://rules.moddable.games/chess/variants/rollerball/)
- A Bishop slides any distance diagonally forward and may move one diagonal step backward. It can rebound once at an inner or outer board edge, changing direction by 90° while continuing forward. — [French full-rules PDF](https://www.zpag.net/Jeux/Echec/Rollerball_Fr.pdf); [Cazaux rules transcription](https://rules.moddable.games/chess/variants/rollerball/)
- A Pawn advances or captures one step orthogonally forward on its current ring, or one diagonal step forward toward either ring. Pawns do not move backward or sideways and have no initial two-square move. A Pawn promotes to Rook or Bishop upon reaching either opposing Pawn's starting square. — [French full-rules PDF](https://www.zpag.net/Jeux/Echec/Rollerball_Fr.pdf)
- The published rule descriptions say pieces capture as their chess counterparts, by displacement; the forward/backward and rebound limits above are the stated exceptions. — [French full-rules PDF](https://www.zpag.net/Jeux/Echec/Rollerball_Fr.pdf); [Cazaux rules transcription](https://rules.moddable.games/chess/variants/rollerball/)

### Inferences

- No en-passant case is needed if the selected rules prohibit a two-square Pawn move. The sources reviewed do not separately discuss en passant.
- Edge rebounds are movement path rules, not persistent facing/orientation state: the cited descriptions derive forward direction from the piece's current location/ring.

### Gaps

- The original diagram and move examples should be checked to validate rebound geometry at every corner/bend and to ensure the coordinate convention used by the transcription matches the creator's page.
- Sources describe the path turns but do not give a formal topology/graph specification. The engine should derive adjacency from the 40 playable squares and test the pictured rebound routes.

## How does the game end?

### Takeaway

Rollerball has two wins: checkmate, or a King-race win by reaching the opponent King's starting square after travelling clockwise. Stalemate and threefold repetition are draws; the meaning of the King-race travel condition needs a precise digital ruling if the primary page does not clarify it.

### Cited Findings

- The player wins by checkmating the opposing King, or by bringing their King to the opponent King's original starting square, provided it has travelled clockwise to get there. — [Cazaux rules transcription](https://rules.moddable.games/chess/variants/rollerball/); [French full-rules PDF](https://www.zpag.net/Jeux/Echec/Rollerball_Fr.pdf)
- Stalemate and threefold repetition are draws. — [French full-rules PDF](https://www.zpag.net/Jeux/Echec/Rollerball_Fr.pdf); [Cazaux rules transcription](https://rules.moddable.games/chess/variants/rollerball/)
- The rules state that the King may not move to a square where it can be captured. — [French full-rules PDF](https://www.zpag.net/Jeux/Echec/Rollerball_Fr.pdf)

### Inferences

- The King-race condition requires the move history, or a sufficient directional/path state, because the same destination square is not an unconditional win: the route must have been clockwise.
- Other standard-chess draw rules (for example, move-count or insufficient-material draws) should not be added without source evidence.

### Gaps

- The phrase “travelled clockwise” is not formalized in the accessible copies. Confirm whether it means the King must approach the goal from the clockwise side, complete a full circuit, or satisfy another path condition.
- The sources reviewed do not define a move-count draw, insufficient-material draw, or agreement convention. These should remain omitted unless the creator's rules page specifies them.
