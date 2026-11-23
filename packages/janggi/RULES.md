# Janggi rules (as implemented)

`packages/janggi` follows **Fairy-Stockfish's `janggi` variant** (tournament rules with bikjang and material
counting). Every rule is checked against ffish 0.7.10; `src/gameEnd.ts` and the legality rules in
`src/movegen.ts` are a port of `src/position.cpp` at commit `705dd366`.

Cho (楚, green, `w`) sits on ranks 1–5 and moves first; Han (漢, red, `b`) moves second.

## Pieces

| Piece | FEN | SAN | Points | Move |
| --- | --- | --- | --- | --- |
| General 楚/漢 | k | K | – | one point along the lines of its palace, diagonals only from the corners and the centre |
| Advisor 士 | a | A | 3 | as the general |
| Chariot 車 | r | R | 13 | any distance; also along the diagonals inside either palace |
| Cannon 包 | c | C | 7 | jumps exactly one piece to move or capture; never jumps or takes a cannon; also on palace diagonals |
| Horse 馬 | n | H | 5 | one straight, one diagonally outward; blocked by the first point |
| Elephant 象 | b | E | 3 | one straight, two diagonally outward; blocked by either point passed |
| Soldier 卒/兵 | p | P | 2 | one forward or sideways from the start; diagonally forward along palace diagonals |

Both generals start in the centre of the palace. Each side picks one of four arrangements of its horses and
elephants (`SETUPS`), so there are sixteen start positions (`START_FENS`).

## Passing

A pass is the general moving onto its own point (`e2e2`). It is legal unless the side is in check, or while the
generals face each other, when it is legal even in check. So there is no stalemate. The move list writes a pass
as `—`, where ffish writes a general move (`Ke2`): the only difference in SAN.

## Game end, in this order

1. **Bikjang**: the generals face each other in two consecutive positions. Points decide.
2. **Double pass**: two consecutive passes. Points decide.
3. **Insufficient material**: only generals and advisors are left. A draw.
4. **Checkmate**.
5. **50 moves**: 100 plies without a capture (passes count). Points decide.
6. **Threefold repetition**: a side that checked throughout, alone, loses (perpetual check); otherwise points decide.

Points are those on the board, plus 1.5 for Han, so they never tie. While the generals face each other a move
must end that, or be a pass.

## Tests

`src/reference.test.ts` plays seeded games in lock-step with ffish from all sixteen starts and from sparse
positions (60 and 300 in verify, 400 and 2,000 with `npm run test:deep`), comparing legal moves, SAN, FEN and
result on every ply, and fails unless every ending above occurs (insufficient material has its own named test).
`src/rules.test.ts` has one named case per rule, each also played on ffish; `src/perft.test.ts` uses
ffish-generated counts.
