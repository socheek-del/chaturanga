# Senterej rules contract

This package is a clean-room reconstruction of the historical Ethiopian/Eritrean chess game documented by
Walter Plowden in 1868 and corroborated by Richard Pankhurst (1971), H. J. R. Murray (1913), and later
source-led summaries. The profile is historical; no contemporary popularity ranking is claimed.

## Board and initial position

- The board has 8 files (`a`–`h`) and 8 ranks (`1`–`8`). The traditional board is uncheckered, with square
  boundaries drawn on a red surface. Rendering is product-owned and need not imitate historical materials.
- Ivory starts on ranks 1–2 and Gold on ranks 8–7. On rank 1, from `a1` to `h1`: Der, Feres, Saba, Ferz,
  Negus, Saba, Feres, Der. Rank 2 contains eight Medeq. Gold's back rank is Der, Feres, Saba, Negus, Ferz,
  Saba, Feres, Der; rank 7 contains eight Medeq. Thus Ivory Negus is `e1` and Gold Negus is `d8`, with Ferz
  on `d1` and `e8` respectively.
- In a displayed FEN, use `r` Der, `n` Feres, `b` Saba, `q` Ferz, `k` Negus, `p` Medeq; uppercase is Ivory,
  lowercase Gold. This letter mapping is a digital convention, not a historic notation.

## Movement and capture

- **Negus (King):** one square in any of the eight directions.
- **Ferz (Counselor):** one square diagonally. A Medeq promotes automatically to a Ferz on the far rank.
- **Saba / Fil (Elephant):** jumps exactly two squares diagonally. The intervening square may be occupied;
  the landing square must be empty or contain an enemy piece.
- **Feres (Horse):** the ordinary chess knight jump.
- **Der (Castle):** any unobstructed number of empty squares orthogonally; it may capture an enemy on the
  endpoint square.
- **Medeq (Pawn):** one square forward into an empty square; captures one square diagonally forward. There is
  no double-step or en passant. Capture is never compulsory. A promoted Medeq becomes a Ferz.
- There is no castling. Ordinary turns alternate after Werera. A player may not leave their Negus in check;
  checkmate ends the game.

## Werera (free mobilization)

- The game begins in Werera. Either player may make a legal geometric move of one of their own pieces at any
  time, repeatedly, without waiting for the other player or matching their move count.
- The selected digital profile ends Werera on the first capture of any piece. Plowden's 1868 wording says
  Werera continues until a player “takes a pawn”; the catalog and several later summaries say first capture.
  This implementation follows the latter formulation and treats the difference as an explicit reconstruction
  choice.
- A player may retract any of their own non-capturing Werera moves and substitute another. An online server
  serializes accepted inputs by arrival order. It accepts a retraction only if the remaining action sequence
  still replays legally and stays in Werera; no capture action can be retracted.
- During Werera, check does not constrain geometric moves and does not itself end the opening. Once a capture
  ends Werera, ordinary check legality applies. If the resulting side to move has no legal evasion from
  check, the game is checkmate.
- The side that did not make the first capture receives the first ordinary turn. The historical sources
  describe the transition to alternating play but do not specify this first side; this is a digital convention.

## Endings

- Checkmate wins.
- A Negus with no surviving non-pawn piece cannot be mated; draw immediately when its last non-pawn support
  is removed. Medeq alone does not count as capital support.
- If exactly one non-pawn supporting piece remains beside a Negus, the opponent must checkmate before that
  supporting piece has made seven moves. Count that piece's own moves beginning when it becomes the only
  non-pawn support. If the seventh move is completed first, the game is drawn. If that side gains another
  non-pawn piece before then, cancel the count.
- Stalemate is a draw, following the ordinary chess convention; Plowden's text discusses checkmate and
  material endings but does not separately define stalemate.
- Repetition is a draw after a position has occurred three times in normal play. This is a digital draw rule,
  stated explicitly because the historical sources reviewed do not define repetition.

## Source decisions and limits

1. Plowden says Kings are opposite but does not give coordinates. The later source-led starting setup used here
   places Ivory Negus at `e1`, Gold at `d8`, and the Ferzes opposite those respective Kings.
2. Plowden describes the Ferz as moving one step in any direction but capturing diagonally. Salt (1809), the
   *Encyclopaedia Aethiopica* and later summaries use the Shatranj one-diagonal move; this contract chooses the
   one-diagonal Ferz.
3. Plowden's promotion rule is Ferz. A later source notes a competing convention that permits a captured
   piece type; this contract chooses automatic Ferz promotion.
4. Check, stalemate, repetition and the first ordinary side are normalized in this digital profile above.
   Historical provenance remains part of the product tutorial and rules page.

## Sources

- [Plowden, *Travels in Abyssinia and the Galla Country* (1868), pp. 149–151](https://upload.wikimedia.org/wikipedia/commons/3/37/Travels_in_Abyssinia_and_the_Galla_country_-_with_an_account_of_a_mission_to_Ras_Ali_in_1848_%28IA_travelsinabyssin00plow%29.pdf)
- [Pankhurst, “History and Principles of Ethiopian Chess” (1971)](https://www.jstor.org/stable/41967474)
- [Murray, *A History of Chess* (1913), pp. 359–364](https://archive.org/details/historyofchess00murr)
- [ChessBase's source-led Senterej summary](https://en.chessbase.com/post/senterej-ethiopian-che-with-a-flying-start/58)
- [Wikipedia: Senterej](https://en.wikipedia.org/wiki/Senterej)
- [Ludii: Säntäräj](https://ludii.games/details.php?keyword=Santaraj)
