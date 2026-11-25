# Congo rules contract

## Edition

Implement Demian Freeling's two-player Congo, invented in 1982. It is the 7×7 chess variant in the roadmap. Do not confuse it with the unrelated nineteenth-century four-player *Game of the Congo*. Selection and rights research: [`apps/congo/docs/reports/Congo rules and rights.md`](../../apps/congo/docs/reports/Congo%20rules%20and%20rights.md).

## Board and setup

The board has files a–g and ranks 1–7. Rank 4 is a one-rank river. White's castle covers c1–e3; Black's covers c5–e7. White moves first.

White's rank 1 is Giraffe, Monkey, Elephant, Lion, Elephant, Crocodile, Zebra; rank 2 has seven Pawns. Black mirrors this in lowercase on ranks 7 and 6. Empty ranks 3, 4 and 5 start clear.

## Movement

- **Lion (`l`)**: one step in any of eight directions, staying inside its own 3×3 castle, and may capture any enemy piece inside it. It may leave only to capture the opposing Lion along a clear file or diagonal. A Lion may enter an attacked square. There is no check state.
- **Zebra (`z`)**: leaps as a chess knight.
- **Elephant (`e`)**: moves or captures one or two orthogonal squares. A two-square move jumps the intervening square.
- **Giraffe (`g`)**: leaps exactly two squares in any of eight directions, or moves one king step without capturing.
- **Crocodile (`c`)**: one king step in any direction. On land it also slides any distance toward the river along its file; on rank 4 it can slide along the river rank. It cannot drown.
- **Monkey (`m`)**: one king step without capturing. It captures by jumping one adjacent enemy piece to the empty square immediately beyond, in any of eight directions. Capture is optional. A turn may contain several jumps, may change direction and revisit squares, but may not capture the same piece twice. Captured pieces stay on their squares as blockers until the route ends. The route ends when the player chooses; if a Lion is captured, the game ends immediately.
- **Pawn (`p`)**: moves and captures one square straight or diagonally forward. Once on the far bank beyond the river (White ranks 5–7; Black ranks 1–3), it may instead retreat one or two squares straight backward without capturing or jumping.
- **Superpawn (`s`)**: created automatically when a Pawn reaches the opposing back rank. It retains Pawn forward movement, adds one-square sideways movement/capture, and may retreat one or two squares straight or diagonally backward without capturing or jumping anywhere on the board.

## River

The Lion cannot enter rank 4. Every other piece except the Crocodile may enter it. A non-Crocodile piece ending a move in rank 4 has until the end of its next own turn to leave; if it remains in rank 4 then, remove it. A Monkey's full route is one move, so its final square determines whether it is in the river. The Crocodile never drowns.

In serialized positions, suffix `!` marks a non-Crocodile piece in rank 4 that must leave on its next own turn. Such a marker is invalid outside rank 4. A live position cannot contain an unmarked non-Crocodile on rank 4.

## Endings

- Capture the enemy Lion: immediate win.
- No legal move on your turn: loss.
- Only two Lions remain and neither can capture immediately: draw.
- A Lion and any other piece against a bare Lion is not automatically drawn.
- Digital convention: threefold repetition is a draw. The repetition key includes placement, side to move and river-exit markers. There is no check/checkmate or 50-move rule.

## Coordinate and FEN format

FEN uses seven slash-separated ranks, upper-case White and lower-case Black piece codes, followed by `w`/`b`, a reserved `-` field, halfmove and fullmove counters. Codes are `l z e g c m p s`; `!` after a non-Crocodile piece marks its pending river exit. The start FEN is `gmelecz/ppppppp/7/7/7/PPPPPPP/GMELECZ w - 0 1`.

Ordinary UCI is source+destination, such as `b1c3`. Automatic promotion ends in `+`, such as `a6a7+`. A Monkey multi-capture is source plus each landing square in order, such as `b2c3d4e5`; a normal move never serializes intermediate jump squares.

SAN for ordinary moves is `from-to` or `from×to`; a multi-capture lists each landing square separated by `×`, and promotion appends `=S`. Check symbols are never used. Tests must cover replay/undo, river markers, captures and every route endpoint, FEN round-trip, Variant conformance and all terminal cases.

## Sources

See [`apps/congo/docs/reports/Congo rules and rights.md`](../../apps/congo/docs/reports/Congo%20rules%20and%20rights.md#sources).
