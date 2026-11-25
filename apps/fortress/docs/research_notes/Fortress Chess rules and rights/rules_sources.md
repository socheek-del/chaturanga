# Fortress Chess rules and source findings

Retrieved 2026-11-25. This note separates Petrov's historical rules from later summaries and digital reconstructions. The original 1850 and 1862 rule texts were not directly readable during this research run; the primary references are identified below and the reconstruction is checked against Georgi Markov's specialist study.

## Which Fortress Chess is listed, and which sources can establish its rules?

### Takeaway

The list points to Russian four-player Fortress Chess, also called Russian Four-Handed Chess, as described by Alexander Petrov. The best documented edition is Petrov's 1850 rules, checked against his near-identical 1862 Russian article. This identifies the variant; it does not establish that it was the most popular edition.

### Cited Findings

- The source list names “Fortress chess (Russia) (~18th century)” and links it to the article about Russian Fortress Chess. That article identifies a four-player game played in Russia in the eighteenth and nineteenth centuries, also known as Russian Four-Handed Chess. — [Wikipedia: List of abstract strategy games, “Chess and chess-like games”](https://en.wikipedia.org/wiki/List_of_abstract_strategy_games#Chess_and_chess-like_games); [Wikipedia: Fortress chess](https://en.wikipedia.org/wiki/Fortress_chess)
- The two firsthand rule publications to consult are Alexander Petrov, “Das Vierschach mit Festungen,” *Schachzeitung* 5 (November 1850), pp. 377–384, and his nearly identical Russian “Краткое описание четверной игры с крепостями,” *Шахматный листок* no. 44 (August 1862), pp. 181–187. Markov identifies these as the only detailed, reliable descriptions by an author with firsthand experience; Butrimov's earlier 1821 account is too brief to reconstruct all play. — [Petroff 1850, Google Books page 377](https://books.google.de/books?hl=de&id=x61AAAAAcAAJ&pg=PA377); [Petrov 1862 bibliographic reference](https://ru.wikipedia.org/wiki/%D0%A0%D1%83%D1%81%D1%81%D0%BA%D0%B8%D0%B5_%D1%87%D0%B5%D1%82%D0%B2%D0%B5%D1%80%D0%BD%D1%8B%D0%B5_%D1%88%D0%B0%D1%85%D0%BC%D0%B0%D1%82%D1%8B_%D1%81_%D0%BA%D1%80%D0%B5%D0%BF%D0%BE%D1%81%D1%82%D1%8F%D0%BC%D0%B8); [Markov, “Russian four-handed chess: myths and misconceptions,” *Board Game Studies Journal* 9 (2015), pp. 41–49](https://bgsj.ludus-opuscula.org/PDF_Files/41_49_Markov_web.pdf); [accessible full-text copy of Markov's article](https://www.academia.edu/82329604/The_role_of_the_dice_in_board_games_history)
- A contemporary 1853 chess manual says Petrov's variant adds sixteen corner squares with reserve pieces for each player and directs readers to Petrov's 1850 *Schachzeitung* rules for details. — [*Lehrbuch des Schachspiels*, TextGrid Repository](https://www.textgridrep.org/browse/4bj4w.0)
- Markov says a supposed split between “Russian” and “Western European” Fortress Chess is a later conflation: the source for the western form describes general four-handed chess without fortresses. Generic European four-player chess, therefore, is not the ruleset meant by this list entry. — [Markov (2015)](https://bgsj.ludus-opuscula.org/PDF_Files/41_49_Markov_web.pdf)

### Inferences

- Use the name “Russian Four-Handed Fortress Chess (Petrov description)” in plans and user-facing materials to disambiguate it from generic four-player chess, the conventional chess endgame term “fortress,” and Markov's separate two-player Fortress Chess adaptations.
- Petrov is the source-quality default because it is the detailed firsthand rules account; the sources do not show that it was the most popular historical or present-day edition.

### Gaps

- The linked Google Books scan of the 1850 source failed to load in this research run, and the publisher-hosted Markov PDF returned a gateway error. Markov's full searchable article text was available through the linked author-uploaded copy. A contemporary 1853 manual independently directs readers to Petrov's 1850 rules.
- The 1862 Russian issue has been identified bibliographically, but a directly readable scan was not located. The Ludii Portal's current reconstruction gives a detailed board, wall, setup and movement summary citing Markov and Petrov. The product therefore uses Petrov's documented rules with explicit digital choices for unresolved cases; obtaining the primary scan remains desirable but does not block implementation.

## What are the board, starting array, moves, and fortress restrictions?

### Takeaway

The historical game has 192 playable squares, four corner forts, four players in two opposite-seat teams, and a normal chess army plus a free-positioned rook, bishop, and knight in each player's fort. Normal chess movement applies with walls and fortress gates changing legal paths; the knight must be modelled as one orthogonal step plus one diagonal step in either order.

### Cited Findings

- Markov describes the board as 192 squares: a 128-square four-handed board made from the ordinary 8×8 field plus four 2×8 side strips, with four 4×4 corner fortresses. A modern Ludii rules reconstruction describes the same total as a 12×12 core plus four 4×4 extensions overlapping the 2×2 corner patches. These are consistent cell counts and board descriptions; the Ludii entry is a reconstruction, not a primary historical source. — [Markov (2015), pp. 42–44](https://bgsj.ludus-opuscula.org/PDF_Files/41_49_Markov_web.pdf); [Ludii Portal: Russian Fortress Chess](https://ludii.games/details.php?keyword=Russian+Fortress+Chess)
- Four people play in two teams, with partners sitting opposite one another; turns proceed clockwise. Each player has the usual chess complement plus one extra rook, bishop, and knight in the fortress on that player's right. Petrov's reserve-piece locations are free/random placements rather than a fixed historical mini-array; Markov explicitly rejects a later fixed arrangement attributed to Machatscheck. — [Markov (2015), pp. 42–44](https://bgsj.ludus-opuscula.org/PDF_Files/41_49_Markov_web.pdf); [Russisches Festungsschach, German Wikipedia](https://de.wikipedia.org/wiki/Russisches_Festungsschach)
- The ordinary array is the regular chess complement on each player's two deployment ranks, with the king to the player's right of the queen. The additional reserve pieces start in that player's own fortress. The modern Ludii reconstruction says the king occupies the player's right-hand side of the central deployment rank and the extra pieces may be placed anywhere in the right fortress. — [Markov (2015), p. 42](https://bgsj.ludus-opuscula.org/PDF_Files/41_49_Markov_web.pdf); [Ludii Portal: Russian Fortress Chess](https://ludii.games/details.php?keyword=Russian+Fortress+Chess)
- Pieces move and capture as in FIDE chess, except fortress walls are impassable and the knight's route is one orthogonal and one diagonal step in either order (not an L-shaped jump). This distinction matters around walls; the knight still jumps intervening pieces as a chess knight does, but a wall cannot be crossed. — [Markov (2015), pp. 42–43](https://bgsj.ludus-opuscula.org/PDF_Files/41_49_Markov_web.pdf); [Ludii Portal: Russian Fortress Chess](https://ludii.games/details.php?keyword=Russian+Fortress+Chess)
- A fortress is reached or left through its gate; moves, captures, and check lines cannot cross walls or cut around their ends. The contemporary German summary describes the gate as the two rightmost squares of the relevant deployment rows. Markov describes the wall as a simple raised line, not the elaborate battlement structure added in some later illustrations. — [Russisches Festungsschach, German Wikipedia](https://de.wikipedia.org/wiki/Russisches_Festungsschach); [Markov (2015), pp. 42–43](https://bgsj.ludus-opuscula.org/PDF_Files/41_49_Markov_web.pdf)
- Pawns advance one square forward, capture one square diagonally forward, and may advance two squares on their first move. Allied pieces do not capture one another; allied pieces and pawns block movement, and Petrov's rule says allied pawns meeting on a file block one another. — [Markov (2015), pp. 42–44](https://bgsj.ludus-opuscula.org/PDF_Files/41_49_Markov_web.pdf); [Ludii Portal: Russian Fortress Chess](https://ludii.games/details.php?keyword=Russian+Fortress+Chess)

### Inferences

- A cell-set representation can use the 12×12 central footprint with each 4×4 fortress sharing a 2×2 patch at one corner: this gives 128 non-fortress cells plus 64 fortress cells, 192 total. The exact geometric shape should still be checked against Petrov's diagram before implementation, especially gate squares and diagonals around wall ends.
- The extra pieces belong to a player's own fortress at setup, but after setup should move like ordinary pieces subject to the same wall and gate geometry.
- “Randomly placed” in Markov and “placed anywhere they please” in Ludii/German summaries imply that the extra pieces do not have a fixed array. If players choose placements, preserve them as a setup phase rather than baking a single position into the start state.

### Gaps

- The accessible secondary sources differ in wording about whether reserve pieces are selected freely by the player or assigned at random. Both rule out the fixed arrangement shown in later artwork; the primary sentence should decide which setup mode is faithful.
- Markov pins clockwise play but does not name the starting seat in the accessible discussion. Later summaries differ on named turn order: the German page says White begins, while the Russian page lists White–Black–Red–Blue. Check Petrov's original text and diagram before assigning colors or a first seat. — [Markov (2015)](https://bgsj.ludus-opuscula.org/PDF_Files/41_49_Markov_web.pdf); [German summary](https://de.wikipedia.org/wiki/Russisches_Festungsschach); [Russian summary](https://ru.wikipedia.org/wiki/%D0%A0%D1%83%D1%81%D1%81%D0%BA%D0%B8%D0%B5_%D1%87%D0%B5%D1%82%D0%B2%D0%B5%D1%80%D0%BD%D1%8B%D0%B5_%D1%88%D0%B0%D1%85%D0%BC%D0%B0%D1%82%D1%8B_%D1%81_%D0%BA%D1%80%D0%B5%D0%BF%D0%BE%D1%81%D1%82%D1%8F%D0%BC%D0%B8)
- Markov gives concrete gate routes and forbidden diagonal examples at fortress walls, and Ludii gives the relative placement of the two wall segments beside every fortress. The 16×16 coordinate envelope maps the public 192-cell board footprint into the repository's square-grid API. The engine must turn the relative wall layout into explicit blocked edges and make the examples executable fixtures.
- The accessible sources do not pin down every FIDE-derived special rule in this variant (for example, en passant), nor all castling restrictions where a king's route interacts with a wall. Markov refers to castling, especially castling toward the fort, but the original text must be checked for the complete conditions.

## How do promotion, checkmate, and game endings work?

### Takeaway

A team wins by checkmating both opponents. In the Russian rules, a checkmated player's king and all pieces are immediately removed; the player cannot return. Stalemate and pawn promotion inside a fortress are not fully settled by the surviving firsthand descriptions as interpreted by Markov.

### Cited Findings

- The objective is to checkmate both opponents. A checkmated player is eliminated and that player's pieces are removed from the board. Markov contrasts this with the distinct general “German” four-handed game, in which a mated player's pieces remain immobile and can become active again if the mate is lifted. — [Markov (2015), pp. 43–44](https://bgsj.ludus-opuscula.org/PDF_Files/41_49_Markov_web.pdf); [Ludii Portal: Russian Fortress Chess](https://ludii.games/details.php?keyword=Russian+Fortress+Chess)
- A pawn promotes to any piece when it reaches the home rank of either an opponent or the allied player. Markov notes Petrov does not explicitly settle promotion by a pawn that has entered a fortress, and suggests the literal reading would allow promotion only on the ordinary home ranks outside the forts. — [Markov (2015), p. 44](https://bgsj.ludus-opuscula.org/PDF_Files/41_49_Markov_web.pdf); [Russisches Festungsschach, German Wikipedia](https://de.wikipedia.org/wiki/Russisches_Festungsschach)
- If the remaining solitary opponent is stalemated, Markov regards a draw as obvious. If a player is stalemated while their partner remains in play, Markov says the historical rule is unknown: that player might pass, as in some four-player forms, or the game might immediately be drawn; Markov prefers the immediate-draw interpretation as more consistent with the game's logic. — [Markov (2015), p. 44](https://bgsj.ludus-opuscula.org/PDF_Files/41_49_Markov_web.pdf)
- Petrov's remarks about castling to a fortress and the risk of long castling show that castling exists in the described game; they do not by themselves pin down every castling condition on the irregular board. — [Markov (2015), p. 45](https://bgsj.ludus-opuscula.org/PDF_Files/41_49_Markov_web.pdf)

### Inferences

- Implement team victory only after both opposing players are checkmated, while removing each mated seat's pieces immediately. Do not use a rule where pieces remain frozen on the board or the player can be reactivated; that belongs to a different four-handed tradition.
- If an implementation must choose a stalemate rule before the original text is recovered, the most source-transparent provisional rule is Markov's preferred immediate draw when a player is stalemated while the partner remains active; flag that as an editorial decision in the tutorial and rules documentation.
- Treat promotion on ordinary opponent and ally home ranks as established. Keep promotion inside the fortresses out of scope or explicitly choose and document a house interpretation until Petrov's original wording is checked.

### Gaps

- The source does not settle what happens when one teammate is stalemated while the other can still move; this is an explicit historical uncertainty, not a simple source conflict.
- Promotion on fortress squares is unclear, including a pawn that reaches an outer rank through a capture in a fortress.
- Full checkmate, stalemate, bare-king, repetition, and draw-by-agreement details need comparison to Petrov's original pages before declaring the digital product a complete transcription.
