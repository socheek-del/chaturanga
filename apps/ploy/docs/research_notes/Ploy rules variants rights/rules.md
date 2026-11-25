# Ploy rules and official variants

## The 1970 two-player edition: setup and rules

### Takeaway

Use the 1970 3M *Ploy: Strategic Game of Maneuver and Capture* manual as the two-player rules baseline. The manual is copyrighted 1970 by 3M; it documents the 9×9-point board, the 15-piece green and coral forces, directional movement, capture, the shield’s extra rotation, and victory by taking the Commander or all other opposing pieces. The manual’s setup diagram should be transcribed directly for an engine fixture.

### Cited Findings

- The scanned English instructions are headed “How to Play Ploy” and bear the 1970 3M copyright at the end; they say the game is for two or four players and that Green starts the two-player game. — [3M, *How to Play Ploy* (1970 manual scan)](https://spellenlab.be/media/files/7c3fa0cf9e586530107f8bfbc644cc9c6155cddd.pdf)
- The English manual’s inventory says the coral and green sets each contain one Commander, six Lances, five Probes, and three Shields. Each piece’s raised direction indicators must align with the board paths. — [3M manual](https://spellenlab.be/media/files/7c3fa0cf9e586530107f8bfbc644cc9c6155cddd.pdf)
- The board is a 9×9 arrangement of circular intersections joined by horizontal, vertical, and diagonal paths. The two-player opening is symmetric: each army uses the outer three rows on opposite sides, with the center unoccupied; the manual gives the exact piece-orientation diagram. — [3M manual](https://spellenlab.be/media/files/7c3fa0cf9e586530107f8bfbc644cc9c6155cddd.pdf)
- Players alternate motion or direction moves. A motion move moves one piece along a board path in a direction shown by one of its indicators, through empty intersections and within the range for its class: Commander 1, Lance 1–3, Probe 1–2, Shield 1. A capture lands on an opponent and removes that piece. — [3M manual](https://spellenlab.be/media/files/7c3fa0cf9e586530107f8bfbc644cc9c6155cddd.pdf)
- A direction move changes one piece’s orientation. A Shield may make a motion move and then rotate during the same turn; the other pieces make either a motion or direction move. — [3M manual](https://spellenlab.be/media/files/7c3fa0cf9e586530107f8bfbc644cc9c6155cddd.pdf)
- The stated win is to capture the opposing Commander or all opposing Lances, Probes, and Shields. In the four-player section, the manual says a player whose Commander is captured is out and the capturing player takes their pieces; if all non-Commander pieces are captured, the Commander is removed and the player is out. — [3M manual](https://spellenlab.be/media/files/7c3fa0cf9e586530107f8bfbc644cc9c6155cddd.pdf)
- Frank Thibault is identified as the designer and 1970 as the publication year by Thomas Tensi’s Ploy rules/program page; an archival catalog also lists Ploy as a 1970 3M Bookshelf Game. — [Tensi, Ploy rules/program (2012)](https://www.tensi.eu/thomas/programming/games/ploy/ploy_doc-english.html); [AGPI Archives Game Catalog](https://gamecatalog.org/game/28602)

### Inferences

- The two-player setup is the appropriate first product mode: the original manual documents it first and provides its own two-player diagram, while the four-seat games are separate variants with different setups and elimination/player-transfer rules. — [3M manual](https://spellenlab.be/media/files/7c3fa0cf9e586530107f8bfbc644cc9c6155cddd.pdf)
- If multiplayer is included, the manual establishes that four-player individual and partnership formats are authentic Ploy modes; they are not later community inventions. — [3M manual](https://spellenlab.be/media/files/7c3fa0cf9e586530107f8bfbc644cc9c6155cddd.pdf); [Tensi’s rules transcription](https://www.tensi.eu/thomas/programming/games/ploy/ploy_doc-english.html)

### Gaps

- The English manual’s extracted text does not say how many 45° increments a direction move may rotate. A later German rules scan for the reissued Ploy/Imperium says each direction move turns a piece by one 45° segment, while Tensi’s transcription allows any multiple of 45°. These may be edition-specific; verify the 1970 English leaflet itself before encoding an increment limit. — [3M English manual](https://spellenlab.be/media/files/7c3fa0cf9e586530107f8bfbc644cc9c6155cddd.pdf); [Schmidt Ploy/Imperium manual scan](https://www.spiele4us.de/wp-content/uploads/2022/10/ploy-gebraucht-g003801590.pdf); [Tensi transcription](https://www.tensi.eu/thomas/programming/games/ploy/ploy_doc-english.html)
- No tie, repetition, or no-legal-move outcome is specified in the cited English manual pages. Verify whether another page of the leaflet addresses them; otherwise pin a clearly labeled digital convention before engine work.

## Official four-player and partnership modes

### Takeaway

The 1970 manual explicitly supplies four-player individual and partnership variants. Each four-seat player has nine pieces; a four-player game proceeds clockwise from Green, and the partnership rules assign teams and describe play after elimination.

### Cited Findings

- The English manual states that each four-player or partnership set uses one Commander, two Lances, three Probes, and three Shields, and gives separate 4-player and partnership setup diagrams. — [3M manual](https://spellenlab.be/media/files/7c3fa0cf9e586530107f8bfbc644cc9c6155cddd.pdf)
- In free-for-all, Green moves first and play continues clockwise. If a Commander is captured, the player is eliminated and the captor controls the defeated player’s remaining pieces; if all non-Commander pieces have been taken, the Commander is removed and that player exits. — [3M manual](https://spellenlab.be/media/files/7c3fa0cf9e586530107f8bfbc644cc9c6155cddd.pdf)
- The partnership format pairs positions A/C and B/D. Partners use individual turns, and a player can leave the game while their partner continues to play. — [3M manual](https://spellenlab.be/media/files/7c3fa0cf9e586530107f8bfbc644cc9c6155cddd.pdf)
- Tensi’s 2012 rules page independently records two-player, four-player, and partnership modes, though its color pairing/order for the partnership setup is expressed differently from the original leaflet’s A/C and B/D seat labels. — [Tensi, Ploy rules/program](https://www.tensi.eu/thomas/programming/games/ploy/ploy_doc-english.html)

### Inferences

- Treat the original four-player and partnership modes as applicable multiplayer variants, with two-player as the default implementation target. Their setup and elimination rules require distinct tutorials and seat-aware bots if these modes ship. — [3M manual](https://spellenlab.be/media/files/7c3fa0cf9e586530107f8bfbc644cc9c6155cddd.pdf)

### Gaps

- The exact mapping between color names, the manual’s A–D seats, and the independently transcribed partnership turn order should be copied from the 1970 diagrams/text, not guessed from Tensi’s prose.

