# Duell rules research

## Identity and the 1976 edition

### Takeaway

The roadmap’s Duell is Geoffrey Hayes’s dice-as-pieces chess variant, issued by Lakeside in 1976. Its earlier UK release was sold as *Conquest* in 1975; the contemporaneous review calls the same design *Conquest* and notes later alternate names including *Duell*. The rules evidence supports one rules family with publication/turn-order variations, rather than a distinct Lakeside rules invention.

### Cited Findings

- The 1974 UK patent application and 1975 US patent name Geoffrey Hayes as inventor and Toy Development Ltd as assignee; the US patent describes a two-player board game played with distinguishable dice. [US3929337A](https://patents.google.com/patent/US3929337A/en)
- A reproduction of a 1976 rules sheet is headed “DUEL de Geoffrey Hayes,” gives the game date as 1976 and lists a Toy Development Ltd license. It specifies a two-player game and two colors of eight numbered dice plus one king die each. [1976 French rules scan](https://regle.escaleajeux.fr/duel__rg.pdf)
- Lakeside’s US trademark record shows DUELL filed on May 28, 1976 for equipment sold as a board game. This supports the date/name for the US edition, but is not a rulebook. [Justia trademark index](https://trademarks.justia.com/owners/leisure-dynamics-inc-72235/)
- David Pritchard’s 1976 review described *Conquest* as a Denys Fisher game invented by Geoffrey Hayes, and identified later names that included *Duell*. [Review reproduced in *Tabletop: Analog Game Design*](https://s3.amazonaws.com/arena-attachments/924462/5a983325d935ae0c8e1cba17ece53837.pdf)
- A 2010 implementation author reports that Lakeside’s 1976 English rules let players decide who starts, while an earlier Parker version made Red start. This is a collector/programmer’s transcription rather than a directly inspected Lakeside rule sheet. [SourceForge project notes](https://sourceforge.net/projects/duell/files/)

### Inferences

- Use the Lakeside 1976 edition as the roadmap label’s target, while treating its mechanics as Hayes’s *Conquest/Duell* rules family. The 1976 rules scan and the patent’s 9×8 board, two nine-die armies and king objective are consistent with that family. [1976 French rules scan](https://regle.escaleajeux.fr/duel__rg.pdf); [US3929337A](https://patents.google.com/patent/US3929337A/en)

### Gaps

- I did not locate an independently accessible Lakeside English instruction sheet; confirm its opening-player clause from the physical/manual scan before freezing the selected edition. [SourceForge project notes](https://sourceforge.net/projects/duell/files/)

## Setup and rules of play

### Takeaway

Play on a 9-file by 8-rank board. Each side has eight normal six-sided dice and one king die with the same symbol on every face. A normal die must move exactly the number showing on top before the move; roll it orthogonally, changing direction at most once, without passing over any die. Captures occur only by landing exactly on an opponent. Win by capturing the opposing king or reaching its starting square with your own king.

### Cited Findings

- The patent specifies a 72-square, 9-by-8 board and two equal sets of nine dice; eight dice per set show the numbers one through six, and the special/master die has one repeated symbol on every face. [US3929337A](https://patents.google.com/patent/US3929337A/en)
- The scanned 1976 rules show one back rank per player with top values from left to right `5, 1, 2, 6, King, 6, 2, 1, 5`; the King is central and the numbered dice have their 3 side facing the player. [1976 French rules scan](https://regle.escaleajeux.fr/duel__rg.pdf)
- The same rules sheet says White starts. It allows only horizontal/vertical motion, exactly the starting top-face count, no move that reverses direction within the same turn, at most one right-angle change, and no jumping over friendly or opposing dice. The king advances one square at a time. [1976 French rules scan](https://regle.escaleajeux.fr/duel__rg.pdf)
- The patent confirms that each step tumbles the die to an adjacent face. Its examples state that a 4-facing side becomes the top when rolling toward the player, while a 5 becomes top when rolling away; a bent path can yield a different final top face from another path of equal length. [US3929337A](https://patents.google.com/patent/US3929337A/en)
- The rules sheet says a capture requires landing exactly on an enemy die, which is then removed. Its win condition is to land on the opposing King or, if it has moved, take the square where that King started. [1976 French rules scan](https://regle.escaleajeux.fr/duel__rg.pdf)
- The contemporaneous *Conquest* review independently describes the 9×8 board, eight ordinary dice and one King-equivalent key die, orthogonal tumbling, move length from the pre-move top face, one right-angle turn, no passing pieces and replacement capture. [Review reproduced in *Tabletop: Analog Game Design*](https://s3.amazonaws.com/arena-attachments/924462/5a983325d935ae0c8e1cba17ece53837.pdf)

### Inferences

- Die orientation is part of the position: legal route choice affects which face is uppermost after the move and therefore the die’s future range. The patent’s explicit orientation examples support representing each die with a full face/orientation state rather than storing only its current top value. [US3929337A](https://patents.google.com/patent/US3929337A/en)

### Gaps

- The text layer of the 1976 scan does not expose a complete face-order/chirality diagram for standard dice. The patent describes its face diagrams, but the starting setup in the rules sheet should be checked visually against a complete copy before tests are authored. [1976 French rules scan](https://regle.escaleajeux.fr/duel__rg.pdf); [US3929337A](https://patents.google.com/patent/US3929337A/en)

## Source conflicts and digital-rule questions

### Takeaway

The main conflict is who begins: the 1976 French rules say White, the earlier Parker rules are reported as Red, and the 1976 Lakeside edition is reported as letting the players choose. Victory after a king reaches the opposing key square also needs an explicit timing rule; a 1976 review says the original rules leave immediate recapture unclear and proposes a survival condition as a refinement.

### Cited Findings

- The 1976 French sheet states White begins; the SourceForge author’s transcription says Parker’s Red begins and Lakeside lets players choose. [1976 French rules scan](https://regle.escaleajeux.fr/duel__rg.pdf); [SourceForge project notes](https://sourceforge.net/projects/duell/files/)
- The 1976 review says it is unclear from the rules whether a King reaching the opponent’s key square wins immediately or may be captured on the opponent’s next move. The later author-proposed refinements recommend that the King must survive an immediate reply. These refinements are presented as suggestions, not as Hayes’s printed rule. [Review reproduced in *Tabletop: Analog Game Design*](https://s3.amazonaws.com/arena-attachments/924462/5a983325d935ae0c8e1cba17ece53837.pdf)
- The 1976 rules sheet says there are six movement diagrams documenting possible face transitions, which are important because orientation changes the next move count. [1976 French rules scan](https://regle.escaleajeux.fr/duel__rg.pdf)

### Inferences

- Before engine work, select the Lakeside 1976 opening convention from its own manual, then state whether entry into the opponent’s key square wins immediately or requires survival of the next reply. The review itself documents this ambiguity. [Review reproduced in *Tabletop: Analog Game Design*](https://s3.amazonaws.com/arena-attachments/924462/5a983325d935ae0c8e1cba17ece53837.pdf)

### Gaps

- The available material does not establish a no-legal-move result, repetition draw or long-game draw rule. These need a sourced convention or a clearly labeled digital rule before the variant is implemented.
- The available rule scans do not settle whether a King’s one-square move can include a bend (the text says it moves one square only, so no bend is possible in practice), or whether occupying an empty opponent key square ends the game in the same turn with no response. The second point is specifically questioned by the 1976 review. [1976 French rules scan](https://regle.escaleajeux.fr/duel__rg.pdf); [Review reproduced in *Tabletop: Analog Game Design*](https://s3.amazonaws.com/arena-attachments/924462/5a983325d935ae0c8e1cba17ece53837.pdf)
