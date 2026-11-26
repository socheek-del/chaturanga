# Arimaa standard two-player rules profile

Research checked 2026-11-26. This records the standard game profile for implementation planning, not the separate Fast Rules variant or tournament time controls.

## What is the standard board, material, and setup?

### Takeaway

Implement the standard game on an 8×8 board with four fixed trap squares and two armies of 16 pieces. Each side has 1 elephant, 1 camel, 2 horses, 2 dogs, 2 cats, and 8 rabbits, ordered from strongest to weakest as listed. Setup is open but constrained: Gold first places its entire army on its own two home ranks on the empty board; Silver then does the same on its own two home ranks; Gold takes the first turn. No canonical starting formation is prescribed.

### Cited Findings

- The current official [Arimaa Game Rules](https://arimaa.com/arimaa/learn/rulesIntro.html) say that play uses a standard chess set with renamed pieces: elephant for king, camel for queen, horse for rook, dog for bishop, cat for knight, and rabbit for pawn. They give the strength order E > M > H > D > C > R and identify c3, f3, c6, and f6 as traps.
- The official [Arimaa Game Rules PDF](https://arimaa.com/arimaa/learn/rules.pdf) says the board starts empty, Gold arranges its pieces on its first two rows, then Silver arranges its pieces on its first two rows; either arrangement may be chosen freely within those rows. The [official Football/Rugby Theme Rules](https://arimaa.com/arimaa/learn/FootballTheme.pdf) explicitly enumerate 16 pieces per side: 1 elephant, 1 camel, 2 horses, 2 dogs, 2 cats, 8 rabbits.
- The official [Arimaa notation rules](https://arimaa.com/arimaa/learn/notation.html) identify coordinates a–h and 1–8 and set a1 at Gold’s bottom-left. The 2024 peer-reviewed paper [“Arimaa Is PSPACE-Hard”](https://research-portal.uu.nl/ws/portalfiles/portal/240416931/LIPIcs.FUN.2024.27.pdf) describes the standard board as 8×8, defines home ranks as each player’s first two ranks and a player’s goal rank as its opponent’s first home rank, and confirms that Gold sets up first, then Silver, before Gold moves.

### Inferences

- With the official notation orientation, Gold’s home ranks are 1–2 and Silver’s are 7–8; therefore Gold’s rabbit goal rank is 8 and Silver’s is 1. The official rules state this player-relatively as “the other side” and “goal row”; the coordinate mapping follows from the notation orientation and the paper’s definition of goal rank.
- The standard set mapping plus the explicit official themed rules give the standard 16-piece inventory. The theme changes the explanatory metaphors, not the piece mix or board mechanics described here.
- A digital setup phase should require placing all 16 pieces in legal home-rank squares for one side before the other side places its pieces. The official rules do not prescribe placements or require a particular opening arrangement.

### Gaps

- The official basic rules page and PDF do not show a publication date or numbered revision. The pages identify the text as ©1999–present; this note therefore treats the linked text as the official version available on 2026-11-26, without claiming a formal version number.
- The themed rules explicitly give the inventory, while the core rules imply it through standard chess-set substitution. Preserve the inventory above, but do not adopt the football/rugby theme’s wording as a separate ruleset.

## How do turns, movement, pushes, pulls, freezing, and traps work?

### Takeaway

A turn is a sequence of one to four orthogonal one-square steps by the active player’s pieces, with the final position different from the starting position. Rabbits cannot step backward under their own movement. A stronger adjacent piece can push or pull one strictly weaker enemy piece in a two-step atomic sequence completed in the same turn. Enemy strength freezes a piece unless it has at least one friendly orthogonal neighbor. A piece on a trap is immediately captured unless supported by at least one adjacent friendly piece.

### Cited Findings

- The official [Arimaa Game Rules](https://arimaa.com/arimaa/learn/rulesIntro.html) state that Gold moves first; each turn has up to four steps; a step moves one piece to an adjacent square; all pieces move orthogonally forward, backward, left, or right, while rabbits cannot move backward. Steps can be shared across pieces, one piece can change direction, and unused steps may be skipped, but an entire turn cannot be passed or made equivalent to passing.
- The official rules describe a push as first moving the weaker enemy piece to an empty adjacent square, then moving the stronger piece into the vacated square. A pull first moves the stronger piece to an empty adjacent square and then moves the enemy piece into the vacated square. The enemy piece must be orthogonally adjacent and weaker; rabbits may be pushed or pulled backward. Either operation costs two consecutive steps and must finish in the same turn. Multiple pushes/pulls may occur in a turn, but a push cannot also pull another enemy along on its completion.
- The official rules say an enemy piece weaker than an adjacent opponent piece is frozen and cannot move on its own; a friendly piece adjacent to it unfreezes it. Frozen pieces may still be pushed or pulled by an opponent’s stronger piece.
- The official rules say an unsupported piece on c3, f3, c6, or f6 is immediately removed. An adjacent friendly piece keeps it safe. They also call a push/pull atomic: for example, a pulling piece may enter a trap and be removed while completing its pull.
- The 2024 [Rin and Schipper paper](https://research-portal.uu.nl/ws/portalfiles/portal/240416931/LIPIcs.FUN.2024.27.pdf) independently clarifies that a completed turn must have a net change to the position, ordinary steps enter unoccupied adjacent squares, and a push or pull moves one strictly weaker enemy piece and costs two steps.

### Inferences

- Model push/pull as a single legal two-step action with its two ordered step effects and trap captures resolved atomically. This preserves the official rule that the pair behaves as simultaneous movement even though notation shows ordered component steps.
- “A friendly piece next to it” and “adjacent” refer to orthogonal neighbors, consistent with the official definition of movement adjacency and the board’s orthogonal movement rules.
- Strength is strictly ordered. Equal-strength pieces cannot push, pull, or freeze one another, and the strongest adjacent opponent piece governs whether a piece is frozen; a single friendly adjacent piece is sufficient to unfreeze it. The latter clarifies the prose in the official rule sheet without adding a new mechanic.
- The official “may not pass the whole turn or make a move equivalent to passing” is best represented by rejecting a turn whose final position is unchanged. The academic description explicitly phrases the requirement as a net change to position.

### Gaps

- The official rules define the outcome constraints but do not prescribe a user-interface interaction model for entering multi-step turns. The implementation can choose a sequence editor so long as it enforces these same legal transitions and end-of-turn constraints.
- The official web/PDF wording is concise around simultaneous push/pull effects and what counts as equivalent to passing. The academic paper’s “net change” wording resolves the latter; the official atomicity note resolves the former. No further exception was found in the reviewed standard rules.

## What wins, what ends a game, and which rule profile should be adopted?

### Takeaway

The standard game has three natural win routes: end a turn with a rabbit on its goal rank, eliminate every opposing rabbit, or leave the opponent with no legal move. Third-occurrence repetition is forbidden at turn end; if every available turn would create that repetition, the player loses. The official rules specify an end-of-turn result-check order, which should be followed for simultaneous events. Adopt the standard rules page/PDF as the game profile; keep Fast Rules and match clock/scoring rules out of the casual core rules.

### Cited Findings

- The official [Arimaa Game Rules](https://arimaa.com/arimaa/learn/rulesIntro.html) say a rabbit must remain on its goal row at the end of a turn for the player to lose to that goal; if it is moved back out before turn end, no goal loss occurs. They say a player unable to move because all pieces are frozen or blocked loses.
- The official rules prohibit a turn if it would make the same board position and side to move occur for a third time. If a player’s only moves are prohibited third repetitions, that player loses. They also say losing all rabbits loses, and if both players lose their last rabbit on the same move, the mover wins.
- The official rules give this explicit result-check order after player A has moved: (1) A has a rabbit at goal, A wins; (2) B has a rabbit at goal, B wins; (3) B has no rabbits, A wins; (4) A has no rabbits, B wins; (5) B has no possible move, A wins; (6) B can only make third-time repetitions, A wins.
- The official [Learn to Play Arimaa index](https://arimaa.com/arimaa/learn/) distinguishes “Official Rules” from “Match Rules” and separately lists “Fast Rules” under “Variant Rules.” The [Match Rules](https://arimaa.com/arimaa/learn/matchRules.html) concern ranked/tournament/contest/championship play and require a time control and game record; if a match is halted by its time limit, the winner is decided by piece-count scoring (or Silver if tied). These are competition conditions, not additional natural end conditions of the standard casual game.
- The 2024 [Rin and Schipper paper](https://research-portal.uu.nl/ws/portalfiles/portal/240416931/LIPIcs.FUN.2024.27.pdf) independently describes the three standard win routes and same-turn last-rabbit tie-break. Its formal position includes both piece locations and the player to move, agreeing with the official repetition wording.
- The official [game notation rules](https://arimaa.com/arimaa/learn/notation.html) document setup placements, individual steps, skipped steps, captures, and results. This is relevant if a later product plan includes replay/export, but it does not change the movement rules.

### Inferences

- End conditions should be evaluated after a complete turn, in the official listed order. Thus if both sides would otherwise satisfy a goal condition at once, the mover’s goal check takes precedence; the same ordered checking resolves simultaneous rabbit elimination.
- Repetition identity should include the board position and side to move, and should be checked only on the completed-turn position, not on intermediate steps within a turn.
- A naturally completed game should not be assigned a chess-style draw by default: the reviewed official standard rules specify wins/losses and repetition prohibition but no natural draw result. Tournament clocks can introduce a separate score-based result under the Match Rules.
- The bare-minimum digital profile can offer casual play without a match clock. If clocks or tournament adjudication are later added, they should be a separate mode using the official Match Rules rather than silently becoming ordinary game endings.

### Gaps

- The official rules refer readers to Match Rules for time controls but do not present clocks as part of the base game. This note does not settle a product’s clock choices, resignation flow, or ranked-match format.
- The official Learn index lists Fast Rules as a separate variant, but the accessible source text was not used to enumerate its differences. It should not be mixed into the selected standard profile.
- This is rules research only. The separate Arimaa Public License page states that commercial activity requires a commercial license and noncommercial projects require authorization; assess that separately before public implementation or deployment. Source: [The Arimaa Public License](https://arimaa.com/arimaa/license/).
