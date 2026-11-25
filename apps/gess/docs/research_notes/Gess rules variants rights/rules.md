# Gess rules, setup, and history

## Canonical rules and setup

### Takeaway
The best-supported baseline is the Archimedeans Puzzles and Games Ring game described by its rules author Paul Bolchover in *Eureka* 53 (1994), with the author reposting the article in 1995 and noting permission from the editor and Archimedeans. Use the 18×18 cell board, 43 black and 43 white stones, Black first, and the chess-analogue opening formation.

### Cited Findings
- Bolchover’s 1995 post identifies itself as a reproduction of “Gess the Game” from *Eureka* 53, the Archimedeans journal, and says he had the editor’s and society’s permission to post it. It attributes the game to the Puzzles and Games Ring of the Archimedeans. [Paul Bolchover, “The Rules of Gess” (1995)](https://groups.google.com/g/rec.games.abstract/c/tuSTCVg__Ss)
- The rules specify an 18-by-18 board made from the cells of a Go board, 43 identical stones of each color, alternating turns, and Black as the first player. The author’s coordinates use files b–s and ranks 2–19 because a 3×3 footprint’s center may be one cell beyond the played board. [Bolchover (1995)](https://groups.google.com/g/rec.games.abstract/c/tuSTCVg__Ss); [Scientific American, “Playing Chess on a Go Board” (Nov. 1994)](https://wkbpic.com/wkbx/SA/1994/199411.pdf)
- A piece (also called a footprint in the rules explanation) is a 3×3 region, wholly or partly intersecting the board, containing at least one stone of the player to move and no opposing stones. Its identity is just the current board pattern; regions can overlap, so the game has no persistent piece objects. [Bolchover (1995)](https://groups.google.com/g/rec.games.abstract/c/tuSTCVg__Ss); [Scientific American (1994)](https://wkbpic.com/wkbx/SA/1994/199411.pdf)
- The starting position groups each player’s 43 stones into six chess-analogue footprints across the back formation, ordered rook–bishop–queen–king/ring–bishop–rook from that player’s left to right, with six single-stone pawns in front. The contemporary article’s opening diagram and caption show the arrangement; the usual board coordinates are b–s and 2–19, with each side’s pawn row at ranks 6 or 13. [Bolchover (1995)](https://groups.google.com/g/rec.games.abstract/c/tuSTCVg__Ss); [Scientific American (1994)](https://wkbpic.com/wkbx/SA/1994/199411.pdf); [Wikipedia’s current rules summary](https://en.wikipedia.org/wiki/Gess)

### Inferences
- Treat this 1994 Archimedeans ruleset as the product’s selected standard: the surviving author-posted article is a direct reproduction of the original publication, and the contemporary *Scientific American* account independently supplies diagrams and a worked game. This is a source-quality choice, not evidence that it is more popular than every later house variant. [Bolchover (1995)](https://groups.google.com/g/rec.games.abstract/c/tuSTCVg__Ss); [Scientific American (1994)](https://wkbpic.com/wkbx/SA/1994/199411.pdf)

### Gaps
- The linked author post omits its three referenced diagrams. The *Scientific American* scan includes opening figures but its OCR is incomplete around the artwork. Before creating an exact start-position fixture, transcribe the 43-cell setup from the original/Eureka or the scan and cross-check per-side counts; do not invent a layout from prose alone. [Bolchover (1995)](https://groups.google.com/g/rec.games.abstract/c/tuSTCVg__Ss); [Scientific American (1994)](https://wkbpic.com/wkbx/SA/1994/199411.pdf)

## Movement, capture, rings, and endings

### Takeaway
Movement is by sliding any eligible 3×3 footprint along one of up to eight directions encoded by its eight outer cells. An occupied center gives unlimited range; an empty center caps range at three cells. The footprint cannot pass through other stones; at first overlap it stops and removes every overlapping obstacle, friendly or enemy. A player loses if, after a move, they have no ring; when both lose their last ring on the same move, the mover loses.

### Cited Findings
- Each occupied outer cell enables the corresponding direction; a diagonal is one-way unless the opposite diagonal outer cell is also occupied. If the center is occupied, the pattern has unlimited nominal range; if empty, at most three cells. These are aligned between Bolchover’s rules and the contemporary article. [Bolchover (1995)](https://groups.google.com/g/rec.games.abstract/c/tuSTCVg__Ss); [Scientific American (1994)](https://wkbpic.com/wkbx/SA/1994/199411.pdf)
- The moving footprint slides as a unit. It may stop voluntarily before an obstruction. If any other stone enters the footprint, movement ends at that first collision and all obstructing stones are removed, regardless of color; it cannot jump or continue past them. [Bolchover (1995)](https://groups.google.com/g/rec.games.abstract/c/tuSTCVg__Ss); [Scientific American (1994)](https://wkbpic.com/wkbx/SA/1994/199411.pdf)
- A footprint can begin or finish partly outside the board, but not wholly outside; any stones it carries beyond the playable edge are removed. A legal move must change the visible stone arrangement. [Bolchover (1995)](https://groups.google.com/g/rec.games.abstract/c/tuSTCVg__Ss); [Scientific American (1994)](https://wkbpic.com/wkbx/SA/1994/199411.pdf)
- A ring is any same-color 3×3 pattern with all eight outer cells occupied and the center empty. It is a pattern, not an individually tracked king. More than one ring may exist, and the player may lose/destroy rings through their own move if at least one remains at the end. [Bolchover (1995)](https://groups.google.com/g/rec.games.abstract/c/tuSTCVg__Ss)
- At the end of a move, if either player has no ring, that player loses. The author says the player who just moved is considered first; therefore a move that destroys both sides’ final rings is a loss for the mover. [Bolchover (1995)](https://groups.google.com/g/rec.games.abstract/c/tuSTCVg__Ss)

### Inferences
- The center-only footprint is eligible under Bolchover’s definition (one own stone, no enemy) but has no enabled direction, so it is an immobile pattern. This reading follows the author’s explicit example. Do not treat every eligible pattern as necessarily movable. [Bolchover (1995)](https://groups.google.com/g/rec.games.abstract/c/tuSTCVg__Ss)
- In engine terms, for each one-cell slide the translated 3×3 footprint can only pass when every cell it would cover outside its translated moving stones is empty. On the first colliding slide, remove all stationary stones covered by the destination footprint and stop. This is an implementation interpretation of the sources’ footprint, obstruction, and collision descriptions. [Bolchover (1995)](https://groups.google.com/g/rec.games.abstract/c/tuSTCVg__Ss); [Scientific American (1994)](https://wkbpic.com/wkbx/SA/1994/199411.pdf)
- The contemporary article describes the 3×3 all-edge/empty-center ring as the king analogue, but the actual victory condition is ring-pattern survival, not check or capture of one fixed king. [Scientific American (1994)](https://wkbpic.com/wkbx/SA/1994/199411.pdf); [Bolchover (1995)](https://groups.google.com/g/rec.games.abstract/c/tuSTCVg__Ss)

### Gaps
- Wikipedia’s uncited rule summary additionally requires a stone on at least one of the eight outer cells, while Bolchover’s author-posted rule says any footprint with at least one own stone and gives a center-only footprint as a valid but immobile example. Prefer the primary author text and retain center-only patterns as eligible; record this discrepancy in the product rules contract. [Wikipedia](https://en.wikipedia.org/wiki/Gess); [Bolchover (1995)](https://groups.google.com/g/rec.games.abstract/c/tuSTCVg__Ss)
- The original rules do not specify an adjudication when a player has no legal moves, nor a repetition/long-game draw rule; “no passing” and unchanged-board moves being illegal do not resolve that case. Decide an explicit digital convention before implementing terminal outcomes and teach it in the tutorial. [Bolchover (1995)](https://groups.google.com/g/rec.games.abstract/c/tuSTCVg__Ss)

## Edition and publication evidence

### Takeaway
The documented rules trace to the Cambridge Archimedeans and a 1994 *Eureka* article by Paul Bolchover, with a same-year popular exposition by Ian Stewart in *Scientific American*. This evidence identifies the canonical rules source but does not establish a popularity ranking among house variations.

### Cited Findings
- Bolchover’s post states the game was conceived by the Puzzles and Games Ring of the Archimedeans as a generalized form of chess and republishes his *Eureka* 53 article. [Bolchover (1995)](https://groups.google.com/g/rec.games.abstract/c/tuSTCVg__Ss)
- The November 1994 *Scientific American* feature identifies the creators as the Archimedean Society’s Puzzles and Games Ring and references the original article “Gess the Game,” Paul Bolchover, *Eureka* 53, pp. 24–27 (1994). [Scientific American issue scan (1994)](https://wkbpic.com/wkbx/SA/1994/199411.pdf)
- The author-posted rules describe a single 18×18, 43-stone-per-side game. The accessible primary rules source does not identify formal editions, tournament rules, or an alternate standard. [Bolchover (1995)](https://groups.google.com/g/rec.games.abstract/c/tuSTCVg__Ss)

### Inferences
- Select the Archimedeans/Bolchover rules as the best-documented standard variant because they are attributed to the originating group and published with permission by the author. There is no source here proving this is the most played variant, and no need to claim it is. [Bolchover (1995)](https://groups.google.com/g/rec.games.abstract/c/tuSTCVg__Ss)

### Gaps
- I did not access the physical *Eureka* issue itself or locate a current official rules page maintained by the Archimedeans; the author’s authorized reproduction and contemporary magazine account are the available rule sources. [Bolchover (1995)](https://groups.google.com/g/rec.games.abstract/c/tuSTCVg__Ss); [Scientific American (1994)](https://wkbpic.com/wkbx/SA/1994/199411.pdf)
- No comparative play, tournament, or adoption data were found in this rules-focused research that would establish a popularity winner. That question belongs to the separate variants/popularity investigation.
