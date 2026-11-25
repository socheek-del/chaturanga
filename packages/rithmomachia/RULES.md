# Rithmomachia rules: common medieval/Renaissance reconstruction

This package implements the rules family the linked Wikipedia article calls the most common
version of Rithmomachia. It is one clearly named reconstruction, not a claim that all historical
teachers used identical rules. The selection and every digital convention are recorded in
[`apps/rithmomachia/docs/PLAN.md`](../../apps/rithmomachia/docs/PLAN.md).

## Board and setup

- The board has 8 files (`a`–`h`) and 16 ranks (`1`–`16`).
- Black moves first.
- Each side occupies 24 starting squares: eight circles, eight triangles, seven squares, and one
  pyramid made from five or six components.
- The exact color, shape, number, and square fixture is `src/layout.ts`.
- White uses the even-sequence table; Black uses the odd-sequence table. These numbers are not
  chess piece values: arithmetic between them drives captures and victory.

## Movement

- A circle moves exactly one square diagonally.
- A triangle moves exactly two squares horizontally or vertically.
- A square moves exactly three squares horizontally or vertically.
- A pyramid may use any movement whose component remains in its stack.
- Moves land only on empty squares. No piece jumps over an occupied square.

## Captures and reserves

Capture is a separate action: the attacker stays in place. A captured component changes color and
goes into the captor's reserve. A later reserve-placement action may put it on an empty square in
the captor's home rank. A pyramid component becomes an individual piece in reserve; the remaining
stack keeps its own components and updated total. A siege removes every remaining component of a
pyramid.

- **Meeting:** equal values, with the target in the attacker's ordinary movement reach.
- **Assault:** along an unobstructed row, column, or diagonal, the attacker's value multiplied by
  the number of empty intervening cells equals the target's value. At least one empty cell must
  intervene.
- **Ambuscade:** two friendly pieces can each reach the target square by an ordinary move and their
  values sum to the target's value.
- **Siege:** the target is surrounded on all four orthogonal neighboring squares by the captor's
  pieces.

This reconstruction does not add subtraction or division captures. Captures are optional. Each
move, capture, or reserve placement consumes one turn.

## Victory and draws

The default win, called the great victory, is a straight line of three friendly pieces in the
opponent's half of the board at equal spacing, with values in arithmetic progression. Reserve
pieces may take part after they have been placed. A player with no legal action loses. Threefold
repetition and 200 plies without a capture are digital draw rules.

## Determinism and source boundary

Position parsing, move generation, captures, replay, and undo are deterministic and serializable.
The package has no DOM, network, timers, or ambient randomness. Source wording, modern summaries,
tables, illustrations, and scans are not shipped; product copy and visual assets are authored
independently.

The compact canonical position format starts with `r1.` and contains sorted occupied-square records,
side to move, plies since capture, and the two value-specific reserve lists. Start positions stay under
the online protocol's 200-character start-FEN limit.
