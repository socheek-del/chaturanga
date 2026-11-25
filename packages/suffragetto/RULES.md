# Suffragetto rules contract

## Edition and sources

Use the surviving WSPU / Sargeant Bros. second-edition rules. This is the best-documented playable edition;
the available record does not establish a statistically most-popular variant. The exact first publication
date is unresolved between sources describing the game around 1907–08, an object around 1909 and a surviving
second-edition copy catalogued in 1917. See [`apps/suffragetto/docs/reports/Suffragetto rules and
rights.md`](../../apps/suffragetto/docs/reports/Suffragetto%20rules%20and%20rights.md).

## Board and setup

- Coordinates use files `a`–`q` and ranks `1`–`17`; the view may be rotated for each player.
- The full grid has 17×17 cells. The centered 9×17 cells form the Arena. Prison/Hospital, staging areas,
  goal buildings, and the marked `S`/`P` setup cells are encoded in a separately tested board-layout map.
- Extract that map from the archival board before implementing move generation. The source prose does not
  provide a complete coordinate table. Never infer a missing cell silently.
- Each side starts with 16 rank-and-file and five large pieces: a Leader plus four assistants, or an
  Inspector plus four constables. The `S` and `P` markings determine starting positions. The first player is
  chosen by coin toss in the source; the product exposes a first-side choice.
- In each side's marked arrangement, put one large piece in the middle cell of the front row and the other
  four on the outermost cells of the front and second rows; the remaining marked cells receive the 16
  rank-and-file pieces. The board coordinate map defines row direction and cell order.

## Movement and capture

- A turn moves one piece one adjacent empty cell in any of eight directions, or chains hops with the same
  piece. A hop passes over one occupied adjacent cell and lands in the empty cell immediately beyond.
- A route may change direction and hop either player's pieces. Hops and steps must obey the zone masks.
- Prison, Hospital, Prison Yard and Hospital Grounds are not ordinary destinations or spaces to hop over.
  Suffragettes may not enter Albert Hall; police may not enter the House of Commons. Once a piece enters its
  opponent's goal building, it cannot leave but may move within that building.
- Opponents are captured only by a hop while they stand in the Arena. Rank-and-file captures are diagonal;
  Leaders and Inspectors capture in any direction. A legal hop that does not satisfy capture conditions is a
  non-capturing hop.
- Captured Suffragettes move into Prison; captured police move into Hospital. They remain in the game and
  count toward exchange eligibility.
- Capture takes effect during the chain. This digital convention removes the captured piece immediately so
  its former cell is empty for later hops; source wording does not specify timing within the route.

## Exchanges

- An exchange is eligible when Prison and Hospital each hold at least 12 pieces.
- Either player may demand an exchange of up to six equal-rank pairs; no consent is required. A released
  Suffragette starts in Prison Yard; a released police piece starts in Hospital Grounds.
- The initiating player chooses the number and matching ranks of the pairs. The original rules do not
  prescribe which individual captives to select; this is a digital convention.
- No further exchange may be demanded while either staging area has any piece in it.
- An exchange is one action/turn and must be serialized as a game move by the engine. Represent the
  automatically released counterpart and both resulting staging placements in the serialized position and
  move notation.

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
