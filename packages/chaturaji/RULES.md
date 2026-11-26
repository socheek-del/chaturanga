# Chaturaji rules

## Selected profile

This package implements a playable historical reconstruction of the four-player dice game described by Al-Biruni around 1030, cross-checked against the later Sanskrit description translated by H. J. R. Murray. Sources do not establish one fully recoverable code or a most-popular variant. The rules below distinguish source-backed mechanics from digital procedures chosen to fill the documented gaps.

Sources: Al-Biruni, *India*, translated by Edward C. Sachau (1910), vol. I, ch. 16, pp. 183–185; H. J. R. Murray, *A History of Chess* (1913), ch. III, pp. 68–76; current summary at [Wikipedia: Chaturaji](https://en.wikipedia.org/wiki/Chaturaji#Rules). Research notes are in [`apps/chaturaji/docs/`](../../apps/chaturaji/docs/).

## Board, seats and setup

The board is 8×8, files `a` through `h`, ranks `1` through `8`. The four armies each occupy a 4×2 block in one corner. `a1` is the southwest corner.

| Seat | Color | Back rank / file, in board coordinates | Pawn line | Ally |
| --- | --- | --- | --- | --- |
| Red | `r` | `h8` Boat, `h7` Horse, `h6` Elephant, `h5` King | `g8`–`g5` | Yellow |
| Green | `g` | `e1` King, `f1` Elephant, `g1` Horse, `h1` Boat | `e2`–`h2` | Black |
| Yellow | `y` | `a4` King, `a3` Elephant, `a2` Horse, `a1` Boat | `b4`–`b1` | Red |
| Black | `b` | `a8` Boat, `b8` Horse, `c8` Elephant, `d8` King | `a7`–`d7` | Green |

The rotated corner formations reproduce the printed Al-Biruni arrangement. Red moves first. Play proceeds clockwise: Red, Green, Yellow, Black. The sources do not establish turn direction; clockwise follows the current Wikipedia summary and is an explicit convention.

## Pieces and movement

- **King (`k`)**: one square in any of the eight directions.
- **Elephant (`e`)**: slides any positive number of empty squares orthogonally; it may capture an opposing piece on its destination.
- **Horse (`h`)**: moves as a chess knight and may jump over intervening pieces.
- **Boat (`b`)**: jumps exactly two squares diagonally, over the intervening square.
- **Pawn (`p`)**: advances one empty square toward the far edge. It captures one square diagonally forward. It never has an initial double step.

Each army's pawns advance toward the opposite side of the board: Red west, Green north, Yellow east, Black south. A piece cannot land on a friendly piece. A move may capture any other color, including the opposite ally. There is no check or checkmate: a King may remain under attack, move onto an attacked square, or be captured like any other piece. A player whose King is captured keeps taking turns with their remaining pieces.

Castling, en passant, chess clocks and other international-chess rules do not apply.

## Dice and turn procedure

Each seat turn uses two six-sided dice. Each die gives one piece action. The values select the available piece types as follows:

| Die face | Eligible piece |
| --- | --- |
| 1 or 5 | Pawn or King |
| 2 | Boat |
| 3 | Horse |
| 4 or 6 | Elephant |

The two results are resolved in order. On each result, the player may move one eligible piece once. The same piece may move twice if both results allow its type; different pieces may also be used. The player may voluntarily skip either result. A result with no legal eligible move must be skipped. After both results have been used or skipped, the next seat takes its turn.

This two-actions-per-turn procedure is the playable form described by the current Wikipedia summary. Al-Biruni records a pair of dice and one move per number but does not fully explain their procedure; Murray treats the details as uncertain.

Dice are generated only from an injected seed. The pure rules engine has no ambient randomness. The first pair is part of the starting FEN. A later pair is stored as an explicit `ROLLxy` replay event, where `x` and `y` are the two faces. The Worker supplies a fresh unpredictable seed after each completed seat turn; local play supplies a fresh seed from its host environment. Roll events are not player actions and never appear in `legalUci()`.

## Captures and scoring

Capturing a piece removes it from the board and transfers it to the capturing seat's captured-piece pool. The capturer earns:

| Captured piece | Points |
| --- | ---: |
| Pawn | 1 |
| Boat | 2 |
| Horse | 3 |
| Elephant | 4 |
| King | 5 |

The score is attached to the controlling player for the move. If the same player captures all three opposing Kings while their own King remains on the board, their final score is set to 54, the historic maximum representing all three opposing armies. This is a total score, not an additional 54-point bonus.

The game ends immediately after the third King is captured (one King remains). All players' capture points are compared; tied high scores share the result. The 54-point condition applies only when one player is credited with capturing each of the three opposing Kings while their own King remains. The sources describe capture values and the special score, but do not give a complete modern termination code; this end condition is an explicit digital procedure.

## Promotion

When a Pawn reaches the far edge, map its square along that edge to the opposing back line from the nearest corner toward the center: the four promotion squares map in order to Boat, Horse, Elephant, King. Thus Red promotes on `a5`–`a8`, Green on `e8`–`h8`, Yellow on `h1`–`h4`, and Black on `a1`–`d1`. It may promote only to that mapped type, and only if the type is in its controller's captured-piece pool; the pool item is consumed. If unavailable, it remains a Pawn. A Pawn remaining on the far edge may promote on a later turn when the required captured type becomes available. King promotion is allowed when King is the mapped target and a captured King is available.

This operationalizes the rule in the Wikipedia summary that promotion follows the piece that began on the corresponding file/rank and requires that piece type to have been captured. Deferring an unavailable promotion is the digital convention.

## Boat triumph

After a Boat move, inspect every 2×2 square containing its destination. If the four squares contain exactly one Boat of each color, remove the other three Boats and award the mover three Boat captures and 6 points. This rule is called *vrihannauka* or Boat triumph in the later account summarized by Wikipedia.

## Sinhasana and army control

Each King has a fixed throne square: its starting square. When a King moves onto the starting square of another King, the mover gains a *sinhasana*. If that square is the opposite ally's throne, the moving player's seat takes control of both armies. The ally's pieces remain in place; its seat no longer acts independently. The new controller acts for each army at that army's normal position in the turn order. Captures by either army score for the controller. The game UI and room state must show the takeover and keep the affected color's pieces visually distinct.

The later Sanskrit account describes the throne and takeover rule; the modern implementation uses the opposite pairs in the setup table. The earliest account does not settle partnership behavior, so the alliance and takeover mapping is a documented reconstruction choice.

## Digital results and replay

- The engine stores board, turn, active army, controller map, die pair/index, scores, captured-piece pools and King-capture ownership in its FEN.
- `ROLLxy` is a replay action accepted by `move()` only while waiting for the next pair; it is never offered as a legal player move.
- `pass` consumes the current die result and is a legal player action. It is optional when a move exists and required when none exists.
- Every board action, pass and roll is serializable and undoable. Replaying the start FEN and the UCI sequence reproduces each roll, board, score and controller.
- This is a no-clock game. Private online rooms require all four seats, validate every board action on the server, and generate random rolls on the server. The engine never uses network, timers, DOM state, or ambient randomness.
- This v1 does not provide a draw agreement or resignation. No automatic repetition draw is imposed.
