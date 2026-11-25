# Gliński Hexagonal Chess rules

## Board geometry and initial setup

### Takeaway

Use Gliński’s standard 91-cell game: a regular hexagon with six cells along each side, three repeating cell colours, and 18 pieces per player. The original setup diagram has not yet been transcribed into a verified coordinate list, so the precise square-by-square array remains open.

### Cited Findings

- Pritchard describes Gliński’s board as a regular 91-cell hexagon, six cells to each side, in three colours. Each player has the ordinary chess army plus one bishop and one pawn: three bishops and nine pawns total. The chapter says the starting position is shown in its diagram. — [Pritchard and Beasley, *The Classified Encyclopedia of Chess Variants*, chapter 22 (2007)](https://www.chessvariants.com/books.dir/cecv/203212.pdf)
- The 1973 English rulebook is catalogued as Władysław Gliński’s *Rules of Hexagonal Chess with Examples of First Openings*, published in London by Hexagonal Chess Publications. — [WorldCat catalogue record](https://search.worldcat.org/title/Rules-of-hexagonal-chess-with-examples-of-first-openings/oclc/1094334)
- A historical review by the English Chess Federation identifies the 1973 book as Gliński’s official rulebook and summarizes the 91-cell, three-colour board and its three bishops per side. — [English Chess Federation, *ChessMoves*, October 2024](https://www.englishchess.org.uk/wp-content/uploads/2024/10/ChessMoves-Oct-2024.pdf)
- The detailed modern summary gives files a–l (with j omitted), a centre file of 11 cells and progressively shorter files toward the ends; this is useful for coordinate-system orientation but is not a substitute for transcribing the original diagram. — [Wikipedia, “Hexagonal chess”](https://en.wikipedia.org/wiki/Hexagonal_chess)

### Inferences

- The v1 selection should explicitly identify itself as Gliński’s 91-cell rules. McCooey is a distinct variant on a similar board, with fewer pawns and different pawn rules; do not mix its setup into this product. — [Pritchard and Beasley, chapter 22](https://www.chessvariants.com/books.dir/cecv/203212.pdf)

### Gaps

- Transcribe and independently verify every starting coordinate from Gliński’s 1973 book diagram before encoding setup. Available searchable text describes the diagram but does not provide a dependable coordinate list.
- Confirm whether the implementation’s coordinate naming and board orientation should follow the 1973 book notation or a later conventional notation.

## Piece movement, pawn rules, and special rights

### Takeaway

Pritchard’s rules account supports six-direction rook and bishop lines, their combined queen, a 12-neighbour king, and a jumping knight. Pawns move forward along the file, capture on the two forward obliques, and have a two-cell opening move; promotion is on the opponent’s back line. There is no castling. En passant is supported by later detailed rule summaries and an academic rules implementation, but needs confirmation in the original book before it is treated as an original Gliński rule.

### Cited Findings

- Rooks move on the six lines parallel to board edges; bishops move on the six lines parallel to the board’s vertices and stay on their colour; queens combine those moves; kings move one cell as a queen in up to 12 directions; knights make the characteristic two-part leap and can jump intervening pieces. — [Pritchard and Beasley, chapter 22](https://www.chessvariants.com/books.dir/cecv/203212.pdf)
- A pawn advances one cell straight forward, captures on either forward oblique (60°), and may advance two cells from its initial cell. If a pawn captures toward the centre onto another pawn’s initial cell, it retains its two-cell option because it has not effectively advanced. Pawns promote on the opponent’s back line. — [Pritchard and Beasley, chapter 22](https://www.chessvariants.com/books.dir/cecv/203212.pdf)
- Gliński’s game has no castling. — [Pritchard and Beasley, chapter 22](https://www.chessvariants.com/books.dir/cecv/203212.pdf)
- The detailed Wikipedia account describes en passant after a two-cell pawn advance. Ludii’s academic rules model also implements en passant and promotion to queen, rook, bishop, or knight. These corroborate a common modern rules implementation, but are not the 1973 primary text. — [Wikipedia, “Hexagonal chess”](https://en.wikipedia.org/wiki/Hexagonal_chess); [Ludii, “Glinski Chess”](https://ludii.games/details.php?keyword=Glinski+Chess)
- Some current rules pages say there is no initial two-cell pawn move or en passant; those claims conflict with Pritchard’s Gliński account and may describe a simplified or different ruleset. — [Moddable rules page](https://rules.moddable.games/chess/variants/glinski/); [Plyyard Hexchess rules](https://hexchess.plyyard.com/rules/)

### Inferences

- For the initial implementation specification, use Pritchard’s pawn move, capture, double-step-retention, promotion, and no-castling rules. Mark en passant provisional until the original rulebook or a reliable federation rules text confirms it.
- Do not adopt McCooey’s central-pawn or capture rules: that variant uses a different starting army and pawn system. — [Pritchard and Beasley, chapter 22](https://www.chessvariants.com/books.dir/cecv/203212.pdf)

### Gaps

- Verify en passant’s exact eligibility, capture square, and timing in Gliński’s 1973 text; later summaries agree on its existence but do not establish the primary wording reviewed here.
- Verify the exact promotion edge/file and available promotion pieces from the original diagram/rules. Pritchard identifies the opponent’s back line but the accessible text does not enumerate choices.

## Check, endings, and edition differences

### Takeaway

The distinctive, well-attested ending rule is stalemate scoring: the player delivering stalemate receives ¾ point and the stalemated player ¼ point. Modern implementations sometimes score stalemate as a draw instead. The consulted sources do not settle Gliński’s complete check, checkmate, repetition, move-count, insufficient-material, or agreement-draw rules; avoid silently importing every orthodox-chess draw rule.

### Cited Findings

- Pritchard reports that in match play a stalemate scores ¾ point for the player who delivered it and ¼ for the stalemated player. — [Pritchard and Beasley, chapter 22](https://www.chessvariants.com/books.dir/cecv/203212.pdf)
- Ludii’s model describes checkmate as a win and uses the same ¾–¼ stalemate scoring. — [Ludii, “Glinski Chess”](https://ludii.games/details.php?keyword=Glinski+Chess)
- Green Chess says it treats stalemate as a draw, explicitly distinguishing that choice from Gliński’s original ¾–¼ scoring. This is evidence of a platform convention, not evidence that the original rule changed. — [Green Chess, Gliński rules](https://www.greenchess.net/en/rules.php?v=glinski)
- The 1973 book’s catalogue record establishes that Gliński published a dedicated rules book, while the English Chess Federation’s archive review identifies it as the official rulebook; neither accessible record itself settles the other draw conditions listed above. — [WorldCat catalogue record](https://search.worldcat.org/title/Rules-of-hexagonal-chess-with-examples-of-first-openings/oclc/1094334); [English Chess Federation, *ChessMoves*, October 2024](https://www.englishchess.org.uk/wp-content/uploads/2024/10/ChessMoves-Oct-2024.pdf)

### Inferences

- Preserve the unusual ¾–¼ stalemate result in the selected ruleset unless the product explicitly chooses a separately labelled modern convention.
- Treat ordinary check/checkmate as the likely intended chess convention, but verify precise legality and all draw claims against the original rules before documenting them as Gliński-specific rules.

### Gaps

- Obtain and inspect the original rulebook text or a faithful federation transcription to confirm check/checkmate procedure, repetition and move-count draws, insufficient material, and draw by agreement.
- Resolve whether later rule editions made material changes. The historical source reports multiple editions, but this review did not compare their full text.
