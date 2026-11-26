# Infinite Chess Classical rules contract

**Status:** source profile for planning only; no rules engine exists. Implementation is blocked pending an applicable adaptation-rights basis.

**Primary source:** [InfiniteChess.org guide](https://www.infinitechess.org/guide).

**Adoption note:** Classical is the official site's default and a documented tournament edition. No comparative usage data was found, so this is not claimed as a proven popularity winner. See [`apps/infinite-chess/docs/reports/Infinite Chess rules adoption and rights.md`](../../apps/infinite-chess/docs/reports/Infinite%20Chess%20rules%20adoption%20and%20rights.md).

## Board and coordinates

- The board is an unbounded square lattice in all directions. Rules must not impose a board edge.
- A square is an integer coordinate pair `(x,y)`. The guide maps chess `a1` to `(1,1)` and `h8` to `(8,8)`.
- The position is sparse: only occupied coordinates need storage. Coordinate arithmetic and serialization must preserve exact integer values; viewport limits are presentation details.

## Starting position and pieces

- Use the normal two-player chess starting arrangement embedded in the infinite lattice, pending confirmation against the official Classical preset: White's back rank at `y=1`, pawns at `y=2`; Black's pawns at `y=7`, back rank at `y=8`; files `x=1..8`.
- Use orthodox chess piece movement. Rooks, bishops and queens may slide any unobstructed distance; the board places no maximum range on them.
- Knights hop as in orthodox chess. Kings move one adjacent square, subject to check restrictions.
- Pawns advance and capture as in orthodox chess. The source says White promotes on rank 8 and Black on rank 1; a pawn need only reach that line. Confirm permitted promotion choices against the official Classical preset before coding.

## Play and endings

- Two players alternate individual moves. A move may not leave the mover's king in check.
- Checkmate wins. Stalemate is a draw.
- The guide explicitly names threefold repetition and the 50-move rule, castling and en passant as inherited classical rules. Pin exact counter reset, repetition identity, rights handling, castling destinations, and move-count semantics to the official Classical source before engine work.
- The guide does not specify clocks, resignation, agreement, or a digital adjudication procedure; these are product-layer decisions, not changes to movement.

## Required edge-case review before implementation

- Exact initial position and side to move.
- Promotion targets (standard four choices assumed only provisionally), trigger line, and resulting turn.
- En-passant target and expiry, including capture when coordinates are far from the original 8×8 area.
- Castling rights and attack/path rules on an unbounded board.
- Threefold-position identity, 50-move count and reset events.
- Finite decision procedures for check, checkmate and stalemate despite infinitely many possible sliding destinations.
- Exact-coordinate limits, serialization and server validation; do not silently round JavaScript numbers.

## Determinism and implementation boundary

When rights clear, the engine will be a pure serializable `Variant` with no DOM, network, timers or unseeded randomness. It will not enumerate an infinite board or all ray destinations. Any bot policy will be explicitly bounded and will still return only fully legal moves.
