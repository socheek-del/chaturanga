# Chaturaji rules and adoption

Research date: 2026-11-26.

## Selection

The roadmap target is the historically attested four-seat dice form described by Al-Biruni around 1030. Al-Biruni's account, in Sachau's 1910 translation, provides the most direct rules witness; Murray's 1913 history compares it with a later Sanskrit account and identifies the missing procedures. The later diceless four-hand game reported in India near 1900 is a distinct alternative. Evidence reviewed does not establish a current or historical popularity winner, so this is a source-based selection rather than a popularity claim.

## Rules evidence

The selected game uses an 8×8 board and four armies of eight pieces: King, Elephant, Horse, Boat/Rook and four Pawns. The elephant moves orthogonally as a rook, the horse as a knight, and the boat jumps two squares diagonally. The King moves one square in any direction and is capturable without a check rule. Pawns move one square forward and capture diagonally forward. The historical die mapping is 1 or 5 for Pawn/King, 2 for Boat/Rook, 3 for Horse, and 4 or 6 for Elephant. Captures score 1/2/3/4/5 by piece type; retaining one's own King while capturing the other three Kings earns the reported 54-point special score.

The source does not settle a complete playable procedure. Murray calls out ambiguities in how the pair of dice determine actions, what to do when a result has no usable move, whether dice remain in use throughout, promotion details and turn direction. The later Raghunandana source adds named special positions, but it is incomplete. Wikipedia's present summary includes a two-move-per-turn procedure, optional skipped results, promotion, Boat triumph and *sinhasana*, but these cannot all be read as certain words from the earliest account.

The v1 contract is pinned in `packages/chaturaji/RULES.md`: full 8×8 board; Red east, Green south, Yellow west and Black north; clockwise seats; two six-sided results and at most one action per die; optional pass; independent capture points; finish at the third original King capture; plus the 54 total-score condition. The contract adopts Boat triumph and the opposite-alliance throne takeover from the later account summarized by Wikipedia. Promotion maps the far-edge squares symmetrically to Boat, Horse, Elephant and King from the nearest corner inward, with the corresponding captured piece required. Seeded initial FENs and later `ROLLxy` records make chance replayable without ambient randomness. These operational details are labeled digital conventions wherever the sources do not decide them.

## Adoption and rights limits

Al-Biruni's account is historical evidence. Murray notes that the dice form had been replaced by a simpler diceless form by the late nineteenth century. The sources provide no participation statistics or contemporary tournament evidence that would justify calling either form the most popular. The dice form remains the roadmap target because it preserves the game's distinguishing historic mechanic and is the entry's best-attested early profile.

The implementation should use mechanics only, with original prose, code, board diagram, art and product design. The historical accounts are public-domain research sources; no current rights-holder contact or digital license has been identified as a prerequisite for this clean-room historical implementation.

## Sources

- [Al-Biruni, *Alberuni's India*, Sachau translation (1910), vol. I, chapter 16](https://www.gutenberg.org/cache/epub/79672/pg79672-images.html)
- [H. J. R. Murray, *A History of Chess* (1913), chapter III](https://upload.wikimedia.org/wikipedia/commons/2/2f/A_History_of_Chess.pdf)
- [Maria Schetelich, “Al-Biruni's Notes on Indian Four-Handed Chess – Some Remarks” (2018)](https://www.chessware.de/mediafiles/Leseproben/Caissa_Schetelich.pdf)
- [Wikipedia: Chaturaji](https://en.wikipedia.org/wiki/Chaturaji)
- [Ludii Digital Ludeme Project, Four-Player Chaturanga (al-Biruni)](https://ludii.games/details.php?keyword=Four-Player+Chaturanga+%28al-Biruni%29)
- [U.S. Copyright Office, “Games”](https://www.copyright.gov/register/tx-games.html)

Further detail and source-specific open questions are in [`research_notes/`](../research_notes/).
