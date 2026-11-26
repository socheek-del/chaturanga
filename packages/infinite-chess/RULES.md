# Infinite Chess Classical rules contract

**Status:** selected source profile; sparse engine implemented after `plat-024`. Product-specific source uses product-local AGPL-3.0-or-later terms.

**Primary source:** [InfiniteChess.org guide](https://www.infinitechess.org/guide).

**Preset and rule implementation references:** reviewed at [source commit `b3b538e`](https://github.com/Infinite-Chess/infinitechess.org/tree/b3b538eb644a0e3ec283335738c224f520e8819f): [Classical preset](https://github.com/Infinite-Chess/infinitechess.org/blob/b3b538eb644a0e3ec283335738c224f520e8819f/src/shared/chess/variants/variantdictionary.ts), [default move-rule threshold](https://github.com/Infinite-Chess/infinitechess.org/blob/b3b538eb644a0e3ec283335738c224f520e8819f/src/shared/chess/variants/variant.ts), [counter reset](https://github.com/Infinite-Chess/infinitechess.org/blob/b3b538eb644a0e3ec283335738c224f520e8819f/src/shared/chess/logic/movepiece.ts), and [position state](https://github.com/Infinite-Chess/infinitechess.org/blob/b3b538eb644a0e3ec283335738c224f520e8819f/src/shared/chess/logic/state.ts). These are rule references; no upstream source code has been copied.

**Adoption note:** Classical is the official site's default and a documented tournament edition. No comparative usage data was found, so this is not claimed as a proven popularity winner. See [`apps/infinite-chess/docs/reports/Infinite Chess rules adoption and rights.md`](../../apps/infinite-chess/docs/reports/Infinite%20Chess%20rules%20adoption%20and%20rights.md).

## Board and coordinates

- The board is an unbounded square lattice in all directions. Rules must not impose a board edge.
- A square is an integer coordinate pair `(x,y)`. The guide maps chess `a1` to `(1,1)` and `h8` to `(8,8)`.
- The position is sparse: only occupied coordinates need storage. Coordinate arithmetic and serialization must preserve exact integer values; viewport limits are presentation details.

## Starting position and pieces

- Use the official Classical preset, with White to move. White pawns occupy `(1..8,2)` and the back rank at `y=1` is rook, knight, bishop, queen, king, bishop, knight, rook from `x=1` through `x=8`. Black has the mirrored setup at ranks 7 and 8.
- Use orthodox chess piece movement. Rooks, bishops and queens may slide any unobstructed distance; the board places no maximum range on them.
- Knights hop as in orthodox chess. Kings move one adjacent square, subject to check restrictions.
- Pawns advance and capture as in orthodox chess. White promotes on rank 8 and Black on rank 1; a pawn promotes as soon as it reaches that line, even when it began outside the opening files. Classical permits a choice of knight, bishop, rook or queen.

## Play and endings

- Two players alternate individual moves. A move may not leave the mover's king in check.
- Checkmate wins. Stalemate is a draw.
- The guide explicitly names threefold repetition and the 50-move rule, castling and en passant as inherited classical rules. The official implementation sets the move-rule threshold to 100 half-moves and resets its counter after a pawn move or capture. Castling and en passant use the orthodox special moves from the initial setup; en passant is available only immediately after a qualifying double pawn push. Position identity must include side to move, retained castling rights and an en-passant target only when it changes the legal move set.
- The guide does not specify clocks, resignation, agreement, or a digital adjudication procedure; these are product-layer decisions, not changes to movement.

## Verified edge-case coverage

- Exact initial position and side to move.
- Promotion targets, trigger line, and resulting turn.
- En-passant target and expiry, including capture when coordinates are far from the original 8×8 area.
- Castling rights and attack/path rules on an unbounded board.
- Threefold-position identity, 100-half-move counter and reset events.
- Finite decision procedures for check, checkmate and stalemate despite infinitely many possible sliding destinations.
- Exact-coordinate limits, serialization and server validation; do not silently round JavaScript numbers. Tests include
  values beyond the JavaScript safe-integer range and rays spanning one trillion squares.

## Determinism and implementation boundary

The implemented engine is a pure serializable `Variant` with no DOM, network, timers or unseeded randomness. It does
not enumerate an infinite board or all ray destinations. The bot's explicitly bounded candidate policy returns only
fully legal moves. The rules and tutorial suites cover special moves, legal check evasions, checkmate, stalemate,
threefold repetition, the 100-half-move draw and en-passant FEN validation.
