# Original Suffragetto rules

## Edition, board, and setup

### Takeaway

Use the WSPU's original two-player, second-edition rulesheet (the surviving copy is catalogued as c.1909) and its marked board. It is a 17×17 square-grid game with 21 pieces per side, including five enlarged leaders/inspectors; the chosen first player is decided by a coin toss. The board and surviving edition are well documented, but the prose rules do not themselves state the grid dimensions.

### Cited Findings

- Oxford's Bodleian Libraries identifies the surviving Suffragetto as WSPU-produced, dates it 1907–1908, identifies the John Johnson Collection/Ballam Collection record, and calls it a second edition. Oxford says this is the only known complete copy, with rules, pieces, and board. [Oxford exhibition catalogue](https://www.glam.ox.ac.uk/files/shout-out-women)
- The gamesboard archival catalogue records Sargeant Bros., c.1909, and a complete box with 5 leaders plus 16 rank-and-file pieces for each faction and a second-edition rules sheet; it says the leaflet bears a 1909 stamp. [Gamesboard / Bodleian object record and photos](https://www.gamesboard.org.uk/cgi-pub/gardpub.cgi?command=view&pk=13815&table=examples)
- A transcription of the original second-edition rules says the game is for two players with 21 pieces each (five large and sixteen small), suffragette green and police dark blue, and uses a coin toss to choose who starts. Large pieces are party Leaders and Police Inspectors. [Original rules transcription](https://www.scribd.com/document/486464154/Suffragetto-Rules); compare the provenance statement on the [reprinted rules sheet](https://www.zpag.net/Jeux/Suffragetto-Rules-3.pdf).
- In the original setup, suffragettes occupy board cells marked S near Albert Hall and police occupy cells marked P near the House of Commons. For each side, one large piece goes in the middle of the front row; the other four go at the ends of the front and second rows. The archival photos show the marked board and setup. [Original rules transcription](https://www.scribd.com/document/486464154/Suffragetto-Rules), [Gamesboard photos](https://www.gamesboard.org.uk/cgi-pub/gardpub.cgi?command=view&pk=13815&table=examples)
- The original rules refer to the marked cells and named zones rather than specifying board dimensions in the prose transcription. A description of the surviving layout counts 17×17 cells, with a 9×17 central Arena, six-cell House of Commons and Albert Hall goal buildings, and separate Prison/Hospital zones of 21 cells plus six-cell Yard/Grounds. [German Wikipedia rules summary](https://de.wikipedia.org/wiki/Suffragetto); the Vassal module's board view is also labelled 1–17 on both axes. [Vassal Suffragetto module](https://vassalengine.org/library/projects/Suffragetto)
- The Oxford item description says the game dramatizes suffragettes trying to reach Albert Hall and the House of Commons while avoiding prison and hospital, with police trying to stop them. [Oxford exhibition catalogue](https://www.glam.ox.ac.uk/files/shout-out-women)

### Inferences

- Treat the source-backed 17×17 board and the original board's S/P/zone markings as the canonical geometry. Derive coordinates and legal-cell masks from a clean original-board reconstruction; do not derive them from text alone.
- The front row is the row nearest that faction's goal/building, as shown by the board setup, but the prose alone does not define "front" without the diagram.
- The WSPU's surviving second edition is the best-evidenced playable edition; sources provide no sales/popularity data establishing a most-played historical variant.

### Gaps

- The accessible rules text is a transcription of the archival sheet, not a downloadable high-resolution Bodleian master scan. Consult the archival board/rules photos when resolving any cell-level setup not made explicit by the S/P markers.
- No source located gives reliable sales figures or a ranking of variants.

## Turns, movement, hopping, and restricted zones

### Takeaway

Players alternate one piece per turn. Ordinary movement is one empty adjacent square in any of the eight directions. A hop jumps over exactly one occupied adjacent square into the empty square immediately beyond; a move may chain multiple hops. The original rules allow hopping over friendly or enemy pieces, but a hop over an opponent counts as a capture only under the Arena and rank-specific restrictions.

### Cited Findings

- The original transcription defines an adjacent-square move in any direction if the destination is unoccupied. [Original rules transcription](https://www.scribd.com/document/486464154/Suffragetto-Rules)
- It describes hopping over one or more pieces into empty squares immediately beyond them, one piece per hop, and permits jumps laterally or diagonally and in any direction. The original text says pieces of either faction may be hopped. [Original rules transcription](https://www.scribd.com/document/486464154/Suffragetto-Rules)
- Neither a move nor a hop may enter Prison, Prison Yard, Hospital, or Hospital Grounds in ordinary play. Suffragettes cannot enter Albert Hall; police cannot enter the House of Commons. A hop landing in a forbidden space is also illegal. [Original rules transcription](https://www.scribd.com/document/486464154/Suffragetto-Rules)
- A piece that reaches the opponent's goal building may move within its cells but must not move or hop back out. [Original rules transcription](https://www.scribd.com/document/486464154/Suffragetto-Rules)
- The contemporary digital recreation describes the same one-step movement and chained jumps, but its detailed hopping paragraph says to hop over one's own pieces only, contradicting the original transcription's explicit permission to hop over pieces from either side. It also adds an exchange-consent condition absent from the original text. Prefer the archival second edition for these points. [2016 online recreation and rules](https://suffrajitsu.com/play-suffragetto-online-the-1909-suffragettes-vs-police-board-game-meets-the-digital-age); [original transcription](https://www.scribd.com/document/486464154/Suffragetto-Rules)
- A later clarity-edited printable rulesheet has changed the presentation/colors of the large pieces in some reproductions; it is useful as a reading aid, not the authority where it differs from the archival edition. [Printable rules page](https://playsuffragetto.org/print), [rulesheet](https://www.zpag.net/Jeux/Suffragetto-Rules-3.pdf)

### Inferences

- A turn consists of either one single-square move or one complete chained-hop sequence by one piece; the sequence ends at the player's choice after any legal hop. The rules say players alternate moving or hopping one piece and allow a series of jumps, but do not separately define a hop sequence as a formal move record.
- For chaining, apply destination restrictions at each landing square. Keep captured pieces' original Arena squares unavailable as landing spaces only if still occupied; the rules do not state when an arrested piece is physically removed during a multi-capture sequence, so remove it immediately as the most direct executable reading and document that convention.

### Gaps

- No original rules passage located specifies repetition, no-legal-move/stalemate, or a turn/ply limit. Do not silently invent a historical rule; any software draw/loss handling needs to be labelled a product convention.
- The effect of a repeated board cell in one chained hop sequence on subsequent hop availability is not explained beyond requiring an unoccupied landing square.

## Arrests, exchanges, and winning

### Takeaway

Only opposing pieces standing in the pink Arena can be arrested/disabled. Regular pieces capture only by diagonal hops; Leaders and Inspectors capture in any direction. Captured suffragettes go to Prison and captured police to Hospital. When both holding areas have at least 12 inmates, either player may demand an exchange of up to six equal-value pieces, which restart from Prison Yard/Hospital Grounds. The first player to put six pieces into the opposing six-cell building wins.

### Cited Findings

- Hopping an opponent captures only if that opponent is in the Arena. Yellow outside-Arena cells are safe from arrest/disable, even though both players may move and hop there. A hop over an opponent without capture because it is outside the Arena or outside that piece's permitted capture direction remains movement. [Original rules transcription](https://www.scribd.com/document/486464154/Suffragetto-Rules)
- A rank-and-file suffragette disables police only by a diagonal hop; a Leader can disable in any direction. A rank-and-file policeman arrests only by a diagonal hop; an Inspector arrests in any direction. A hop, not a one-square move, is required to arrest/disable. A chain may arrest/disable multiple opponent pieces. [Original rules transcription](https://www.scribd.com/document/486464154/Suffragetto-Rules)
- Arrested suffragettes are moved to Prison; disabled police are moved to Hospital. If both Prison and Hospital have at least 12 inmates, either player may insist on an exchange of up to six pieces; each exchange must match value/rank (Leader for Inspector, rank-and-file for rank-and-file). Released pieces start from Prison Yard and Hospital Grounds. No new exchange is allowed while any piece remains in either staging area. [Original rules transcription](https://www.scribd.com/document/486464154/Suffragetto-Rules)
- The transcription says the winner is the first to introduce six members into the opponent's building. The surviving board's two goal buildings each contain six cells, so this means fill the whole building. [Original rules transcription](https://www.scribd.com/document/486464154/Suffragetto-Rules); [board dimensions and goal cells](https://de.wikipedia.org/wiki/Suffragetto)
- The 2016 recreation adds “if one player does not agree to an exchange, the exchange does not occur”; this consent clause does not appear in the original transcription. The digital product should follow the original edition unless an archival photo resolves otherwise. [2016 online recreation](https://suffrajitsu.com/play-suffragetto-online-the-1909-suffragettes-vs-police-board-game-meets-the-digital-age); [original transcription](https://www.scribd.com/document/486464154/Suffragetto-Rules)

### Inferences

- The goal areas are treated as cells in the pink central Arena in the reproduced layout, so a piece in a goal appears capturable under the rule that any piece in the Arena is liable. Confirm this against the original board photo before fixing it in the rules contract.
- “Either player may insist” means an eligible player can trigger an exchange without opponent consent; this follows the original transcription and avoids importing the later reproduction's consent clause.
- The exchange releases paired pieces to the Yard/Grounds, and a piece may leave its staging area on a later move. Those squares are normally forbidden destinations but are explicitly the release starting cells.

### Gaps

- The source text does not clarify whether goal-building cells count as Arena for capture, although the reproduced board colors suggest they do; inspect the original photo.
- “Six or less pieces” is limited by equal value and available inmates. The precise selection/order for multiple exchanges is not prescribed.
- The original does not address repetition, immobility, draw agreement, or simultaneous victory conditions. Use and label a deterministic digital convention if these cases arise.
