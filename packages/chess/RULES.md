# Chess rules, as `@chaturanga/chess` implements them

International chess — the FIDE game. The rules authority is Fairy-Stockfish's `chess` variant, checked move
for move against ffish 0.7.10 (`src/reference.test.ts`, `src/perft.test.ts`). Where this engine and the FIDE
laws differ, it is written down here; nothing diverges silently.

## Board and pieces

- 8x8, files `a`..`h` from White's left, ranks `1`..`8` from White's side. Square 0 is a1.
- King, queen, rook, bishop, knight, pawn, with the usual moves.
- White moves first and is the engine colour `w`.

## Moves

- **Castling** is written as a king move of two squares: `e1g1` and `e1c1` for White, `e8g8` and `e8c8` for
  Black; SAN `O-O` and `O-O-O`. The rook moves with the king. It needs the right in the FEN, an empty path,
  and a king that is not in check, does not pass through an attacked square and does not land on one. The
  square the queenside rook passes (`b1`, `b8`) may be attacked.
- **Capture in passing** is written as an ordinary pawn move onto the empty square behind the pawn that
  double-stepped (`e5d6`), SAN `exd6`. It is available only on the move right after the double step.
- **Promotion** happens when a pawn reaches the last rank, and the player chooses a queen, rook, bishop or
  knight: `e7e8q`, `e7e8r`, `e7e8b`, `e7e8n`. There is no automatic queening; the move string always names
  the piece.

## How a game ends

| Ending | Result |
| --- | --- |
| Checkmate | The mating side wins |
| Stalemate | Draw |
| Insufficient material | Draw |
| Threefold repetition | Draw |
| Fifty-move rule | Draw |

- **Repetition** counts positions with the same placement, side to move, castling rights and en passant
  square. The third occurrence ends the game.
- **The fifty-move rule** counts plies since the last capture or pawn move; 100 plies end the game.

### Divergence from the FIDE laws: draws are not claimed

Under the FIDE laws, threefold repetition and the fifty-move rule give a player the **right to claim** a
draw; the game continues if nobody claims, and only fivefold repetition and 75 moves end it by themselves.
Fairy-Stockfish models this: `isGameOver()` stays false and `result()` prints `*` until a caller asks for
`claimDraw`.

This engine ends the game itself in both cases, which is owner decision D11 in `apps/chess/docs/PLAN.md`.
There is no claim button, and the online protocol has no claim message. A consequence is that fivefold
repetition and the 75-move rule can never be reached. The lock-step test against ffish compares against
`isGameOver(true)` / `result(true)`, so the two engines agree on every other ending.

### Insufficient material follows Fairy-Stockfish, not the FIDE wording

The FIDE laws end a game only when no legal series of moves can lead to mate. Fairy-Stockfish judges each
side separately, and this engine copies its answers exactly (probed against ffish 0.7.10):

- a bare king, one bishop or one knight against a bare king is a draw;
- any number of bishops on squares of **one** colour against a bare king is a draw;
- bishops on **both** colours, or two knights, are not — those are playable positions there;
- while each side still has a piece of its own, the position is playable, so `KB vs KB` and `KN vs KN` are
  not draws even though neither side can force mate.

## FEN

Standard chess FEN: `placement side castling ep halfmove fullmove`.

- Castling rights whose king or rook is not on its home square are dropped when the FEN is read, the way
  Stockfish validates one.
- The en passant square is written **only when an enemy pawn stands where it could capture there**, which is
  what Fairy-Stockfish writes. The capture itself may still be illegal (a pin along the rank or file), and
  the move generator drops it; the FEN still names the square.
- A FEN is rejected when it does not describe 8 ranks of 8 squares, names an unknown piece, gives either
  side other than exactly one king, puts a pawn on the first or last rank, names an impossible en passant
  square, repeats a castling right, has a bad clock, or leaves the side that is **not** to move in check.

## What this package does not do

- No Chess960 (owner decision D12): castling is always `e1g1` / `e1c1`.
- No draw offers or resignation: those are room state in `@chaturanga/server-kit`, not rules.
- No opening book, no evaluation, no search — those live in `@chaturanga/chess-ai`.
