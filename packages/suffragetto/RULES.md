# Suffragetto rules contract

## Edition and sources

Use the surviving WSPU / Sargeant Bros. second-edition rules. This is the best-documented playable edition;
the available record does not establish a statistically most-popular variant. The exact first publication
date is unresolved between sources describing the game around 1907–08, an object around 1909 and a surviving
second-edition copy catalogued in 1917. See [`apps/suffragetto/docs/reports/Suffragetto rules and
rights.md`](../../apps/suffragetto/docs/reports/Suffragetto%20rules%20and%20rights.md).

## Board and setup

- Coordinates use files `a`–`q` and ranks `1`–`17`; `a1` is the Suffragette-side bottom-left corner. The
  view may be rotated for each player.
- All 289 cells belong to the 17×17 board. The Arena envelope is files `e`–`m`, ranks `1`–`17`; the
  House of Commons and Albert Hall are each 3×2 cutouts, so their 12 cells are not pink Arena capture
  squares. The pink Arena has 141 cells.
- Exact coordinate masks and setup are in [`apps/suffragetto/docs/board-coordinates.md`](../../apps/suffragetto/docs/board-coordinates.md):
  - House: files `h`–`j`, ranks 13–14; Albert Hall: files `h`–`j`, ranks 4–5.
  - Prison: file `a`, ranks 1–17, and file `b`, ranks 14–17 (21 cells). Prison Yard: file `b`, ranks 1–6.
  - Hospital: file `q`, ranks 1–17, and file `p`, ranks 1–4 (21 cells). Hospital Grounds: file `p`, ranks
    12–17.
  - Suffragette setup: `g4`, `k4`; `e5`–`g5`, `k5`–`m5`; all files `c`–`o` on rank 6. Police setup is
    the rank-reflected arrangement: all files `c`–`o` on rank 12; `e13`–`g13`, `k13`–`m13`; `g14`, `k14`.
- Both players have 16 rank-and-file pieces and five large pieces: a Leader plus four assistants, or an
  Inspector plus four constables. The `S` and `P` markings determine starting positions. Large Suffragette
  starts: `i6`, `c6`, `o6`, `e5`, `m5`; large Police starts: `i12`, `c12`, `o12`, `e13`, `m13`. The first
  player is chosen by coin toss in the source; the product exposes a first-side choice.

## Movement and capture

- A turn moves one piece one adjacent empty cell in any of eight directions, or chains hops with the same
  piece. Each hop passes over one occupied adjacent cell and lands in the empty cell immediately beyond.
- A route may change direction and hop either player's pieces. Hops and steps must obey the zone masks.
- Prison, Hospital, Prison Yard and Hospital Grounds are not ordinary destinations or spaces to hop over.
  Suffragettes may not enter Albert Hall; police may not enter the House of Commons. Once a piece enters its
  opponent's goal building, it cannot leave but may move within that building.
- Opponents are captured only by a hop while they stand in a pink Arena cell. Goal buildings are not pink
  Arena. Rank-and-file captures are diagonal;
  Leaders and Inspectors capture in any direction. A legal hop that does not satisfy capture conditions is a
  non-capturing hop.
- Captured Suffragettes move into Prison; captured police move into Hospital. They remain in the game and
  count toward exchange eligibility.
- Capture takes effect during the chain. This digital convention removes the captured piece immediately so
  its former cell is empty for later hops; source wording does not specify timing within the route.
- A landing square cannot be visited twice in one chain. The source does not limit repeated landings; this
  digital convention prevents a route from looping indefinitely.

## Exchanges

- An exchange is eligible when Prison and Hospital each hold at least 12 pieces.
- Either player may demand an exchange of up to six equal-rank pairs; no consent is required. A released
  Suffragette starts in Prison Yard; a released police piece starts in Hospital Grounds.
- The initiating player chooses the number and matching ranks of the pairs. The original rules do not
  prescribe which individual captives to select; this is a digital convention.
- The engine selects captives in ascending holding-area coordinate order, large pieces first, then small pieces.
  Released pieces occupy the lowest available staging coordinates in the same order. This deterministic
  convention lets moves replay identically.
- No further exchange may be demanded while either staging area has any piece in it.
- An exchange is one action/turn. Its move notation is `X<small-pairs><large-pairs>@<first-own-stage>`;
  for example, `X21@b1` exchanges two small pairs and one large pair. It automatically releases both sides,
  whose placements are serialized in the resulting board position.

## Endings and digital conventions

- Fill all six cells in the opposing goal building to win. This implements the source's first-to-place-six
  pieces rule using the six cells shown on the board.
- Threefold repetition is a draw. Include all on-board pieces, prisoner/staging contents, pending exchange
  state if any, and side to move in the repetition key.
- No legal move is a loss. The source gives no no-move result.
- No 50-move rule is added. There are no kings, check, promotion, or other piece types.
- A player with a full goal building wins immediately after the completing action. Because turns alternate,
  simultaneous wins are not expected.
- Apply captures and goal victory at each route landing; a captured enemy removed to holding cannot also
  satisfy a goal-occupancy test.

## Serialization and testing

Serialize side to move, all 289 grid cells, zone identity or a stable board-map version, piece types, and
prison/hospital/staging contents. The board map is a pure constant; FEN or equivalent notation must not
depend on the DOM, network, wall clock or unseeded randomness. Encode a chained hop as source plus each
landing coordinate in order. Encode exchange as an explicit action carrying the selected matched pairs.

Tests must cover the board map and setup markers, every movement/capture rule, chains, restricted zones,
holding transfers, exchange thresholds and pair ranks, goal entry/lock/occupation, no-move loss, repetition,
serialization, undo/replay, seeded playouts and shared `Variant` conformance.
