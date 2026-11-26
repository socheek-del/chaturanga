# Chu Shogi rules implemented by this package

The package selects the **Chu Shogi Renmei competition rules (2019)** with the association's **2004 Lion clarifications**. This is the clearest current formal association profile located for the project; available sources do not establish that it is statistically the most popular form. The digital product also uses the association's communication-play Lance promotion extension for online and saved games.

Primary references:

- [Renmei 2019 competition rules](https://www.chushogi-renmei.com/kouza/rule2007.htm)
- [Renmei 2004 supplementary Lion rules](https://www.chushogi-renmei.com/kouza/rule_hosoku2004.htm)
- [Renmei piece movement guide](https://www.chushogi-renmei.com/kouza/koma.htm)

All prose, illustrations, and diagrams in this repository are original summaries. No association artwork or rulebook text is included.

## Board, turns, and notation

- The board has 12 files (`a`–`l`) and 12 ranks (`1`–`12`). White starts at the low ranks and advances toward rank 12; Black's setup is White's formation rotated 180 degrees.
- Each side begins with 46 pieces: one King, Lion, Free King, Drunk Elephant, Kirin, and Phoenix; two each of the next fourteen general/runner types; and twelve Pawns. The setup has 21 base types. Including promoted forms, the game has 29 piece ranks.
- Rank 1, from file `a` to `l`: Lance, Ferocious Leopard, Copper General, Silver General, Gold General, King, Drunk Elephant, Gold General, Silver General, Copper General, Ferocious Leopard, Lance.
- Rank 2: Reverse Chariot on `a` and `l`, Bishop on `c` and `j`, Blind Tiger on `e` and `h`, Kirin on `f`, Phoenix on `g`.
- Rank 3, from file `a` to `l`: Side Mover, Vertical Mover, Rook, Dragon Horse, Dragon King, Lion, Free King, Dragon King, Dragon Horse, Rook, Vertical Mover, Side Mover.
- Rank 4 has a Pawn on every file. Rank 5 has Go-Betweens on `d` and `i`.
- Players alternate one turn at a time. Captured pieces leave play; there are no drops or hands.
- A move string gives the source square followed by each landing square in route order. `+` marks promotion. A multi-leg Lion route is one move, even if it captures twice or returns to its source. For example, `f6g6h6` describes two successive landings and `f6g6f6` can encode Igui or Jitto, distinguished by the board position and capture record.

## Movement and promotion

“Step” means one adjacent square. “Slide” means any unobstructed distance along the named direction. A piece cannot land on a friendly piece. A direct two-square Lion-power jump ignores its middle square.

| Base piece | Unpromoted movement | Promoted rank |
| --- | --- | --- |
| King | One step in any direction | Does not promote |
| Lion | Up to two King steps; may turn after the first, capture on either step, or jump exactly two squares in a straight direction | Does not promote |
| Free King | Slides in any direction | Does not promote |
| Drunk Elephant | One step in any direction except straight backward | Prince: King step; a second royal |
| Kirin | One-step diagonals; two-square orthogonal jumps | Lion |
| Phoenix | One-step orthogonals; two-square diagonal jumps | Free King |
| Rook | Orthogonal slides | Dragon King |
| Bishop | Diagonal slides | Dragon Horse |
| Dragon King | Orthogonal slides and one-step diagonals | Soaring Eagle |
| Dragon Horse | Diagonal slides and one-step orthogonals | Horned Falcon |
| Vertical Mover | Vertical slides and one-step horizontal moves | Flying Ox |
| Side Mover | Horizontal slides and one-step vertical moves | Free Boar |
| Reverse Chariot | Vertical slides | Whale |
| Lance | Slides forward | White Horse |
| Blind Tiger | One step in any direction except straight forward | Flying Stag |
| Ferocious Leopard | One-step diagonals and straight forward/backward steps | Bishop |
| Gold General | Orthogonal steps and forward-diagonal steps | Rook |
| Silver General | Forward step and diagonal steps | Vertical Mover |
| Copper General | Forward-diagonal steps and a straight-backward step | Side Mover |
| Go-Between | Forward or backward step | Drunk Elephant |
| Pawn | One step forward | Gold General |

Promoted movement:

- Flying Ox slides vertically and diagonally. Free Boar slides horizontally and diagonally. Whale slides vertically and on backward diagonals. White Horse slides vertically and on forward diagonals. Flying Stag slides vertically and steps one square in every direction.
- Soaring Eagle slides orthogonally and on backward diagonals. It has Lion power on the two forward diagonals.
- Horned Falcon slides diagonally, horizontally, and backward vertically. It has Lion power straight forward.
- Other promoted ranks use the movement listed for the matching rank above.
- Lion power for Horned Falcon and Soaring Eagle allows a one-step landing, a second landing along the same allowed ray, capture on both landings, a direct two-square jump, and a return-to-source route. Unlike a true Lion, these ranks do not turn between legs.

Promotion is optional. A promotable piece may promote when it enters the opponent's four-rank zone from outside, or when it captures in or while leaving that zone. If it declines an opportunity, it may promote again after leaving and re-entering the zone, or on a qualifying capture. Declining status is serialized with the position.

An unpromoted Pawn receives another chance on the farthest rank. The digital profile extends that recovery to Lance, as the Renmei expressly permits for communication games. An unpromoted Pawn or Lance left on its farthest rank is immobile. King, Lion, and Free King cannot promote; a promoted piece cannot promote again.

## Lion restrictions

- A true Lion is the base Lion or a promoted Kirin. Adjacent Lions may capture one another without a protection check.
- For a non-adjacent true-Lion capture, the target Lion must not be protected after the complete route. Protection includes ordinary defending movement and hidden line attacks that could capture the moving Lion after the contemplated route. The engine does not recursively apply Lion-trade restrictions to hypothetical recaptures.
- Tsukegui allows a Lion route to capture an eligible intervening piece and then the protected Lion on the same turn. Pawn and Go-Between cannot be the intervening piece. The captured pieces remain ordered in the move record.
- The 2004 interpretation treats a route as one action when a Pawn or Go-Between is the target Lion's only foot and the Lion captures that foot earlier in the route. The target therefore remains protected for that complete action.
- When a non-Lion captures an enemy Lion, a one-reply first-Lion restriction is recorded if a friendly true Lion has a foot. The opponent cannot take that protected Lion with a non-Lion on its immediate reply. A Kirin that captures a Lion while promoting to Lion receives this treatment. Lion captures and qualifying tsukegui take precedence over the restriction.
- The FEN and position identity include the expiring first-Lion restriction so replay, undo, and online validation can reproduce it.

## Victory, draws, and digital conventions

- The objective is to checkmate or capture the opponent's King. If the opponent has a Prince, that royal must also be defeated. The engine ends by capture only after every opposing King and Prince is gone. A King may be left under attack; there is no royal-safety restriction and players need not announce check.
- Digital checkmate is recognized only when a royal is under attack and no legal reply prevents the attacker from capturing **all** remaining royals in one following move. This makes the Renmei's “mate or King capture” rule deterministic where a remaining Prince must still be defeated. If all royals are not capturable in one route, the engine does not call it checkmate.
- A side with no legal move loses, whether or not a royal is under attack. The engine reports a no-move loss as `stalemate` with the winner set to the other side; this is the product's digital stalemate convention.
- The Renmei barren-material result applies when both Kings and exactly one eligible additional piece remain: the side with two pieces wins. Dead unpromoted Pawn/Lance are excluded from the count. Unpromoted Pawn and Go-Between do not qualify as the extra piece.
- Repetition is adjudicated on a fourth occurrence of the same serialized position. The responsible side loses if it does not vary. Responsibility is assigned in this order: a side that gives royal attack on each of its turns in the cycle; the only side to attack opposing pieces in the cycle; the first passer when every move is Jitto by both sides; otherwise the side to move at the repeated position. The final quiet-cycle and loss adjudications are explicit software conventions.
- Mutual agreement to draw is a host-game action, not a board-state rule in this engine package.

The engine is tested with route-level Lion and promotion fixtures, replay/undo, attack-map conformance, royal capture and mate, barren/no-move outcomes, and repetition responsibility. The supporting product will teach these rules interactively.
