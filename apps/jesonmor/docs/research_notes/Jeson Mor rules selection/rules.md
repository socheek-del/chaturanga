# Jeson Mor rules selection

These notes separate the ethnographic rules record from later chess-variant descriptions and digital implementations. The main historical source is Assia Popova’s 1974 article, which reports Mongolian games observed in 1963–1966 and quotes Namzildorz’s *Mongolyn Togloom*.

## Which playable edition does the evidence support?

### Takeaway

Use the 9×9-square Jesön Mor board with nine horse-shaped chess knights on each player’s home rank. The 9×9 equipment and knight pieces are supported by the ethnographic record; the exact first-rank setup and agreement on who moves first are stated in the later rules account that cites Pritchard. “Most popular” cannot be established from the available sources.

### Cited Findings

- Persée identifies Assia Popova’s article, “Analyse formelle et classification des jeux de calculs mongols,” in *Études mongoles*, vol. 5 (1974), pp. 7–60. The Ludii Portal’s entry for Jesön Mor cites Popova 1974, pp. 32–35, Fig. VI.2, and summarizes the observed game as a 9×9 board with nine horse-shaped pieces per player. [Persée article and bibliographic record](https://www.persee.fr/doc/emong_0150-3014_1974_num_5_1_909); [Ludii evidence record, quoting Popova](https://ludii.games/data.php?keyword=Mongolia).
- The quoted French passage in Ludii says “2x9” pieces and “9x9 cases”; the horses move like chess knights and may capture enemy pieces. It identifies the central square as e5. Ludii dates this evidence to 1963–1966 and labels its type “Ethnography.” [Ludii evidence record](https://ludii.games/data.php?keyword=Mongolia).
- Wikipedia describes the familiar layout as a checkered 9×9 board, with nine chess knights lined on each player’s first rank; players choose who moves first. It also notes an alternative 8×8 grid played on intersection points. Its references are David Pritchard, *The Encyclopedia of Chess Variants* (1994), p. 155, and *The Classified Encyclopedia of Chess Variants* (2007), p. 297. [Wikipedia rules and references](https://en.wikipedia.org/wiki/Jeson_Mor).

### Inferences

- For a digital board, label the 9×9 playable squares a–i and 1–9, place one side on rank 1 and the other on rank 9, and use e5 as the center. This reconciles the ethnographic board size and the later notation.
- The 8×8-grid/intersection description may be an alternate board construction, but the source does not clarify whether it provides the same 81 playable points or a different board size. It does not document a separate movement or victory rule.
- The sources do not rank variants by popularity. Selecting the 9×9-square edition is a choice of the best documented, directly playable description, rather than a popularity claim.

### Gaps

- The full 1974 article is available from Persée, but the underlying Mongolian source (*Mongolyn Togloom*) and the complete field record were not independently inspected. The Ludii summary attributes the setup image to Popova’s Fig. VI.2, but its text alone does not state “first rank.”
- No source found establishes which board drawing is more commonly used today.

## What is the center-square victory sequence?

### Takeaway

For the Pritchard/Wikipedia rules edition, treat reaching e5 as the start of a race-to-escape: the opponent gets a reply and may capture the knight there; if it survives, its owner must later move that knight off e5 to win. The exact timing of that exit needs to be fixed in the product rules. A separate modern Fairy-Stockfish implementation ends the game after the knight merely survives one reply.

### Cited Findings

- Popova’s ethnographic account says the goal is to reach the center square e5 and describes capturing horses as secondary to the race. It does not say that reaching e5 alone wins, nor does the quoted passage state a required escape move. [Ludii’s excerpt of Popova 1974, pp. 32–35, Fig. VI.2](https://ludii.games/data.php?keyword=Mongolia); [article record](https://www.persee.fr/doc/emong_0150-3014_1974_num_5_1_909).
- Wikipedia’s rules account, citing Pritchard’s 1994 and 2007 books, says a player wins by first moving a knight to e5 and then leaving e5 on a subsequent move. It explicitly permits the opponent to capture a knight on e5 and gives capturing all opposing pieces as an alternative win. [Wikipedia rules and references](https://en.wikipedia.org/wiki/Jeson_Mor).
- In a MindSports essay recounting a 2009 translation of Jeson Mor rules from iGGC, the writer characterizes the aim as reaching the middle with one of the nine horses and leaving it, while avoiding capture on that square. This independently agrees with the escape reading, though it is a retrospective account rather than the original rules document. [MindSports, “Late arrivals & final whispers”](https://www.mindsports.nl/index.php/how-i-invented-games-and-why-not/late-arrivals-a-final-whispers).
- PyChess exposes Fairy-Stockfish’s built-in Jeson Mor definition and documents `flagMove = true` as “A knight on e5 wins after surviving the opponent’s reply.” That means the engine awards the win after one reply without requiring the knight to leave e5. It also adds a threefold-repetition draw, 50-move draw, and stalemate loss. [PyChess variant definition](https://www.pychess.org/variants/jesonmor).

### Inferences

- The center is not a safe square: under the escape reading, moving onto e5 is not itself a win, and the knight may be captured before it leaves.
- A faithful digital interpretation of “then leave that square on a subsequent move” is: after the opponent has had a reply, the same knight that entered e5 must move away; award the win when it does. Whether it must leave on its owner’s very next turn is not explicit in the sources.
- The capture-all alternative is documented in the later Pritchard/Wikipedia account, but Popova’s cited field description only says elimination is secondary. Including capture-all as an end condition follows the later rules edition, not a clearly stated terminal rule in the ethnographic excerpt.

### Gaps

- The ethnographic excerpt does not document the escape sequence, while later accounts do; no original Mongolian rules text was available to resolve that development.
- The sources do not clearly say whether the same horse must leave e5, whether it must leave on its immediately following turn, or whether it may remain there through additional turns while other pieces move.
- Fairy-Stockfish’s survive-one-reply win is a materially different digital convention. It should not be silently mixed with the reach-then-leave edition.

## How do the pieces move and capture?

### Takeaway

All 18 pieces are identical knights. Each moves in the standard chess-knight L pattern, can jump over intervening pieces, and captures by landing on an opponent’s occupied square. A knight on e5 remains capturable.

### Cited Findings

- Popova’s quoted description says the horse pieces move like chess knights and may capture opposing pieces; it makes elimination secondary to racing for e5. [Ludii evidence excerpt, Popova 1974, pp. 32–35, Fig. VI.2](https://ludii.games/data.php?keyword=Mongolia).
- Wikipedia says the pieces move or capture exactly as chess knights, moving to an empty square or capturing an enemy knight, including on e5. [Wikipedia rules](https://en.wikipedia.org/wiki/Jeson_Mor).
- Ludii’s playable catalogue summary describes the movement as one orthogonal step followed by one diagonal step, jumping any intervening piece, and capture by moving onto an opponent piece. [Ludii Jesön Mor entry](https://ludii.games/details.php?keyword=Jeson+Mor).

### Inferences

- In board coordinates, a legal destination has an absolute displacement of (1,2) or (2,1) squares, provided it is on the board. Occupancy of the intermediate squares does not block the move.
- A landing on an empty square is a move; a landing on an opponent’s square removes that piece. Landing on one’s own piece is not legal, consistent with the later account’s empty-or-enemy destination rule.
- No king, check, castling, promotion, or special capture rule is evidenced for this edition.

### Gaps

- The ethnographic excerpt does not explicitly describe turn order or friendly-piece landing restrictions. Those ordinary turn-based details are supplied by the later chess-knight codification.
- The historical account calls the pieces horses and compares their movement to chess knights; exact physical piece shapes and colors are not specified beyond the quoted description.
