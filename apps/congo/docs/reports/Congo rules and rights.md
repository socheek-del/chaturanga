# Select the 1982 Congo chess variant

## Selection

Use the two-player 7×7 chess variant invented by Demian Freeling in 1982. This is the Congo entry in the roadmap's Wikipedia list. Do not implement the unrelated historical *Game of the Congo*, a four-seat hex board game published in the nineteenth century.

The MindSports account identifies this as Demian Freeling's game and says it became the second most popular chess variant at the Fanaat games club at the University of Twente. That is evidence of local use, not a general popularity ranking. The roadmap has no competing Congo chess editions, so use the author's documented rules as the standard selection.

## Rules to implement

- Use a 7×7 board. Rank 4 is the river. White's castle is c1–e3 and Black's is c5–e7. White moves first.
- White starts `G M E L E C Z` on rank 1 and seven pawns on rank 2; Black starts the same arrangement in lowercase on ranks 7 and 6. The letters mean Giraffe, Monkey, Elephant, Lion, Elephant, Crocodile, Zebra.
- Win by capturing the opposing Lion. A Lion moves and captures one square in any direction only within its own 3×3 castle. It may leave its castle only to capture the other Lion along an unobstructed file or diagonal. Moving a Lion into attack is allowed; Congo has no check or checkmate.
- The Zebra moves as a chess knight. The Elephant moves one or two squares orthogonally; the two-square move jumps the intervening square. The Giraffe can jump exactly two squares in any of the eight directions and can also move one square as a king without capturing. The Crocodile moves one square as a king and, on land, slides toward the river along its file; from the river it slides along the river rank.
- The Monkey moves one square as a king without capturing. It captures by jumping an adjacent opposing piece to the empty square immediately beyond. Captures are optional. It may make a sequence of jumps in one turn, change direction, visit a square more than once and capture each piece at most once. Captured pieces remain blockers during the route and are removed after it. Capturing the Lion ends the game immediately.
- A Pawn moves and captures one square straight or diagonally forward. After it reaches the opponent's bank beyond the river, it can also retreat one or two squares straight backward without capturing or jumping. Reaching the far rank promotes it to a Superpawn. A Superpawn retains the Pawn's forward moves, adds one-square sideways moves and may retreat one or two squares straight or diagonally backward without capturing, anywhere on the board.
- Except for the Lion and Crocodile, a piece that ends a turn in the river must leave it on its next own turn or drown at the end of that turn. A Monkey's whole multi-capture route counts as one move: only its final square sets its river deadline. The Crocodile never drowns; the Lion cannot enter the river.
- If a player has no legal move, that player loses. If only the two Lions remain and neither can capture the other immediately, the game is a draw. A Lion plus any surviving piece against a bare Lion is not automatically drawn.

## Digital conventions

- Apply a threefold-repetition draw to avoid endless cycles. Repetition identity includes the board, turn and which non-Crocodile pieces are due to leave the river. This is a digital convention; the sources reviewed do not state a repetition rule.
- Do not add check, checkmate, mandatory captures, or chess's 50-move rule.
- Use a product-specific FEN: seven ranks, White pieces uppercase and Black lowercase, with `l z e g c m p s` for Lion, Zebra, Elephant, Giraffe, Crocodile, Monkey, Pawn and Superpawn. A `!` suffix marks a non-Crocodile piece in the river that must leave on its next own turn. All non-Crocodile river pieces in a live position carry this marker. Promotion is encoded as `s`/`S`.
- Encode ordinary moves as source and destination coordinates, promotions with a final `+`, and Monkey jump routes as every landing square in order. For example, `b2c3d4e5` is a Monkey route from b2 via c3 and d4 to e5. The source square is not repeated at the end.

## Rights and implementation boundary

MindSports publishes the original rules and an online implementation, and its page carries a MindSports copyright notice. No open license for that text or artwork was found. The U.S. Copyright Office says a game's idea, title and method of play are not protected by copyright, while descriptive rules text and board artwork may be protected. On that scoped basis, this project can implement the mechanics independently; it must not reuse MindSports prose, diagrams, screenshots, code or branding.

Write all rules documentation, tutorial wording, piece art, board graphics and application code from scratch. This is not a worldwide copyright or trademark clearance. The repo's product name identifies the game; use the product's own visual identity and do not imply endorsement by MindSports or the inventor.

## Sources

- [MindSports: Congo rules](https://www.mindsports.nl/index.php/the-pit/523-congo)
- [MindSports: Lion versus Lion and Zebra](https://www.mindsports.nl/index.php/the-pit/523-congo?start=1)
- [MindSports: About and authorship](https://www.mindsports.nl/index.php/about)
- [Wikipedia: Congo (chess variant)](https://en.wikipedia.org/wiki/Congo_(chess_variant))
- [Wikipedia: List of abstract strategy games — chess and chess-like games](https://en.wikipedia.org/wiki/List_of_abstract_strategy_games#Chess_and_chess-like_games)
- [U.S. Copyright Office: Games](https://www.copyright.gov/register/tx-games.html)
