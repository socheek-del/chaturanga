# Arimaa — selected rules profile

This product follows the official standard two-player Arimaa rules. It does not use Fast Rules or themed football/rugby rules. The source profile is the official [rules introduction](https://arimaa.com/arimaa/learn/rulesIntro.html), [notation](https://arimaa.com/arimaa/learn/notation.html), and [learn-to-play index](https://arimaa.com/arimaa/learn/). The 2024 analysis is a secondary technical cross-check, not a replacement ruleset: [Arimaa's rules and complexity](https://research-portal.uu.nl/ws/portalfiles/portal/240416931/LIPIcs.FUN.2024.27.pdf).

## Board, pieces and setup

- The board is 8×8. Gold starts on ranks 1–2 and advances toward rank 8; Silver starts on ranks 7–8 and advances toward rank 1.
- The trap squares are c3, f3, c6, and f6.
- Each side has one Elephant, one Camel, two Horses, two Dogs, two Cats, and eight Rabbits. Relative strength is Elephant > Camel > Horse > Dog > Cat > Rabbit.
- Gold chooses and places all 16 pieces on its two home ranks. Silver then chooses and places all 16 pieces on its two home ranks. There is no canonical opening arrangement. Gold moves first after setup.

## Turns and movement

- A turn contains up to four orthogonal one-square steps. A complete turn must change the position; a player cannot pass or make a sequence that returns to the same position without changing it.
- All pieces step one square orthogonally, subject to occupancy, strength and freezing. A Rabbit cannot step backward under its own power.
- A piece is frozen when an adjacent stronger enemy exists and no adjacent friendly piece supports it. A frozen piece cannot move under its own power; it can still be moved by an enemy push or pull.
- A stronger enemy piece may push a weaker adjacent piece through a two-step sequence: first move the enemy piece, then move the stronger piece into the vacated square. A stronger piece may pull a weaker adjacent enemy by moving itself first, then moving the enemy into the vacated square. These sequences consume two of the mover's four turn steps and cannot be interrupted by ending the turn.
- Trap captures resolve after each step. A piece on a trap is captured immediately if it has no adjacent friendly piece. The rule applies to either side and can capture multiple unsupported pieces after one step.

## Victory and repetition

- Win by reaching the far goal rank with a Rabbit at the end of the turn, capturing all opposing Rabbits, or leaving the opponent without a legal turn.
- Repetition is checked with the same player to move. A third occurrence is prohibited. If every otherwise legal turn would create the prohibited repetition, the player to move loses.
- Apply the official priority/order for simultaneous goal, Rabbit-elimination, immobilization, and repetition results. Add a fixture for each overlapping result before accepting the engine.

## Digital conventions and verification targets

- Display complete turns as sequences of up to four steps. Keep each push/pull together as a two-step action in the input flow while preserving the canonical step sequence for replay and protocol validation.
- In the protocol, encode each step as its four-character origin/destination pair (for example, `a2a3`); concatenate two to four pairs for one complete turn. Setup placements use the shared drop form such as `E@a1`.
- Preserve chosen setup placement and turn history in serialized state. Online and local replay must produce the same position after every step and completed turn.
- Do not create generic draw-by-repetition behavior; forced third repetition is a loss as specified above.
- Source-supported fixtures must cover setup counts/areas, each piece strength and Rabbit direction, freezing/support, push/pull, trap captures after individual steps, four-step turns, every win condition, result-order edge cases and third repetition.
