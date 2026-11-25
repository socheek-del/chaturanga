# Altai Shatra rules

This package implements the current Altai tournament form associated with the 1983 *Shatra Code* (not the separate chess-piece army described by the English Wikipedia article). Local history reports that current competitions use the 1983 code. The [detailed local rules guide](https://vnbooks.ru/altai-shatra.pdf) gives its numbered board, starting army, reserves, alternating side-step rule and gate-capture rights. The [1974 rules write-up](https://igrovir.ucoz.ru/publ/altaj_shatra_pravila_igry/1-1-0-108) supplies a complete initial placement and capture explanation.

## Board and setup

The board is a 7×14 coordinate rectangle with 62 playable fields:

- A 7×6 main field, fields 11–52.
- A 3×3 fortress at each end, fields 1–9 and 54–62.
- One gate between each fortress and the main field, fields 10 and 53.
- The rows between main-field fields 25–31 and 32–38 form the ditch.

White sits at the bottom and moves first. White's Biy starts on 53, fourteen active Shatras occupy 39–52 and nine reserve Shatras occupy 54–62. Black's Biy starts on 10, fourteen active Shatras occupy 11–24 and nine reserve Shatras occupy 1–9. The remaining fourteen main-field cells start empty. The game has no check: the objective is to capture the opposing Biy. A player who has no legal move loses.

The 2015 rules-engine paper says each side has fourteen active and eleven reserve Shatras, but does not explain where the additional two reserves fit. The explicit 62-field setup in the detailed guide and the 1974 setup both give nine Shatras in each 3×3 fortress, so this implementation uses nine. This is a recorded source conflict, not an inferred off-board supply.

## Movement

- **Biy (`k`)** moves one step to any adjacent playable field. It may be captured and does not have to remain safe.
- **Shatra (`s`)** moves one step forward, one step diagonally forward, or one step sideways. It does not move backward. A Shatra that moves horizontally may not reverse its horizontal direction on its next turn; any intervening move by the same player clears that restriction.
- **Batyr (`b`)** moves any distance along an unobstructed rank, file or diagonal on the playable board.
- A Shatra that reaches one of the three marked fields in the opposing fortress becomes a Batyr. It uses Batyr movement immediately if this happens during a capture chain.

The 1983-code guide describes a horizontal reversal only after an intervening move. The older write-up's shorter description (“not backward”) does not include this timing rule; the tournament-code rule is used here. No initial two-square Shatra move or en-passant rule is included.

## Reserves and fortresses

An original reserve Shatra cannot make a quiet move within its fortress. It may be deployed, as one move, onto any empty field in its own half of the main field. A Shatra or Batyr that later reaches a gate or fortress gains the same reserve right and may be deployed onto the corresponding half of the main field. A Biy or Batyr in its own gate or fortress also has this deployment option.

A Shatra, Biy or Batyr cannot enter its own gate or fortress while any of that side's original reserve Shatras remain there. A Shatra on the main field cannot capture to a field in its own gate or fortress. Biy and Batyr cannot capture into their own gate or fortress while an original reserve remains. The opposing fortress is always enterable. A Shatra or Batyr there may deploy into the opponent's half of the main field.

## Captures

All captures are mandatory except for the Biy's right and a capture interrupted at a gate. The player chooses which capturing piece and which route to take; there is no maximum-capture rule across different pieces or routes.

- A Shatra and Biy capture an adjacent enemy by jumping to the next empty playable field in the same direction. A capture may go in any direction, including backward. A captured enemy cannot be jumped a second time in the same turn. The moving piece must continue along its chosen capture route while another capture is available, except as below.
- A Batyr captures an enemy on a clear rank, file or diagonal ray by jumping it to any empty playable field beyond it on that ray. It must continue its chosen capture route while another capture is available. It may revisit empty landing fields but may not jump one enemy twice. Captured pieces remain blocking until the entire turn ends.
- A capture chain may stop when its moving piece enters a gate. On a later turn the piece keeps the gate's “Biy right”: it may capture or make another legal move instead. A Shatra or Batyr may also stop a chain on a gate and continue on a later turn.
- The Biy may decline to capture or stop its own capture chain anywhere. If the Biy has a capture, the player must move the Biy that turn; it cannot substitute a quiet move by another piece.
- Capturing the opposing Biy ends the game immediately, even if a capture chain otherwise had more jumps.

## Endings and digital draw limits

Capturing the opposing Biy wins. Having no legal move also loses. There is no check, checkmate, castling or en passant.

The local sources do not describe repetition or a no-progress limit. For digital play, a position repeated three times with the same side to move and the same movement restrictions is a draw; 100 consecutive plies without a capture, reserve deployment or promotion is also a draw. These are app conventions to stop endless games, not claims about the tournament code.

## Notation and state

UCI uses the 7×14 grid coordinates (`a1`–`g14`). A multi-capture move lists its landing squares, for example `c5d6f7`. A reserve deployment is encoded as a move from the reserve piece's current field to its deployment field. Batyr promotion appends `b` when needed to disambiguate the promotion square. FEN retains the board, side to move, halfmove count, fullmove count and the Shatra horizontal-reversal restriction so online replay and undo reproduce legal moves.

## References and edition choice

- [1983-code history and current tournament use](https://zvezdaaltaya.ru/2015/02/entuziast-i-razrabotchik-pravil/)
- [Detailed board, movement, reserve and capture rules](https://vnbooks.ru/altai-shatra.pdf)
- [1974 initial setup and capture routes](https://igrovir.ucoz.ru/publ/altaj_shatra_pravila_igry/1-1-0-108)
- [2015 rules-engine paper (reports eleven reserve Shatras)](https://earchive.tpu.ru/jspui/bitstream/11683/17016/1/conference_tpu-2015-C04-v2-070.pdf)
- [English Wikipedia's distinct chess-piece army](https://en.wikipedia.org/wiki/Shatra_(game))
