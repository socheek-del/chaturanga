# Kruzno rules and variant identity

## What game does the catalog mean?

### Takeaway

The chess-like-games catalog links “Kruzno” to the article about Mark Palko’s base Kruzno abstract strategy game, first published in 2005. The roadmap’s request to document “the linked hex-checkers game's setup and jumps” appears to target the distinct Kruzno Checkers variant on the official site; the two identities should not be silently merged. ([catalog article](https://en.wikipedia.org/wiki/Kruzno_(board_game)); [roadmap](../../../../../docs/CHESS-LIKE-ROADMAP.md); [official Kruzno Checkers rules](https://www.kruzno.com/hexcheckers.html))

### Cited Findings

- The catalog entry is a link to [Kruzno (board game)](https://en.wikipedia.org/wiki/Kruzno_(board_game)), which describes a two-player game first published in 2005 and names the game “Kruzno.”
- The local roadmap separately says: “Document the linked hex-checkers game's setup and jumps. Reconcile the catalog and linked article's edition details.” ([`docs/CHESS-LIKE-ROADMAP.md`](../../../../../docs/CHESS-LIKE-ROADMAP.md))
- The official rules page calls “Kruzno Checkers” a fast-moving checkers variant designed specifically for play on a Kruzno board, distinguishing it from the base game. ([Kruzno official rules](https://www.kruzno.com/hexcheckers.html))
- The Malohont regional tourism page says Mark Palko devised the hexagonal strategy game and first published it in 2005; it also recounts the Slovak village of Kružno contacting Palko in 2011 and installing a public board in 2013. ([Region Malohont, “Hra Kružno – outdoorová aktivita”](https://regionmalohont.sk/volny-cas/hra-kruzno-outdorova-aktivita-kruzno/))
- Palko’s own 20 December 2017 post says he liked how Kružno played and that its hexagonal set used a “6 x 6 x 6” board; the post discusses the base game and its small production run. ([Mark Palko, 20 Dec 2017](https://observationalepidemiology.blogspot.com/2017/12/))
- The Wikipedia article’s reference list cites David Parlett’s *Oxford History of Board Games* (1999), which predates the article’s stated 2005 first-publication date. That is a citation chronology mismatch; the page does not explain it. ([Kruzno article and its references](https://en.wikipedia.org/wiki/Kruzno_(board_game)))

### Inferences

- The catalog label “Kruzno” identifies the base game; the roadmap’s “hex-checkers game” wording most likely points to the separately documented Kruzno Checkers variant. This interpretation follows the different names and the official page’s explicit “variant” wording. ([Kruzno article](https://en.wikipedia.org/wiki/Kruzno_(board_game)); [official variant rules](https://www.kruzno.com/hexcheckers.html); [roadmap](../../../../../docs/CHESS-LIKE-ROADMAP.md))
- A product implementation should choose and name one ruleset before coding. “Kruzno” and “Kruzno Checkers” do not have interchangeable rules based on the available sources.

### Gaps

- The roadmap does not explicitly say whether its planned product is the base Kruzno game or Kruzno Checkers; it asks for Checkers setup and jumps while also requesting reconciliation with the base-game article. ([`docs/CHESS-LIKE-ROADMAP.md`](../../../../../docs/CHESS-LIKE-ROADMAP.md))
- The article’s 1999 reference cannot substantiate a game said to have first been published in 2005 without further explanation. The regional page supports 2005, but a primary dated publication/catalog record was not found. ([Kruzno article](https://en.wikipedia.org/wiki/Kruzno_(board_game)); [Region Malohont](https://regionmalohont.sk/volny-cas/hra-kruzno-outdorova-aktivita-kruzno/))

## Rules supported by sources

### Takeaway

The base game and the official Kruzno Checkers variant have different reported rules. The base-game article gives a 9-piece-per-player roster, intransitive captures, non-capturing jumps and a perimeter restriction, but lacks enough movement and setup detail to implement it. The official Checkers page gives adjacent-hex moves, mandatory jumps and a border-space restriction, but leaves key setup and ending details in an inaccessible diagram or unspecified. ([Kruzno article](https://en.wikipedia.org/wiki/Kruzno_(board_game)); [official Kruzno Checkers rules](https://www.kruzno.com/hexcheckers.html))

### Cited Findings

**Base Kruzno**

- The article says the most common variant starts with nine pieces per player: three rooks, three knights and three bishops. ([Kruzno article](https://en.wikipedia.org/wiki/Kruzno_(board_game)))
- Its capture cycle is Rook captures Knight, Knight captures Bishop, Bishop captures Rook. ([Kruzno article](https://en.wikipedia.org/wiki/Kruzno_(board_game)))
- A piece may make a series of jumps; it captures a jumped opposing piece only when that piece is one it can capture. The article’s example says a black rook may capture a white knight but can jump without capturing a rook, knight or bishop that cannot capture it. ([Kruzno article](https://en.wikipedia.org/wiki/Kruzno_(board_game)))
- If a piece moves onto the outer ring of hexagons, its next move must go back toward the center unless blocked. ([Kruzno article](https://en.wikipedia.org/wiki/Kruzno_(board_game)))
- Palko describes the base game’s board as “6 x 6 x 6”; the article itself only says “hexagonal board.” Neither source text gives a coordinate system or enumerates cells. ([Palko, 20 Dec 2017](https://observationalepidemiology.blogspot.com/2017/12/); [Kruzno article](https://en.wikipedia.org/wiki/Kruzno_(board_game)))
- A secondary game catalogue lists the reverse capture cycle—Bishop captures Knight, Knight captures Rook, Rook captures Bishop—conflicting with the article. ([Tarsasjatekok listing](https://tarsasjatekok.com/tarsasjatek/kruzno-2004); [Kruzno article](https://en.wikipedia.org/wiki/Kruzno_(board_game)))

**Kruzno Checkers**

- The official page says the opening uses twelve pieces positioned as shown, but the text does not state whether that means twelve total or twelve per side; the arrangement is shown only in a diagram. ([Kruzno official rules](https://www.kruzno.com/hexcheckers.html))
- On a non-capturing move, a piece moves one space to any adjacent hexagon; there is no promotion. ([Kruzno official rules](https://www.kruzno.com/hexcheckers.html))
- Shaded outer hexagons are restricted: after moving onto a border space, a piece must move out on its next move unless opposing pieces block it. ([Kruzno official rules](https://www.kruzno.com/hexcheckers.html))
- Captures follow American checkers: jump an opposing piece to an open space immediately beyond it. Captures are mandatory; if multiple captures are available, the player chooses among them. The text does not impose a maximum-capture rule. ([Kruzno official rules](https://www.kruzno.com/hexcheckers.html))

### Inferences

- Palko’s “6 x 6 x 6” likely describes a six-cell-per-side regular hexagon board, but the text does not explicitly define that notation or the board’s cell count; treat this as an inference rather than a confirmed 91-cell topology. ([Palko, 20 Dec 2017](https://observationalepidemiology.blogspot.com/2017/12/))
- The base-game article’s “piece can either move one space or can make a series of jumps” suggests jumping can chain, but it does not provide enough geometry to determine the legal paths or when a chain must stop. ([Kruzno article](https://en.wikipedia.org/wiki/Kruzno_(board_game)))

### Gaps

- Base Kruzno: no sourced starting coordinates, initial orientation, exact cell count, move geometry for rook/bishop/knight, detailed jump directions, move-blocking rules, or terminal conditions were found. The article is marked as a stub and does not give these rules. ([Kruzno article](https://en.wikipedia.org/wiki/Kruzno_(board_game)))
- Base Kruzno capture-cycle conflict: the accessible secondary listing contradicts Wikipedia, and the available creator-authored material found here does not provide the full rules text to settle it. Do not choose the cycle solely from these conflicting summaries. ([Tarsasjatekok listing](https://tarsasjatekok.com/tarsasjatek/kruzno-2004); [Kruzno article](https://en.wikipedia.org/wiki/Kruzno_(board_game)))
- Kruzno Checkers: the official setup and capture diagrams are essential to exact coordinates/topology but were not retrievable as text; the page does not state the winner/no-move result, draw conditions, or whether a capturing chain must continue after its first jump. ([Kruzno official rules](https://www.kruzno.com/hexcheckers.html))
- The official checkers page says “twelve pieces” without specifying in text whether this is total or per player, so verify against the original diagram or a physical set before implementing. ([Kruzno official rules](https://www.kruzno.com/hexcheckers.html))

## Gaps before engine choice

### Takeaway

The available sources are enough to identify two distinct candidates, but not enough to implement either one faithfully. The immediate decision is whether the catalog entry is to become base Kruzno (which needs a primary rulebook) or Kruzno Checkers (which needs the official setup diagram and clarification of endings and capture chains). ([Kruzno article](https://en.wikipedia.org/wiki/Kruzno_(board_game)); [official Kruzno Checkers rules](https://www.kruzno.com/hexcheckers.html); [roadmap](../../../../../docs/CHESS-LIKE-ROADMAP.md))

### Cited Findings

- The roadmap explicitly names setup and jumps for “the linked hex-checkers game,” while the catalog article supplies only a partial description of base Kruzno. ([`docs/CHESS-LIKE-ROADMAP.md`](../../../../../docs/CHESS-LIKE-ROADMAP.md); [Kruzno article](https://en.wikipedia.org/wiki/Kruzno_(board_game)))
- The official Kruzno Checkers rules page has textual rules plus images for the opening and captures; its text does not describe the terminal result or draw rules. ([Kruzno official rules](https://www.kruzno.com/hexcheckers.html))
- The base-game article states the capture cycle and key special rules but does not specify a winning condition or the movement patterns of the named chess pieces. ([Kruzno article](https://en.wikipedia.org/wiki/Kruzno_(board_game)))

### Inferences

- The roadmap’s most literal target is Kruzno Checkers, but its “reconcile” clause means the parent project should record whether this is a separate product/variant or whether the intended catalog game is instead the base game. ([`docs/CHESS-LIKE-ROADMAP.md`](../../../../../docs/CHESS-LIKE-ROADMAP.md); [official Kruzno Checkers rules](https://www.kruzno.com/hexcheckers.html))
- Tutorials, bots and online play should wait until the chosen ruleset has a verified setup, complete legal-move rules and end conditions; those details determine the engine’s state and game result model.

### Gaps

- Needed from a primary source for base Kruzno: complete rules, diagrams, board notation/topology, all piece moves and jump rules, capture precedence, and win/draw conditions.
- Needed for Kruzno Checkers: accessible opening/capture diagrams, exact number and placement of pieces per side, board shape and playable-cell map, capture-chain continuation, and win/draw conditions.
- Rights/licensing: the official rules page is a source of rules text and diagrams, but no explicit license for reproducing its text or artwork was found. Rules facts may be documented independently; do not copy diagrams or artwork into the product until reuse rights are established. ([Kruzno official rules](https://www.kruzno.com/hexcheckers.html))
