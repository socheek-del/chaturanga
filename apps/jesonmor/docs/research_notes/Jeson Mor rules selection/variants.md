# Variants and popularity evidence

## Are there multiple Jeson Mor editions, and is one shown to be most popular?

### Takeaway

The sources converge on one traditional Jeson Mor ruleset: two players, nine chess-knight movers each, a 9×9 checkerboard, a central-square race, and elimination as an alternate win. I found no evidence ranking rival Jeson Mor editions by popularity; the available sources describe one game, with an alternate way to draw the board rather than a separate rules variant.

### Cited Findings

- Wikipedia describes one game and cites David Pritchard's 1994 *The Encyclopedia of Chess Variants* and 2007 *The Classified Encyclopedia of Chess Variants*. It describes the standard 9×9 checkerboard and notes an alternative 8×8 grid with pieces on intersections. — [Jeson Mor](https://en.wikipedia.org/wiki/Jeson_Mor)
- Assia Popova's 1974 ethnographic classification reports Jesön Mor as a 9×9 board game with nine horse figures per player; the horses move like chess knights, can capture, and race toward the center. Ludii's research record identifies the cited pages as Popova 1974, pp. 32–35, Fig. VI.2, and says Popova quotes Namzildorzh's *Mongolyn Togloom*. — [Popova, 1974, Persée](https://www.persee.fr/doc/emong_0150-3014_1974_num_5_1_909); [Ludii evidence record](https://ludii.games/data.php?keyword=Mongolia)
- The National Institute of Informatics catalogue identifies *Mongolyn (khölögт) togloom* as a Mongolian-language work by N. Namzhildorzh and O. Namnandorzh, published in Ulaanbaatar in 1963–1966 and held by three Japanese university libraries. — [CiNii bibliographic record](https://ci.nii.ac.jp/ncid/BA56669330?l=en)
- BoardGameGeek's rules summary and several recent implementations describe the same 9×9/nine-knight/central-square/elimination rules, rather than naming a competing standard edition. — [BoardGameGeek rules wiki](https://boardgamegeek.com/wiki/page/thing%3A37917); [Fairy-Stockfish's variant list](https://fairy-stockfish.github.io/variants/); [PyChess Jeson Mor definition](https://www.pychess.org/variants/jesonmor)

### Inferences

- The 8×8-intersection-board presentation is a geometric encoding of the same 9×9 playable positions, not evidence of a distinct edition: both descriptions preserve nine locations per axis and the same central position. — [Wikipedia](https://en.wikipedia.org/wiki/Jeson_Mor); [Popova, 1974](https://www.persee.fr/doc/emong_0150-3014_1974_num_5_1_909)
- Since the roadmap lists one documented Mongolian knight game and the consulted references converge on it, use the traditional 9×9 checkerboard form as the product default. Do not claim it is measurably the most popular edition.

### Gaps

- No comparative adoption, tournament, sales, or survey data was found that would support a “most popular variant” ranking.
- I could not access the full text of Namzhildorzh and Namnandorzh's Mongolian-language source directly. Popova's published ethnographic account and the later Pritchard references provide the accessible rule evidence.

## What core edition does the source record support?

### Takeaway

The documented form starts nine knights on each player's first rank, allows standard knight moves and captures, and wins either by entering e5 and later leaving it or by capturing every opposing piece. The center occupant is capturable; merely reaching e5 is not an immediate win.

### Cited Findings

- Wikipedia states that each side has nine chess knights on its first rank; knights move/capture as in chess; the central knight may be captured; and a player wins by reaching e5 then leaving it, or by capturing all opposing pieces. It also says players choose colors and who moves first. — [Jeson Mor](https://en.wikipedia.org/wiki/Jeson_Mor)
- BoardGameGeek independently summarizes the central-square-then-leave condition and total-capture alternative. — [BoardGameGeek rules wiki](https://boardgamegeek.com/wiki/page/thing%3A37917)
- The research entry for Popova's 1974 account says the race is the principal aim and capture is secondary; that record cites Popova's description based on Namzildorzh's *Mongolyn Togloom*. — [Ludii evidence record](https://ludii.games/data.php?keyword=Mongolia)
- Fairy-Stockfish's official variant documentation encodes a 9×9 board, only knights, the e5 goal square, no pawn or king pieces, and a `flagMove` condition with the comment that an e5 knight wins after surviving the opponent's reply. It also configures threefold repetition, a 50-move limit, and stalemate as a loss. — [Fairy-Stockfish variants](https://fairy-stockfish.github.io/variants/); [PyChess generated Jeson Mor rules](https://www.pychess.org/variants/jesonmor)

### Inferences

- The center condition should be modeled as a pending win: on reaching e5, the opponent receives a turn and may capture that knight; if the original player still has a knight on e5 when their next turn begins, the center win is secured. This matches “reach then leave” and Fairy-Stockfish's `flagMove` implementation. — [Wikipedia](https://en.wikipedia.org/wiki/Jeson_Mor); [Fairy-Stockfish](https://fairy-stockfish.github.io/variants/)
- Repetition and 50-move adjudication appear in Fairy-Stockfish's implementation, but the ethnographic record and the cited encyclopedia summaries do not establish them as traditional Jeson Mor rules. Treat any digital draw rule as an explicit product convention rather than inherited folklore. — [Ludii evidence record](https://ludii.games/data.php?keyword=Mongolia); [Fairy-Stockfish](https://fairy-stockfish.github.io/variants/)

### Gaps

- The historical accounts available here do not settle whether traditional play prescribed a first color/first player; the modern Wikipedia rule summary leaves that choice to players.
- The primary 1960s source could clarify whether there were local conventions beyond the accessible summary, but its full text was not available in the consulted sources.
