# Chaturaji rules source notes

Research date: 2026-11-26.

## Primary historical account

- Al-Biruni's *India* (c. 1030), translated by Edward C. Sachau in *Alberuni's India* (1910), vol. I, ch. 16, pp. 183–185. The digitized text is available in [Project Gutenberg](https://www.gutenberg.org/cache/epub/79672/pg79672-images.html). It describes four players, a 64-square board, two dice, eight pieces per army, the movement-type mapping, and capture values. It says the two dice are thrown in rotation among players and that each number causes a move. The translated board table supplies an initial layout, though the printed diagram was later found reversed.
- H. J. R. Murray, *A History of Chess* (1913), ch. III, especially pp. 68–76. [Public-domain scan](https://upload.wikimedia.org/wikipedia/commons/2/2f/A_History_of_Chess.pdf). Murray collates Al-Biruni with the later Raghunandana account, interprets the piece moves and capture values, and explains why several practical rules cannot be recovered with certainty. He explicitly cautions that a playable reconstruction cannot be shown to reproduce the historical game exactly.
- The c. 1500 Raghunandana rules, translated by Murray from the *Tithitattva*, broadly agree on setup, piece moves and die mapping, but include additional stakes and special-position rules. The text is incomplete and its final section is defective. It is a separate later witness, not an unambiguous amendment to Al-Biruni.

## Extracted mechanics

- Four individual seats use an 8×8 board. Each army has a King, Elephant, Horse, Boat/Rook, and four Pawns.
- The King moves one square in any direction; it may be captured and need not move out of attack. The Elephant slides orthogonally like a rook. The Horse moves as a chess knight. The Boat jumps exactly two squares diagonally, over an intervening square. A Pawn advances one square and captures one square diagonally forward; no initial double step is described.
- Al-Biruni records dice values 1 and 5 for Pawn or King, 2 for Boat/Rook, 3 for Horse, and 4 and 6 for Elephant. Murray explains that 5 substitutes for 1 and 6 for 4 on a cubic die, reflecting a four-sided long die.
- Capture values are Pawn 1, Boat/Rook 2, Horse 3, Elephant 4 and King 5. Al-Biruni reports a special score of 54 for a player who keeps their own King while capturing the other three Kings.
- The later Raghunandana text describes a King occupying another King's starting square as *sinhasana*, and a special *vrihannauka* / Boat-triumph condition involving four Boats on a 2×2. These are summarized by the current [Wikipedia Chaturaji entry](https://en.wikipedia.org/wiki/Chaturaji#Rules). The exact consequences differ across summaries and need a narrow v1 ruling before implementation.

## Open rule choices to pin in the contract

Murray identifies unresolved questions: how two dice are applied, whether dice are used on every turn, what happens when a die names a piece with no legal move, whether such a result is rerolled or lost, whether captures remove a player from play, the exact pawn-promotion restrictions, and how turns circulate. The surviving accounts do not prove one complete, most-played ruleset. The implementation must label its procedural conventions as a playable reconstruction and record each roll in the serialized move history.

The historical translations and mechanics are used as research evidence only. Write original tutorial text, code, diagrams and art.

## V1 choices now pinned

- Use the current Wikipedia summary's two six-sided dice, one action per die, clockwise seats, optional pass and the 1/5, 2, 3, 4/6 piece map. Generate dice from an injected seed; put the first pair in the seeded starting FEN and store later pairs as `ROLLxy` replay events.
- Keep the full 8×8 board and the four 4-piece back lines with adjacent pawn lines. The four seat colors/orientations are Red east, Green south, Yellow west and Black north, with Red first.
- Keep independent scoring. A player who captures all three original opposing Kings while their own original King remains receives 54 total points; finish immediately when the third original King is captured and compare scores.
- Adopt the current summary's Boat triumph and allied throne takeover. A King crossing onto another original King square gains the throne; taking the opposite ally's throne makes that controller act for both armies at the second army's scheduled seat.
- Interpret promotion symmetrically along the far edge: from nearest corner inward, target Boat, Horse, Elephant, King. Require and consume that piece type from the controller's captured pool. This makes all four rotated pawn armies playable and is recorded as a digital interpretation where the summary does not show an unambiguous square correspondence.

The pure engine is now implemented in `packages/chaturaji/`. Focused tests and shared conformance pass; see the feature evidence and product plan for the exact verification commands.
