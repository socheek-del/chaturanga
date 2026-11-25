# Select the standard online Crazyhouse rules

## Selection

The roadmap names Crazyhouse as a two-player drop-chess product. The Wikipedia chess-like list and its Crazyhouse article describe one mainstream game: standard chess with captured pieces returning to play from the capturer's pocket. Historical sources mention earlier related ideas, but the target list does not present competing Crazyhouse editions. Select the standard online rules documented by Free Internet Chess Server (FICS) and Lichess; use the Lichess conventions for standard chess draw rules and the pawn's initial double step after a drop. This is the familiar Crazyhouse played on current chess servers, rather than a hybrid such as Coffeehouse or Shogun.

An academic 2020 review describes Crazyhouse as a two-player chess variant that has primarily grown through online servers and identifies Lichess as a major place where it is played. The sources do not provide a complete comparative popularity ranking, so this choice is the established standard edition rather than a claim that it is measurably the single most popular rule interpretation.

## Rules to implement

- Start from the orthodox chess array with empty pockets. Use ordinary chess movement, checks, castling, en passant, promotion and legal-move constraints.
- On capture, the captured piece changes color and enters the capturer's pocket. A captured king is never a legal move target.
- A player may spend their turn either moving a board piece or dropping one held non-king piece onto an empty square. Drops can give check or immediate checkmate and can interpose against a line check.
- A pawn cannot be dropped on rank one or rank eight. Same-file pawns are allowed. A dropped pawn on its second rank may make the ordinary two-square advance; one dropped elsewhere has no such initial privilege.
- When a promoted piece is captured, its pocket form is a pawn.
- Checkmate wins and stalemate draws. Fairy-Stockfish's `crazyhouse` preset does not automatically adjudicate insufficient material, even for king versus king or a lone minor; follow that behavior. Threefold repetition and the 50-move rule apply to the augmented position. Repetition identity must include board placement, side to move, castling and en-passant rights, promoted-pawn provenance, and both pockets.
- Use Crazyhouse FEN with a bracketed pocket after the board and `~` to retain promoted-pawn provenance. FEN dialects differ across servers; document this as the product's serialization choice, not a universal standard.

FICS's 2008 help text describes a repetition counter that restarts on pawn moves, captures and drops. Modern Lichess documents that all standard chess conventions apply. Follow the latter's position-based repetition semantics so the pocket inventory and board state determine repetition; do not copy a server-specific counter shortcut.

Direct probes of the installed Fairy-Stockfish 0.7.10 `crazyhouse` preset confirm the starting FEN uses `[]`, captures serialize into the pocket, pawn drops use `P@square` UCI/SAN, and dropped-pawn double-step support depends on the dropped pawn occupying its own starting rank. Positions at a 100-ply halfmove clock are adjudicated drawn; king versus king, king plus a lone minor versus bare king, and a lone minor in hand are not automatically ended for insufficient material. Keep these oracle observations in the package fixtures.

## Rights and implementation boundary

The reviewed materials identify no exclusive publisher or permission requirement for the standard Crazyhouse rules. The U.S. Copyright Office says a game's idea, title and method of play are not protected by copyright, while original rule text and game artwork can be protected expression. This is a scoped U.S. copyright reference, not worldwide trademark or legal clearance.

Write the rules contract, tutorial, interface, artwork and code independently. Do not reuse FICS or Lichess prose, logos, screenshots, piece art, or frontend code. Fairy-Stockfish is an available open-source rules oracle and its license is compatible with this repository's GPL-3.0 project; use it for conformance tests only, not copied implementation. Review the selected dependency and license again when wiring the engine.

## Sources

- [Wikipedia: List of abstract strategy games — chess and chess-like games](https://en.wikipedia.org/wiki/List_of_abstract_strategy_games#Chess_and_chess-like_games)
- [Wikipedia: Crazyhouse](https://en.wikipedia.org/wiki/Crazyhouse)
- [Free Internet Chess Server: Crazyhouse help](https://www.freechess.org/Help/HelpFiles/crazyhouse.html)
- [Lichess: Crazyhouse rules](https://lichess.org/variant/crazyhouse)
- [Czech et al., “Learning to Play the Chess Variant Crazyhouse Above World Champion Level”](https://www.frontiersin.org/journals/artificial-intelligence/articles/10.3389/frai.2020.00024/full)
- [U.S. Copyright Office: Games](https://www.copyright.gov/register/tx-games.html)
- [Fairy-Stockfish variants](https://fairy-stockfish.github.io/variants/)
