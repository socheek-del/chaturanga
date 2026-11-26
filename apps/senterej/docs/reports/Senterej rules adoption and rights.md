# Senterej rules, historical variant and rights

**Research date:** 2026-11-26  
**Decision:** Proceed as a clean-room historical reconstruction; no modern popularity winner is claimed.

## Selected profile

Senterej is the historical Ethiopian/Eritrean form of chess. Richard Pankhurst reports that it disappeared
after the Italian invasion in the 1930s; the sources reviewed describe a historical profile, not a current
set of competing editions with comparable adoption. The roadmap therefore selects the documented historic
game and makes no claim about which version is most popular today.

Walter Plowden's 1868 book describes a 64-square board, a red uncheckered surface, its piece roster and moves,
free mobilization before capture, the lone-capital-piece seven-move rule and Ferz promotion. The scan is
public-domain material. Pankhurst's 1971 *Journal of Ethiopian Studies* article and Murray's 1913 *A History
of Chess* provide later historical context. ChessBase's source-led survey and the Wikipedia article expose
the opening and Ferz differences. Ludii publishes an explicit rule summary attributed to Pankhurst.

## Rules choices and conflicts

- **Setup:** Use the western 8×8 arrangement except the kings and Ferzes are staggered: White King e1/Ferz d1;
  Black King d8/Ferz e8. Two Der, two Feres, two Saba/Fil and eight Medeq complete each side. ChessBase and
  the Wikipedia diagram support this position. Plowden says the two Kings oppose one another but does not
  provide coordinates.
- **Pieces:** King moves one square in any direction. Ferz moves one square diagonally. Der slides orthogonally
  as a rook. Feres moves as a knight. Saba/Fil jumps exactly two squares diagonally. Medeq advances one square
  and captures one square diagonally forward. There is no double-step, en passant or castling in normal play.
- **Ferz conflict:** Plowden (1868) says the Ferz moves one square in any direction but captures only
  diagonally. Salt (1809), the *Encyclopaedia Aethiopica*, Wikipedia's default and later game models describe
  the Shatranj one-diagonal move. Select the one-diagonal Ferz and preserve Plowden's alternative in the
  source note.
- **Promotion conflict:** Plowden says a Medeq reaching the far rank takes Ferz powers. Wikipedia notes a
  different source allowing a captured-piece type. Select Plowden's automatic Ferz promotion.
- **Werera trigger:** Plowden's exact phrasing says play continues until a player “takes a pawn.” Wikipedia,
  the roadmap and several modern summaries say first capture. Follow the catalog's first-capture wording, for
  any piece, and make the deviation visible in the tutorial/source notes.
- **Turn after Werera:** Neither Plowden nor the modern summaries state whose turn follows the first capture.
  The product lets the side that did not make that capture move next.
- **King safety during Werera:** The sources describe movement and free mobilization without specifying
  whether a player can temporarily expose the Negus. The product checks geometric movement and occupancy but
  does not enforce check safety until the first capture enters alternating play.
- **Repetition/stalemate:** The historical references reviewed do not define repetition and do not clearly
  settle stalemate. Use threefold repetition as a draw and stalemate as a draw, explicitly as digital
  conventions.
- **Endings:** Checkmate wins. A bare King or King with only Medeq cannot be mated and is drawn. With exactly
  one non-pawn supporting piece, the opponent must mate before that piece has moved seven times; otherwise
  draw. Treat stalemate as a draw, following the normal chess convention, and state it as the digital rule.

## Digital and adoption scope

The Werera phase is not ordinary pass-and-play: either player may make repeated moves without waiting for a
turn, and can retract/substitute their own moves before the first capture. Online rooms will accept either
seat in that phase and keep an authoritative ordered history. A retraction is accepted when removing the
chosen own action leaves all later accepted actions legal and the game still in Werera. This gives the server
a deterministic serialization for a historically open process. The server's arrival order resolves competing
inputs; no simultaneous collision occurs unless a future source-backed rule requires one.

For single-device local play, both sides share the board during Werera. A bot takes one legal action as its
opportunity after a human action; this is an interface convention for a game with concurrent opening input,
not a claim that the historic process was alternating. Separate-device online rooms preserve independent
seat control.

## Rights and provenance

Plowden's edition was published in 1868 and is marked public domain by the source transcription. The review
found no modern publisher or licensing owner for this historical rule profile. Use only independently written
explanations, original board/piece art, and a clean-room implementation. Pankhurst and other later scholarship
remain cited as source material; do not copy their expressive text or another digital game's code/art. This is
the project's historical-game route, not a broad legal opinion about every Senterej-related asset or name.

## Sources

- [Plowden, *Travels in Abyssinia and the Galla Country* (1868), chapter VII](https://upload.wikimedia.org/wikipedia/commons/3/37/Travels_in_Abyssinia_and_the_Galla_country_-_with_an_account_of_a_mission_to_Ras_Ali_in_1848_%28IA_travelsinabyssin00plow%29.pdf) — primary public-domain account, pp. 149–151 (PDF lines 1522–1543 in the text extraction).
- [Plowden transcription and publication notes](https://www.habeshahistory.com/travellers/walter-plowden/read) — identifies the edition and public-domain status.
- [Pankhurst, “History and Principles of Ethiopian Chess” (1971)](https://www.jstor.org/stable/41965728) — scholarly source; bibliographic record confirms author, journal, pages 149–172.
- [Murray, *A History of Chess* (1913), pp. 359–364](https://archive.org/details/historyofchess00murr) — historical synthesis cited by the Wikipedia entry and Ludii.
- [ChessBase: Senterej – Ethiopian chess with a flying start](https://en.chessbase.com/post/senterej-ethiopian-che-with-a-flying-start/58) — setup, piece moves, Werera and Pankhurst attribution.
- [Wikipedia: Senterej](https://en.wikipedia.org/wiki/Senterej) — requested catalog description and explicit source conflicts.
- [Ludii: Säntäräj (Santaraj)](https://ludii.games/details.php?keyword=Santaraj) — structured modern rules summary and source list.
- [Habesha History: Senterej](https://www.habeshahistory.com/games/senterej) — a modern digital interpretation, used only to identify ambiguities; do not reuse its art, copy or code.
