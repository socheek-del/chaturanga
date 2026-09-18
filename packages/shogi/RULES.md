# Shogi rules, as implemented

`@chaturanga/shogi` follows Fairy-Stockfish's `shogi` variant, the same rule the other three engines
follow, with **two documented exceptions** at the end of this file. Everything here is checked by tests
(`src/*.test.ts`), most of it continuously against ffish 0.7.10 in `reference.test.ts`.

## Board and sides

- 9 files x 9 ranks. Pieces stand on squares.
- 先手 **Sente** moves first and is the engine colour `w`; 後手 **Gote** is `b`. Shogi calls the first
  player "Black", which is the opposite of every other game on this platform, so the code never uses the
  words black and white for the sides and the UI says Sente and Gote.
- Coordinates inside the engine are Fairy-Stockfish's: files `a`..`i` from the left, ranks `1`..`9` with
  rank 1 on Sente's side. The traditional 9..1 and 一..九 labels are a display mapping in the app.

## Pieces

| Piece       | Letter | Moves                                    | Promotes to                               |
| ----------- | ------ | ---------------------------------------- | ----------------------------------------- |
| King 王将   | K      | one square in any direction              | —                                         |
| Rook 飛車   | R      | any distance orthogonally                | Dragon +R: rook plus one diagonal step    |
| Bishop 角行 | B      | any distance diagonally                  | Horse +B: bishop plus one orthogonal step |
| Gold 金将   | G      | one square, except diagonally backwards  | —                                         |
| Silver 銀将 | S      | one square forward or diagonally         | +S, moves as a gold                       |
| Knight 桂馬 | N      | two forward and one across, jumping over | +N, moves as a gold                       |
| Lance 香車  | L      | any distance straight forward            | +L, moves as a gold                       |
| Pawn 歩兵   | P      | one square straight forward              | +P, moves as a gold                       |

## Promotion

- The promotion zone is a side's three furthest ranks (7-9 for Sente, 1-3 for Gote).
- A move that starts in, ends in, or crosses into the zone **may** promote. The engine lists both moves,
  `g8g9` and `g8g9+`, so the player chooses.
- Promotion is **forced** when the piece would otherwise never move again: a pawn or lance landing on the
  last rank, a knight landing on either of the last two. Only the promoting move is generated.
- A promoted piece keeps its promotion for the rest of the game, but goes back to hand unpromoted when
  captured.

## Captures and drops

- A captured piece changes owner and goes into the capturer's hand, unpromoted.
- On a turn, instead of moving, a player may **drop** a piece from hand onto any empty square, written
  `S@a2`. A dropped piece is never promoted, and dropping never captures or gives promotion.
- **Nifu 二歩**: a player may not drop a pawn onto a file that already holds an unpromoted pawn of theirs.
  A promoted pawn on the file does not count.
- A piece may not be dropped where it could never move again (a pawn or lance on the last rank, a knight
  on either of the last two).
- **Uchifuzume 打ち歩詰め**: a pawn drop that delivers immediate checkmate is illegal. Any other piece may
  be dropped for mate, and a pawn drop that only gives check is fine.

## End of the game

- **Checkmate**: the side to move is in check and has no legal move. The other side wins.
- **Stalemate**: the side to move is not in check and has no legal move. It **loses**. (This is vanishingly
  rare in Shogi, but it is the ruling Fairy-Stockfish applies.)
- **Sennichite 千日手**: the fourth occurrence of the same position — same board, same hands, same side to
  move — ends the game. It is a draw, unless one side gave check at every one of its turns through the
  repetition, in which case that side loses (perpetual check).
- There is **no n-move rule**. The halfmove field of the FEN still counts, and Fairy-Stockfish resets it on
  a capture, a drop or a promotion, but not on a plain pawn move.

## FEN

```
lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL[] w - - 0 1
```

- Rank 9 (Gote's back rank) first; upper case is Sente.
- A promoted piece is written with a `+` prefix, so a square can be two characters.
- Pieces in hand are in `[...]` after the placement, Sente's first, each side in Fairy-Stockfish's order
  `G N L P S R B`.
- The third and fourth fields are always `-`: Shogi has no castling and no en passant.

## Moves as text

- A board move is `from` + `to`, with `+` appended when it promotes: `g8g9`, `g8g9+`.
- A drop is the piece letter, `@`, and the square: `S@a2`.
- SAN follows Fairy-Stockfish: a promoted piece is written by the piece it moves like — `G` for a promoted
  pawn, lance, knight or silver, `D` for a dragon, `H` for a horse — a promotion adds `=` and the new
  letter (`Pxg9=G`), and check and mate add `+` and `#`.

## Where this engine differs from Fairy-Stockfish

Both differences are deliberate, and both are pinned by tests rather than hidden.

1. **Uchifuzume.** Fairy-Stockfish's `shogi` variant does not implement it: it will happily play a pawn
   drop that mates and score the game as a win. That is not Shogi, and a site that teaches the game must
   not allow it, so this engine forbids the move. `Game.uchifuzumeUci()` lists exactly the drops that the
   rule forbids in the current position, `perft(fen, depth, false)` and `generateLegalMoves(pos, false)`
   reproduce Fairy-Stockfish's behaviour, and `reference.test.ts` compares the union of our legal moves
   and those drops with ffish's list, so any _other_ difference still fails the test.
2. **Impasse (jishogi 持将棋).** Fairy-Stockfish does not adjudicate impasse at all — a position with both
   kings in the enemy camp and no mate in sight simply continues. This engine does the same: there is no
   27-point declaration, and such a game ends by sennichite or by agreement in the app. The rule can be
   added later without changing anything else, because it is a status ruling, not a move rule.
